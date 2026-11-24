import Link from "next/link";
import { Bot, ShieldCheck } from "lucide-react";
import { pageData } from "@/lib/page";
import { AGENTS, type ProposedAction } from "@/lib/revenue/agents";
import { getEntitlements } from "@/lib/billing";
import { aiConfigured } from "@/lib/ai/claude";
import { can } from "@/lib/permissions";
import { memberName } from "@/lib/revenue/metrics";
import { timeAgo } from "@/lib/utils";
import { PageHeader, Card, StatusBadge, Evidence, Notice, Badge } from "@/components/app/ui";
import { AgentConfig, ApprovalButtons, RunAgent, EmailDraft } from "./AgentClient";
import { cn } from "@/lib/utils";

export const metadata = { title: "AI Agents" };

function describe(a: ProposedAction | null) {
  if (!a) return null;
  if (a.type === "create_task") return `Create task "${a.title}" due ${a.due_date}`;
  if (a.type === "update_deal") return `Update deal: ${Object.entries(a.changes).map(([k, v]) => `${k.replace("_", " ")} to ${String(v).replace("_", " ")}`).join(", ")}. Reason: ${a.reason}`;
  return `Draft an email${a.to ? ` to ${a.to}` : ""}: "${a.subject}"`;
}

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ status?: string; agent?: string }> }) {
  const sp = await searchParams;
  const { ctx, data, supabase } = await pageData();
  const ent = await getEntitlements(ctx.orgId);
  const [{ data: configs }, { data: acts }, { count: completed }] = await Promise.all([
    supabase.from("ai_agent_configs").select("*").eq("org_id", ctx.orgId),
    (() => {
      let q = supabase.from("ai_agent_activities").select("*").eq("org_id", ctx.orgId).order("created_at", { ascending: false }).limit(80);
      if (sp.status) q = q.eq("status", sp.status); else q = q.neq("status", "superseded");
      if (sp.agent) q = q.eq("agent_key", sp.agent);
      return q;
    })(),
    supabase.from("ai_agent_activities").select("id", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("status", "completed"),
  ]);
  const pending = (acts ?? []).filter((a) => a.status === "pending").length;
  const filter = (status: string, label: string) => <Link href={status ? `/dashboard/agents?status=${status}` : "/dashboard/agents"} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", (sp.status ?? "") === status ? "bg-navy text-white" : "bg-white text-body ring-1 ring-line")}>{label}</Link>;
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="AI Agents" description="Specialised agents analyse your revenue data and recommend actions with the evidence behind them. Nothing changes in your CRM, and no email is sent, without the permission you configure and a person's approval." />
      <Notice tone="info"><span className="inline-flex items-center gap-1.5 font-semibold"><ShieldCheck size={15} />Safeguards:</span> agents read data with the permissions of the person who runs them, deal updates always need approval, emails are only drafted, and every run, approval and rejection is written to the audit trail.{!aiConfigured() && " AI summaries are off because no Anthropic API key is configured; agents still run on rules with full evidence."}</Notice>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((a) => {
          const cfg = (configs ?? []).find((c) => c.agent_key === a.key) ?? {};
          const allowed = ent.agents.includes(a.key);
          return (
            <Card key={a.key} title={<span className="inline-flex items-center gap-2"><Bot size={16} className="text-blue" />{a.name}</span>} description={cfg.last_run_at ? `Last run ${timeAgo(cfg.last_run_at)}` : "Not run yet"} actions={!allowed && <Badge tone="warning">Upgrade</Badge>}>
              <p className="text-sm text-body">{a.purpose}</p>
              <p className="mt-2 text-xs text-muted"><span className="font-semibold text-ink">Reads:</span> {a.reads.join(", ")}</p>
              <p className="text-xs text-muted"><span className="font-semibold text-ink">Can propose:</span> {a.canPropose.join(", ")}</p>
              <div className="mt-4"><AgentConfig agentKey={a.key} config={cfg as Record<string, boolean>} canConfigure={can(ctx.role, "agent.configure")} allowed={allowed} /></div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
                {can(ctx.role, "agent.run") && <RunAgent agentKey={a.key} disabled={!cfg.enabled || !allowed} />}
                <Link href={`/dashboard/agents?agent=${a.key}`} className="text-sm font-semibold text-blue">Activity</Link>
              </div>
              {!allowed && <p className="mt-2 text-xs text-muted">Not included in the {ent.planName} plan. <Link href="/dashboard/billing" className="text-blue">See plans</Link></p>}
            </Card>
          );
        })}
      </section>

      <Card title="Recommendations and activity" description={`${pending} awaiting approval on this view · ${completed ?? 0} completed actions in total`} actions={<div className="flex flex-wrap gap-2">{filter("", "All")}{filter("pending", "Awaiting approval")}{filter("completed", "Completed")}{filter("rejected", "Rejected")}</div>} bodyClass="p-0">
        {(acts ?? []).length ? (
          <ul className="divide-y divide-line">
            {(acts ?? []).map((r) => {
              const action = r.proposed_action as ProposedAction | null;
              const agent = AGENTS.find((a) => a.key === r.agent_key);
              return (
                <li key={r.id} className={cn("px-5 py-4", r.kind === "run" && "bg-[#FAFBFE]")}>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="font-semibold text-blue">{agent?.name ?? r.agent_key}</span>
                    <span>·</span><span>{timeAgo(r.created_at)}</span>
                    {r.kind === "run" ? <span className="chip bg-canvas text-body ring-1 ring-line">Run</span> : <StatusBadge status={r.status} label={r.status === "pending" ? "Awaiting approval" : r.status === "info" ? "Insight" : undefined} />}
                    {r.target_user_id && <span>· For {memberName(data, r.target_user_id)}</span>}
                  </div>
                  <p className="mt-1 font-semibold text-ink">{r.opportunity_id ? <Link href={`/dashboard/deals/${r.opportunity_id}`} className="hover:text-blue">{r.title}</Link> : r.title}</p>
                  {r.body && <p className="mt-1 whitespace-pre-line text-sm text-body">{r.body}</p>}
                  <Evidence items={(r.evidence ?? []) as { label: string; value: string; href?: string }[]} />
                  {action && <p className="mt-2 text-xs"><span className="font-semibold text-ink">Proposed action:</span> {describe(action)}</p>}
                  {action?.type === "draft_email" && <EmailDraft to={action.to} subject={action.subject} body={action.body} />}
                  {r.result && <p className="mt-2 text-xs text-muted">Outcome: {r.result}{r.decided_by && ` (by ${memberName(data, r.decided_by)})`}</p>}
                  {r.status === "pending" && (can(ctx.role, "agent.approve") ? <div className="mt-3"><ApprovalButtons id={r.id} action={action} /></div> : <p className="mt-2 text-xs text-muted">A manager, administrator or revenue operations member can approve this.</p>)}
                </li>
              );
            })}
          </ul>
        ) : <p className="p-5 text-sm text-muted">Activate an agent and run it to see recommendations here.</p>}
      </Card>
    </div>
  );
}
