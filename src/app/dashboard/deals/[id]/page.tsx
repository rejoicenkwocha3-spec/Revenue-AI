import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, MessageSquareText, Pencil, Trash2, Users, Sparkles } from "lucide-react";
import { pageData } from "@/lib/page";
import { assessDeal } from "@/lib/revenue/dealHealth";
import { dealProbability, memberName, stageMap } from "@/lib/revenue/metrics";
import { optionsFrom } from "@/lib/options";
import { can } from "@/lib/permissions";
import { money } from "@/lib/format";
import { formatDate, timeAgo } from "@/lib/utils";
import { Card, HealthBadge, Badge, Evidence, Notice, StatusBadge, Avatar } from "@/components/app/ui";
import { FormButton, ActionButton } from "@/components/app/forms";
import { opportunityFields, activityFields, taskFields, contactFields } from "@/components/app/fieldsets";
import { CommentForm, StakeholderAdd, TaskCheck } from "../DealClient";
import { ApprovalButtons } from "../../agents/AgentClient";

export const metadata = { title: "Deal inspection" };

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx, data, supabase } = await pageData();
  const o = data.opportunities.find((x) => x.id === id);
  if (!o) notFound();
  const h = assessDeal(data, o);
  const stages = stageMap(data);
  const stage = stages.get(o.stage_id ?? "");
  const account = data.accounts.find((a) => a.id === o.account_id);
  const stakeholders = data.oppContacts.filter((c) => c.opportunity_id === o.id).map((c) => ({ link: c, contact: data.contacts.find((x) => x.id === c.contact_id)! })).filter((x) => x.contact);
  const activities = data.activities.filter((a) => a.opportunity_id === o.id);
  const meetings = data.meetings.filter((m) => m.opportunity_id === o.id).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const tasks = data.tasks.filter((t) => t.opportunity_id === o.id).sort((a, b) => (a.status === b.status ? (a.due_date ?? "").localeCompare(b.due_date ?? "") : a.status === "open" ? -1 : 1));
  const history = data.history.filter((x) => x.opportunity_id === o.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const [{ data: comments }, { data: recs }] = await Promise.all([
    supabase.from("deal_comments").select("id, body, created_at, author_id").eq("opportunity_id", o.id).order("created_at"),
    supabase.from("ai_agent_activities").select("id, agent_key, title, body, evidence, status, proposed_action, created_at").eq("opportunity_id", o.id).in("status", ["pending", "info"]).order("priority", { ascending: false }).limit(6),
  ]);
  const opts = optionsFrom(data);
  const canEdit = can(ctx.role, "deal.manage_any") || (ctx.role === "sales_rep" && (!o.owner_id || o.owner_id === ctx.userId));
  const canWrite = can(ctx.role, "crm.write");
  const linkable = data.contacts.filter((c) => (!o.account_id || c.account_id === o.account_id) && !stakeholders.some((s) => s.contact.id === c.id)).map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name ?? ""}`.trim() + (c.title ? `, ${c.title}` : "") }));
  const won = data.stages.find((s) => s.kind === "won");
  const lost = data.stages.find((s) => s.kind === "lost");
  const risks = h.factors.filter((f) => f.kind === "risk");
  const missing = h.factors.filter((f) => f.kind === "missing_information");
  const initial = { name: o.name, account_id: o.account_id ?? "", owner_id: o.owner_id ?? "", stage_id: o.stage_id ?? "", amount: String(o.amount), close_date: o.close_date ?? "", probability: o.probability != null ? String(o.probability) : "", forecast_category: o.forecast_category === "closed" ? "commit" : o.forecast_category, deal_type: o.deal_type, product: o.product ?? "", region: o.region ?? "", next_step: o.next_step ?? "", next_step_date: o.next_step_date ?? "", lead_source: o.lead_source ?? "", competitors: o.competitors.join(", "), description: o.description ?? "" };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <Link href="/dashboard/deals" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={15} />Deal Inspection</Link>
      <header className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={o.status} /><span className="chip bg-canvas capitalize text-body ring-1 ring-line">{o.deal_type.replace("_", " ")}</span>{o.status === "open" && <HealthBadge health={h.health} score={h.score} />}</div>
            <h1 className="mt-2 text-2xl font-extrabold">{o.name}</h1>
            <p className="mt-1 text-sm text-muted">{account ? <Link href={`/dashboard/accounts/${account.id}`} className="font-semibold text-blue hover:underline">{account.name}</Link> : "No account"} · Owner {memberName(data, o.owner_id)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && <FormButton label="Edit" icon={<Pencil size={14} />} className="btn btn-outline btn-sm" title="Edit opportunity" endpoint={`/api/opportunities/${o.id}`} method="PATCH" fields={opportunityFields({ ...opts, canAssign: can(ctx.role, "deal.manage_any") })} initial={initial} />}
            {canEdit && o.status === "open" && won && <ActionButton endpoint={`/api/opportunities/${o.id}`} method="PATCH" body={{ stage_id: won.id }} label="Mark won" className="btn btn-success btn-sm" />}
            {canEdit && o.status === "open" && lost && <ActionButton endpoint={`/api/opportunities/${o.id}`} method="PATCH" body={{ stage_id: lost.id }} label="Mark lost" confirm="Mark this deal lost?" className="btn btn-outline btn-sm" />}
            {can(ctx.role, "deal.manage_any") && <ActionButton endpoint={`/api/opportunities/${o.id}`} method="DELETE" label="Delete" icon={<Trash2 size={14} />} confirm="Delete this deal permanently?" className="btn btn-danger btn-sm" redirectTo="/dashboard/opportunities" />}
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {[["Deal value", money(o.amount, data.currency)], ["Stage", stage?.name ?? "Not set"], ["Probability", `${dealProbability(data, o)}%`], ["Expected close", o.close_date ? formatDate(o.close_date) : "Not set"], ["Forecast category", o.forecast_category.replace("_", " ")], ["Next step", o.next_step ? `${o.next_step}${o.next_step_date ? ` (${o.next_step_date})` : ""}` : "Not set"]].map(([k, v]) => (
            <div key={k} className="min-w-0"><dt className="text-xs text-muted">{k}</dt><dd className="mt-0.5 break-words font-semibold capitalize text-ink">{v}</dd></div>
          ))}
        </dl>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {o.status === "open" && (
            <Card title="Deal health" description="Calculated from recorded activity, stakeholders, stage timing and close dates. Each factor shows its evidence.">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-canvas p-4"><p className="text-xs text-muted">Deal score</p><p className="font-display text-3xl font-extrabold text-navy">{h.score}<span className="text-base text-muted">/100</span></p><HealthBadge health={h.health} /></div>
                <div className="rounded-xl bg-canvas p-4"><p className="text-xs text-muted">Buyer engagement</p><p className="font-display text-3xl font-extrabold text-navy">{h.engagementScore}<span className="text-base text-muted">/100</span></p><p className="text-xs text-muted">Activity, meetings and contacts in the last 30 days</p></div>
                <div className="rounded-xl bg-canvas p-4"><p className="text-xs text-muted">Days in stage</p><p className="font-display text-3xl font-extrabold text-navy">{h.components.daysInStage}</p><p className="text-xs text-muted">Expected {stage?.expected_days ?? "n/a"} days</p></div>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-bold">Risk factors</h3>
                  {risks.length ? <ul className="mt-2 space-y-2">{risks.map((f) => <li key={f.code} className="rounded-lg border border-line p-3"><div className="flex items-center gap-2"><Badge tone={f.severity}>{f.severity}</Badge><span className="text-sm font-semibold text-ink">{f.title}</span></div><p className="mt-1 text-xs text-body">{f.evidence}</p></li>)}</ul> : <p className="mt-2 text-sm text-muted">No risk factors detected from the recorded data.</p>}
                </div>
                <div>
                  <h3 className="text-sm font-bold">Missing information</h3>
                  {missing.length ? <ul className="mt-2 space-y-2">{missing.map((f) => <li key={f.code} className="rounded-lg border border-dashed border-line-strong p-3"><p className="text-sm font-semibold text-ink">{f.title}</p><p className="mt-1 text-xs text-body">{f.evidence}</p></li>)}</ul> : <p className="mt-2 text-sm text-muted">Key fields are complete.</p>}
                  <p className="mt-3 text-xs text-muted">Missing information is not treated as a fact about the buyer. Record it to improve the score and the forecast.</p>
                </div>
              </div>
            </Card>
          )}

          <Card title="Next best actions" description="Recommendations from deal health rules and the AI agents" actions={<Link href={`/dashboard/assistant?q=${encodeURIComponent(`Inspect the deal "${o.name}" and tell me what to do next.`)}`} className="btn btn-outline btn-sm"><Sparkles size={14} />Ask the assistant</Link>}>
            <ol className="space-y-2">
              {h.factors.slice(0, 5).map((f, i) => <li key={f.code} className="flex gap-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue">{i + 1}</span><span><span className="font-semibold text-ink">{f.recommendation}</span><span className="block text-xs text-muted">Because: {f.evidence}</span></span></li>)}
              {h.factors.length === 0 && <li className="text-sm text-muted">{o.status === "open" ? "Keep momentum: confirm the next meeting and the mutual close plan." : "This deal is closed."}</li>}
            </ol>
            {(recs ?? []).length > 0 && (
              <div className="mt-5 space-y-3 border-t border-line pt-4">
                <h3 className="text-sm font-bold">Agent recommendations</h3>
                {(recs ?? []).map((r) => (
                  <div key={r.id} className="rounded-lg border border-line p-3">
                    <p className="text-sm font-semibold text-ink">{r.title}</p>
                    <p className="mt-1 whitespace-pre-line text-xs text-body">{r.body}</p>
                    <Evidence items={(r.evidence as { label: string; value: string }[]).slice(0, 3)} />
                    {r.status === "pending" && can(ctx.role, "agent.approve") && <div className="mt-3"><ApprovalButtons id={r.id} action={r.proposed_action as { type: string }} /></div>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Activity history" description={`${activities.length} logged activities`} actions={canWrite && <FormButton label="Log activity" className="btn btn-primary btn-sm" title="Log activity" endpoint="/api/activities" fields={activityFields(opts)} initial={{ type: "call", opportunity_id: o.id, account_id: o.account_id ?? "", occurred_at: new Date().toISOString().slice(0, 10) }} />} bodyClass="p-0">
            {activities.length || meetings.length ? (
              <ul className="divide-y divide-line">
                {[...activities.map((a) => ({ at: a.occurred_at, k: a.id, node: (
                  <><p className="text-sm font-semibold text-ink"><span className="capitalize text-muted">{a.type}:</span> {a.subject}</p>
                    <p className="text-xs text-muted">{memberName(data, a.user_id)} · {formatDate(a.occurred_at)}{a.outcome && <> · <span className={a.outcome === "negative" ? "text-danger" : a.outcome === "positive" ? "text-success" : ""}>{a.outcome}</span></>}</p>
                    {(a.objection || a.competitor_mentioned || a.budget_discussed) && <div className="mt-1 flex flex-wrap gap-1.5">{a.objection && <Badge tone="medium">Objection: {a.objection}</Badge>}{a.competitor_mentioned && <Badge tone="low">Competitor: {a.competitor_mentioned}</Badge>}{a.budget_discussed && <Badge tone="opportunity">Budget discussed</Badge>}</div>}
                    {a.notes && <p className="mt-1 whitespace-pre-line text-xs text-body">{a.notes}</p>}</>) })),
                ...meetings.map((m) => ({ at: m.starts_at, k: m.id, node: (<><p className="text-sm font-semibold text-ink"><span className="text-muted">Meeting:</span> {m.title}</p><p className="text-xs text-muted">{formatDate(m.starts_at)} · {m.status}{m.outcome && ` · ${m.outcome}`}</p></>) }))]
                  .sort((a, b) => b.at.localeCompare(a.at)).map((x) => <li key={x.k} className="px-5 py-3">{x.node}</li>)}
              </ul>
            ) : <p className="p-5 text-sm text-muted">No activities logged. Log calls, emails and meetings to keep deal health accurate.</p>}
          </Card>

          <Card title="Manager review" description="Comments from managers and the team. The deal owner is notified." actions={<MessageSquareText size={16} className="text-muted" />}>
            {(comments ?? []).length ? (
              <ul className="space-y-3">
                {(comments ?? []).map((c) => <li key={c.id} className="flex gap-3"><Avatar name={memberName(data, c.author_id)} /><div className="min-w-0 rounded-lg bg-canvas px-3 py-2"><p className="text-xs text-muted"><span className="font-semibold text-ink">{memberName(data, c.author_id)}</span> · {timeAgo(c.created_at)}</p><p className="whitespace-pre-line text-sm text-ink">{c.body}</p></div></li>)}
              </ul>
            ) : <p className="text-sm text-muted">No review comments yet.</p>}
            {can(ctx.role, "deal.comment") && <CommentForm oppId={o.id} />}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Account" actions={<Building2 size={16} className="text-muted" />}>
            {account ? (
              <dl className="space-y-2 text-sm">
                <div><dt className="text-xs text-muted">Name</dt><dd><Link href={`/dashboard/accounts/${account.id}`} className="font-semibold text-blue hover:underline">{account.name}</Link></dd></div>
                <div><dt className="text-xs text-muted">Industry</dt><dd className="text-ink">{account.industry ?? "Not set"}</dd></div>
                <div><dt className="text-xs text-muted">Region</dt><dd className="text-ink">{account.region ?? "Not set"}</dd></div>
                <div><dt className="text-xs text-muted">Lifecycle</dt><dd className="capitalize text-ink">{account.lifecycle_stage}</dd></div>
              </dl>
            ) : <p className="text-sm text-muted">No account linked. Edit the deal to add one.</p>}
          </Card>
          <Card title="Buyer stakeholders" description={`${stakeholders.length} linked`} actions={<Users size={16} className="text-muted" />}>
            {stakeholders.length ? (
              <ul className="space-y-2.5">
                {stakeholders.map(({ contact: c }) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5"><Avatar name={`${c.first_name} ${c.last_name ?? ""}`} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{c.first_name} {c.last_name}</p><p className="truncate text-xs text-muted">{c.title ?? "No title"}{c.buying_role && ` · ${c.buying_role.replace(/_/g, " ")}`}</p></div></div>
                    {canWrite && <ActionButton endpoint={`/api/opportunities/${o.id}/contacts?contact_id=${c.id}`} method="DELETE" label="Remove" className="btn btn-ghost btn-xs" />}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No stakeholders linked.</p>}
            {canWrite && <StakeholderAdd oppId={o.id} contacts={linkable} />}
            {canWrite && <div className="mt-2"><FormButton label="New contact" className="btn btn-ghost btn-xs" title="New contact" endpoint="/api/contacts" fields={contactFields(opts)} initial={{ account_id: o.account_id ?? "" }} /></div>}
          </Card>
          <Card title="Follow up tasks" actions={canWrite && <FormButton label="Assign task" className="btn btn-outline btn-xs" title="Assign follow up task" endpoint="/api/tasks" fields={taskFields(opts)} initial={{ opportunity_id: o.id, account_id: o.account_id ?? "", assignee_id: o.owner_id ?? ctx.userId, kind: "follow_up", priority: "medium" }} />}>
            {tasks.length ? (
              <ul className="space-y-2">
                {tasks.map((t) => <li key={t.id} className="flex items-start gap-2.5"><TaskCheck id={t.id} done={t.status === "done"} /><div className="min-w-0"><p className={`text-sm ${t.status === "done" ? "text-muted line-through" : "font-medium text-ink"}`}>{t.title}</p><p className="text-xs text-muted">{memberName(data, t.assignee_id)}{t.due_date && <> · <CalendarDays size={11} className="inline" /> {t.due_date}</>}</p></div></li>)}
              </ul>
            ) : <p className="text-sm text-muted">No tasks on this deal.</p>}
          </Card>
          <Card title="Change history">
            {history.length ? <ul className="space-y-2 text-xs">{history.slice(0, 12).map((x, i) => <li key={i} className="text-body"><span className="font-semibold capitalize text-ink">{x.field.replace("_", " ")}</span> {x.old_value ? `${x.old_value} to ` : ""}{x.new_value ?? "cleared"} <span className="text-muted">· {timeAgo(x.created_at)}</span></li>)}</ul> : <p className="text-sm text-muted">No changes recorded yet.</p>}
          </Card>
          {o.status === "open" && h.factors.length > 0 && <Notice>Deal health is a rule based assessment of the recorded data, not a prediction of the buyer's decision.</Notice>}
        </div>
      </div>
    </div>
  );
}
