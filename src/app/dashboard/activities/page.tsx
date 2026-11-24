import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { pageData } from "@/lib/page";
import { accountName, memberName } from "@/lib/revenue/metrics";
import { optionsFrom } from "@/lib/options";
import { daysBetween, isoDate } from "@/lib/revenue/periods";
import { can } from "@/lib/permissions";
import { money } from "@/lib/format";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { PageHeader, Card, Tabs, Badge, StatCard } from "@/components/app/ui";
import { FormButton, ActionButton } from "@/components/app/forms";
import { activityFields, taskFields } from "@/components/app/fieldsets";
import { TaskCheck } from "../deals/DealClient";
import { EmailDraft } from "../agents/AgentClient";

export const metadata = { title: "Sales Activities" };

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ tab?: string; who?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "tasks";
  const { ctx, data, supabase } = await pageData();
  const opts = optionsFrom(data);
  const write = can(ctx.role, "crm.write");
  const today = isoDate(data.now);
  const mine = (sp.who ?? "me") === "me";
  const tasks = data.tasks.filter((t) => (!mine || t.assignee_id === ctx.userId)).sort((a, b) => (a.status === b.status ? (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") : a.status === "open" ? -1 : 1));
  const openTasks = tasks.filter((t) => t.status === "open");
  const overdue = openTasks.filter((t) => t.due_date && t.due_date < today);
  const { data: templates } = tab === "templates" ? await supabase.from("email_templates").select("*").eq("org_id", ctx.orgId).order("created_at", { ascending: false }) : { data: [] };
  const meetings = [...data.meetings].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const meetingFields = [
    { name: "title", label: "Title", required: true },
    { name: "starts_at", label: "Starts", type: "datetime-local" as const, required: true, half: true },
    { name: "opportunity_id", label: "Opportunity", type: "select" as const, options: opts.opportunities, half: true },
    { name: "account_id", label: "Account", type: "select" as const, options: opts.accounts, half: true },
    { name: "status", label: "Status", type: "select" as const, required: true, half: true, options: [{ value: "scheduled", label: "Scheduled" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }, { value: "no_show", label: "No show" }] },
    { name: "outcome", label: "Outcome", type: "select" as const, half: true, options: [{ value: "positive", label: "Positive" }, { value: "neutral", label: "Neutral" }, { value: "negative", label: "Negative" }] },
    { name: "summary", label: "Summary", type: "textarea" as const },
  ];
  // Prospect prioritisation: priority, open pipeline, recency of engagement
  const prospects = data.accounts.map((a) => {
    const pipe = data.opportunities.filter((o) => o.account_id === a.id && o.status === "open").reduce((s, o) => s + o.amount, 0);
    const last = data.activities.find((x) => x.account_id === a.id || data.opportunities.some((o) => o.id === x.opportunity_id && o.account_id === a.id));
    const days = last ? daysBetween(last.occurred_at, data.now) : null;
    const score = (a.priority === "high" ? 30 : a.priority === "medium" ? 15 : 5) + Math.min(40, pipe / 5000) + (days == null ? 20 : days > 21 ? 25 : days > 7 ? 10 : 0);
    return { a, pipe, days, score: Math.round(score) };
  }).sort((x, y) => y.score - x.score).slice(0, 15);
  const tabs = [{ key: "tasks", label: "Tasks and follow ups" }, { key: "log", label: "Activity history" }, { key: "meetings", label: "Meetings" }, { key: "prospects", label: "Account prioritisation" }, { key: "templates", label: "Email templates" }].map((t) => ({ ...t, href: `/dashboard/activities?tab=${t.key}` }));
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title="Sales Activities" description="Daily work for representatives: tasks, follow up reminders, meetings, activity history, account priorities and email templates."
        actions={write && <><FormButton label="Log activity" className="btn btn-outline btn-sm" title="Log activity" endpoint="/api/activities" fields={activityFields(opts)} initial={{ type: "call", occurred_at: today }} /><FormButton label="New task" icon={<Plus size={15} />} title="New task" endpoint="/api/tasks" fields={taskFields(opts)} initial={{ assignee_id: ctx.userId, priority: "medium", kind: "task" }} /></>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="My open tasks" value={data.tasks.filter((t) => t.assignee_id === ctx.userId && t.status === "open").length} />
        <StatCard label="Overdue" value={overdue.length} tone="red" />
        <StatCard label="Activities this week" value={data.activities.filter((a) => daysBetween(a.occurred_at, data.now) <= 7).length} />
        <StatCard label="Upcoming meetings" value={data.meetings.filter((m) => m.starts_at >= data.now.toISOString() && m.status === "scheduled").length} />
      </section>
      <Tabs tabs={tabs} current={tab} />
      {tab === "tasks" && (
        <Card title={mine ? "My tasks" : "All tasks"} actions={<div className="flex gap-2 text-sm"><Link href="/dashboard/activities?tab=tasks&who=me" className={cn("font-semibold", mine ? "text-blue" : "text-muted")}>Mine</Link><Link href="/dashboard/activities?tab=tasks&who=all" className={cn("font-semibold", !mine ? "text-blue" : "text-muted")}>Everyone</Link></div>} bodyClass="p-0">
          {tasks.length ? <ul className="divide-y divide-line">{tasks.slice(0, 100).map((t) => (
            <li key={t.id} className="flex items-start gap-3 px-5 py-3">
              <TaskCheck id={t.id} done={t.status === "done"} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", t.status === "done" ? "text-muted line-through" : "font-semibold text-ink")}>{t.title}</p>
                <p className="text-xs text-muted">{memberName(data, t.assignee_id)}{t.opportunity_id && <> · <Link href={`/dashboard/deals/${t.opportunity_id}`} className="text-blue">{data.opportunities.find((o) => o.id === t.opportunity_id)?.name}</Link></>}{t.account_id && !t.opportunity_id && ` · ${accountName(data, t.account_id)}`}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {t.kind !== "task" && <Badge tone="info">{t.kind.replace("_", " ")}</Badge>}
                <Badge tone={t.priority === "high" ? "high" : "low"}>{t.priority}</Badge>
                {t.due_date && <span className={cn("inline-flex items-center gap-1 text-xs", t.status === "open" && t.due_date < today ? "font-semibold text-danger" : "text-muted")}><CalendarDays size={12} />{t.due_date}</span>}
              </div>
            </li>))}</ul> : <p className="p-5 text-sm text-muted">No tasks. Create one, or approve tasks suggested by the AI agents.</p>}
        </Card>
      )}
      {tab === "log" && (
        <Card title="Activity history" bodyClass="p-0">
          {data.activities.length ? <ul className="divide-y divide-line">{data.activities.slice(0, 100).map((a) => <li key={a.id} className="px-5 py-3 text-sm"><p className="font-semibold text-ink"><span className="capitalize text-muted">{a.type}:</span> {a.subject}</p><p className="text-xs text-muted">{memberName(data, a.user_id)} · {formatDate(a.occurred_at)} · {a.opportunity_id ? data.opportunities.find((o) => o.id === a.opportunity_id)?.name : accountName(data, a.account_id)}{a.outcome && ` · ${a.outcome}`}</p></li>)}</ul> : <p className="p-5 text-sm text-muted">No activity recorded in the last 12 months.</p>}
        </Card>
      )}
      {tab === "meetings" && (
        <Card title="Meetings" actions={write && <FormButton label="Add meeting" className="btn btn-outline btn-xs" title="Add meeting" endpoint="/api/meetings" fields={meetingFields} initial={{ status: "scheduled" }} />} bodyClass="p-0">
          {meetings.length ? <ul className="divide-y divide-line">{meetings.slice(0, 100).map((m) => <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"><div><p className="font-semibold text-ink">{m.title}</p><p className="text-xs text-muted">{formatDateTime(m.starts_at)} · {m.opportunity_id ? data.opportunities.find((o) => o.id === m.opportunity_id)?.name : accountName(data, m.account_id)}</p></div><div className="flex items-center gap-2"><span className="chip bg-canvas capitalize text-body ring-1 ring-line">{m.status.replace("_", " ")}</span>{m.outcome && <Badge tone={m.outcome === "negative" ? "high" : m.outcome === "positive" ? "opportunity" : "low"}>{m.outcome}</Badge>}{write && m.status === "scheduled" && <><ActionButton endpoint={`/api/meetings/${m.id}`} method="PATCH" body={{ status: "completed", outcome: "positive" }} label="Positive" className="btn btn-ghost btn-xs" /><ActionButton endpoint={`/api/meetings/${m.id}`} method="PATCH" body={{ status: "completed", outcome: "negative" }} label="Negative" className="btn btn-ghost btn-xs" /></>}</div></li>)}</ul> : <p className="p-5 text-sm text-muted">No meetings. Add meetings or connect Google Workspace or Outlook to import them.</p>}
        </Card>
      )}
      {tab === "prospects" && (
        <Card title="Account prioritisation" description="Ranked by account priority, open pipeline value and how long since the last interaction" bodyClass="p-0">
          <table className="table"><thead><tr><th>Account</th><th className="text-right">Open pipeline</th><th>Last interaction</th><th>Owner</th><th className="text-right">Priority score</th></tr></thead><tbody>{prospects.map((p) => <tr key={p.a.id}><td><Link href={`/dashboard/accounts/${p.a.id}`} className="font-semibold text-ink hover:text-blue">{p.a.name}</Link><span className="block text-xs capitalize text-muted">{p.a.priority} priority · {p.a.lifecycle_stage}</span></td><td className="num text-right">{money(p.pipe, data.currency)}</td><td>{p.days == null ? "Never" : `${p.days} days ago`}</td><td>{memberName(data, p.a.owner_id)}</td><td className="num text-right font-semibold">{p.score}</td></tr>)}</tbody></table>
        </Card>
      )}
      {tab === "templates" && (
        <Card title="Email templates" description="Reusable emails for follow ups. Copy into your email client to send." actions={write && <FormButton label="New template" className="btn btn-outline btn-xs" title="New email template" endpoint="/api/templates" fields={[{ name: "name", label: "Name", required: true, half: true }, { name: "category", label: "Category", half: true, placeholder: "follow_up" }, { name: "subject", label: "Subject", required: true }, { name: "body", label: "Body", type: "textarea", required: true }]} />}>
          {(templates ?? []).length ? <ul className="space-y-4">{(templates ?? []).map((t) => <li key={t.id}><div className="flex items-center justify-between"><p className="font-semibold text-ink">{t.name} <span className="text-xs font-normal text-muted">{t.category}</span></p>{write && <ActionButton endpoint={`/api/templates/${t.id}`} method="DELETE" label="Delete" confirm="Delete template?" className="btn btn-ghost btn-xs" />}</div><EmailDraft to={null} subject={t.subject} body={t.body} /></li>)}</ul> : <p className="text-sm text-muted">No templates yet.</p>}
        </Card>
      )}
    </div>
  );
}
