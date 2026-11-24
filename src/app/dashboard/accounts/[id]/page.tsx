import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { pageData } from "@/lib/page";
import { assessCustomers } from "@/lib/revenue/customerHealth";
import { memberName, stageMap } from "@/lib/revenue/metrics";
import { optionsFrom } from "@/lib/options";
import { can } from "@/lib/permissions";
import { money } from "@/lib/format";
import { formatDate } from "@/lib/utils";
import { Card, HealthBadge, Badge, Evidence, StatusBadge } from "@/components/app/ui";
import { FormButton, ActionButton } from "@/components/app/forms";
import { accountFields, contactFields, activityFields, opportunityFields, taskFields } from "@/components/app/fieldsets";

export const metadata = { title: "Account" };

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx, data, supabase } = await pageData();
  const a = data.accounts.find((x) => x.id === id);
  if (!a) notFound();
  const { data: territories } = await supabase.from("territories").select("id, name").eq("org_id", ctx.orgId);
  const { data: full } = await supabase.from("accounts").select("*").eq("id", id).single();
  const health = assessCustomers(data).find((x) => x.accountId === id);
  const opps = data.opportunities.filter((o) => o.account_id === id);
  const contacts = data.contacts.filter((x) => x.account_id === id);
  const acts = data.activities.filter((x) => x.account_id === id || opps.some((o) => o.id === x.opportunity_id)).slice(0, 15);
  const renewals = data.renewals.filter((r) => r.account_id === id);
  const tx = data.transactions.filter((t) => t.account_id === id).sort((x, y) => y.occurred_on.localeCompare(x.occurred_on));
  const stages = stageMap(data);
  const opts = optionsFrom(data);
  const write = can(ctx.role, "crm.write");
  const c = data.currency;
  const renewalFields = [
    { name: "account_id", label: "Account", type: "select" as const, required: true, options: [{ value: id, label: a.name }] },
    { name: "renewal_date", label: "Renewal date", type: "date" as const, required: true, half: true },
    { name: "current_arr", label: "Current ARR", type: "number" as const, required: true, min: 0, half: true },
    { name: "expected_arr", label: "Expected ARR", type: "number" as const, min: 0, half: true },
    { name: "owner_id", label: "Owner", type: "select" as const, options: opts.members, half: true },
    { name: "reminder_days", label: "Remind me days before", type: "number" as const, min: 1, max: 365, half: true },
    { name: "notes", label: "Notes", type: "textarea" as const },
  ];
  const txFields = [
    { name: "account_id", label: "Account", type: "select" as const, required: true, options: [{ value: id, label: a.name }] },
    { name: "type", label: "Type", type: "select" as const, required: true, half: true, options: [{ value: "churn", label: "Churn" }, { value: "contraction", label: "Contraction" }, { value: "expansion", label: "Expansion" }, { value: "renewal", label: "Renewal" }, { value: "new", label: "New" }, { value: "one_time", label: "One time" }] },
    { name: "amount", label: "Annual amount", type: "number" as const, required: true, min: 0, half: true },
    { name: "occurred_on", label: "Date", type: "date" as const, required: true, half: true },
    { name: "recurring", label: "Recurring revenue", type: "checkbox" as const },
    { name: "notes", label: "Notes", type: "textarea" as const },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <Link href="/dashboard/accounts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={15} />Accounts</Link>
      <header className="card flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <div className="flex flex-wrap gap-2"><span className="chip bg-canvas capitalize text-body ring-1 ring-line">{a.lifecycle_stage}</span><Badge tone={a.priority === "high" ? "high" : "low"}>{a.priority} priority</Badge>{health && <HealthBadge health={health.health} score={health.score} />}</div>
          <h1 className="mt-2 text-2xl font-extrabold">{a.name}</h1>
          <p className="mt-1 text-sm text-muted">{[a.industry, a.region, full?.domain, a.employee_count ? `${a.employee_count} employees` : null].filter(Boolean).join(" · ")} · Owner {memberName(data, a.owner_id)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {write && <FormButton label="Edit" icon={<Pencil size={14} />} className="btn btn-outline btn-sm" title="Edit account" endpoint={`/api/accounts/${id}`} method="PATCH" fields={accountFields({ members: opts.members, territories: (territories ?? []).map((t) => ({ value: t.id, label: t.name })) })} initial={Object.fromEntries(Object.entries(full ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)]))} />}
          {can(ctx.role, "deal.manage_any") && <ActionButton endpoint={`/api/accounts/${id}`} method="DELETE" label="Delete" icon={<Trash2 size={14} />} confirm="Delete account? Deals keep their history." className="btn btn-danger btn-sm" redirectTo="/dashboard/accounts" />}
        </div>
      </header>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {health && (
            <Card title="Customer health and retention" description={`ARR ${money(health.arr, c)} · churn risk ${health.churnRisk} · expansion potential ${health.expansionPotential}`}>
              <ul className="space-y-1.5 text-sm">{health.signals.map((s) => <li key={s.text} className="flex gap-2"><Badge tone={s.kind === "risk" ? "warning" : s.kind === "opportunity" ? "opportunity" : "info"}>{s.kind.replace("_", " ")}</Badge><span>{s.text}</span></li>)}</ul>
              <Evidence items={health.evidence} />
            </Card>
          )}
          <Card title="Opportunities" actions={write && <FormButton label="New opportunity" className="btn btn-outline btn-xs" title="New opportunity" endpoint="/api/opportunities" fields={opportunityFields({ ...opts, stages: opts.stages.filter((s) => stages.get(s.value)?.kind === "open"), canAssign: can(ctx.role, "deal.manage_any") })} initial={{ account_id: id, forecast_category: "pipeline", deal_type: health ? "expansion" : "new_business", owner_id: ctx.userId }} />} bodyClass="p-0">
            {opps.length ? <table className="table"><tbody>{opps.map((o) => <tr key={o.id}><td><Link href={`/dashboard/deals/${o.id}`} className="font-semibold text-ink hover:text-blue">{o.name}</Link></td><td>{o.status === "open" ? stages.get(o.stage_id ?? "")?.name : <StatusBadge status={o.status} />}</td><td className="num text-right">{money(o.amount, c)}</td><td>{o.close_date}</td></tr>)}</tbody></table> : <p className="p-5 text-sm text-muted">No opportunities.</p>}
          </Card>
          <Card title="Customer interactions" actions={write && <FormButton label="Record interaction" className="btn btn-outline btn-xs" title="Record interaction" endpoint="/api/activities" fields={activityFields(opts)} initial={{ type: "call", account_id: id, occurred_at: new Date().toISOString().slice(0, 10) }} />} bodyClass="p-0">
            {acts.length ? <ul className="divide-y divide-line">{acts.map((x) => <li key={x.id} className="px-5 py-3 text-sm"><p className="font-medium text-ink"><span className="capitalize text-muted">{x.type}:</span> {x.subject}</p><p className="text-xs text-muted">{memberName(data, x.user_id)} · {formatDate(x.occurred_at)}{x.outcome && ` · ${x.outcome}`}</p></li>)}</ul> : <p className="p-5 text-sm text-muted">No interactions recorded.</p>}
          </Card>
          <Card title="Revenue history" actions={can(ctx.role, "forecast.manage") && <FormButton label="Record revenue change" className="btn btn-outline btn-xs" title="Record revenue change" endpoint="/api/transactions" fields={txFields} initial={{ account_id: id, type: "churn", recurring: true, occurred_on: new Date().toISOString().slice(0, 10) }} />} bodyClass="p-0">
            {tx.length ? <table className="table"><tbody>{tx.map((t) => <tr key={t.id}><td>{t.occurred_on}</td><td className="capitalize">{t.type.replace("_", " ")}</td><td className={`num text-right font-semibold ${["churn", "contraction"].includes(t.type) ? "text-danger" : ""}`}>{["churn", "contraction"].includes(t.type) ? "-" : ""}{money(t.amount, c)}</td></tr>)}</tbody></table> : <p className="p-5 text-sm text-muted">No revenue recorded. Closed won deals are booked here automatically.</p>}
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Renewals" actions={write && <FormButton label="Add renewal" className="btn btn-outline btn-xs" title="Add renewal" endpoint="/api/renewals" fields={renewalFields} initial={{ account_id: id, owner_id: a.owner_id ?? ctx.userId, current_arr: health ? String(Math.round(health.arr)) : "", reminder_days: "60" }} />}>
            {renewals.length ? <ul className="space-y-3">{renewals.map((r) => <li key={r.id} className="rounded-lg border border-line p-3 text-sm"><p className="font-semibold text-ink">{r.renewal_date}</p><p className="text-xs text-muted">{money(r.current_arr, c)} ARR · <span className="capitalize">{r.status.replace("_", " ")}</span></p>{write && r.status !== "renewed" && r.status !== "churned" && <div className="mt-2 flex gap-2"><ActionButton endpoint={`/api/renewals/${r.id}`} method="PATCH" body={{ status: "renewed" }} label="Mark renewed" className="btn btn-success btn-xs" /><ActionButton endpoint={`/api/renewals/${r.id}`} method="PATCH" body={{ status: "churned" }} label="Mark churned" confirm="Mark as churned?" className="btn btn-outline btn-xs" /></div>}</li>)}</ul> : <p className="text-sm text-muted">No renewals tracked.</p>}
            {write && <div className="mt-3"><FormButton label="Create renewal reminder" className="btn btn-ghost btn-xs" title="Renewal reminder" endpoint="/api/tasks" fields={taskFields(opts)} initial={{ account_id: id, kind: "renewal_reminder", priority: "medium", assignee_id: a.owner_id ?? ctx.userId, title: `Prepare renewal for ${a.name}` }} /></div>}
          </Card>
          <Card title="Contacts" actions={write && <FormButton label="Add contact" className="btn btn-outline btn-xs" title="New contact" endpoint="/api/contacts" fields={contactFields(opts)} initial={{ account_id: id }} />}>
            {contacts.length ? <ul className="space-y-2">{contacts.map((x) => <li key={x.id} className="text-sm"><p className="font-semibold text-ink">{x.first_name} {x.last_name}</p><p className="text-xs text-muted">{[x.title, x.buying_role?.replace(/_/g, " "), x.email].filter(Boolean).join(" · ")}</p></li>)}</ul> : <p className="text-sm text-muted">No contacts.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
