import Link from "next/link";
import { Building2, Plus, Download } from "lucide-react";
import { pageData } from "@/lib/page";
import { assessCustomers } from "@/lib/revenue/customerHealth";
import { memberName } from "@/lib/revenue/metrics";
import { optionsFrom } from "@/lib/options";
import { can } from "@/lib/permissions";
import { money } from "@/lib/format";
import { daysBetween } from "@/lib/revenue/periods";
import { PageHeader, Card, HealthBadge, Badge, StatCard, EmptyState } from "@/components/app/ui";
import { FormButton } from "@/components/app/forms";
import { accountFields } from "@/components/app/fieldsets";
import { cn } from "@/lib/utils";

export const metadata = { title: "Accounts" };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  const sp = await searchParams;
  const { ctx, data, supabase } = await pageData();
  const { data: territories } = await supabase.from("territories").select("id, name").eq("org_id", ctx.orgId);
  const customers = assessCustomers(data);
  const ch = new Map(customers.map((c) => [c.accountId, c]));
  const opts = optionsFrom(data);
  const view = sp.view ?? "all";
  const term = (sp.q ?? "").toLowerCase();
  let list = data.accounts.filter((a) => !term || a.name.toLowerCase().includes(term));
  if (view === "customers") list = list.filter((a) => ch.has(a.id));
  if (view === "risk") list = list.filter((a) => ch.get(a.id)?.churnRisk && ch.get(a.id)!.churnRisk !== "low");
  if (view === "expansion") list = list.filter((a) => ch.get(a.id)?.expansionPotential && ch.get(a.id)!.expansionPotential !== "low");
  const upcoming = data.renewals.filter((r) => ["upcoming", "in_progress"].includes(r.status) && daysBetween(data.now, r.renewal_date) <= 90).sort((a, b) => a.renewal_date.localeCompare(b.renewal_date));
  const tab = (k: string, l: string) => <Link href={`/dashboard/accounts?view=${k}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", view === k ? "bg-navy text-white" : "bg-white text-body ring-1 ring-line")}>{l}</Link>;
  const c = data.currency;
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Accounts" description="Prospects and customers with ownership, open pipeline, customer health, churn risk, expansion potential and renewals."
        actions={<><a href="/api/reports/export?type=customers" className="btn btn-outline btn-sm"><Download size={14} />Customer health</a>{can(ctx.role, "crm.write") && <FormButton label="New account" icon={<Plus size={15} />} title="New account" endpoint="/api/accounts" fields={accountFields({ members: opts.members, territories: (territories ?? []).map((t) => ({ value: t.id, label: t.name })) })} initial={{ lifecycle_stage: "prospect", priority: "medium", owner_id: ctx.userId }} />}</>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Customers" value={customers.length} />
        <StatCard label="Customer ARR" value={money(customers.reduce((a, x) => a + x.arr, 0), c, true)} />
        <StatCard label="Churn risk" value={customers.filter((x) => x.churnRisk === "high").length} tone="red" sub="High risk customers" />
        <StatCard label="Renewals in 90 days" value={upcoming.length} tone="amber" sub={money(upcoming.reduce((a, r) => a + r.current_arr, 0), c, true)} />
      </section>
      <div className="flex flex-wrap items-center gap-2">
        {tab("all", "All accounts")}{tab("customers", "Customers")}{tab("risk", "Churn risk")}{tab("expansion", "Expansion")}
        <form className="ml-auto"><input type="hidden" name="view" value={view} /><label htmlFor="acc-q" className="sr-only">Search accounts</label><input id="acc-q" name="q" defaultValue={sp.q} className="input w-56" placeholder="Search accounts" /></form>
      </div>
      <Card bodyClass="p-0">
        {list.length ? (
          <div className="overflow-x-auto">
            <table className="table min-w-[900px]">
              <thead><tr><th>Account</th><th>Owner</th><th>Lifecycle</th><th className="text-right">Open pipeline</th><th className="text-right">ARR</th><th>Customer health</th><th>Signals</th><th>Next renewal</th></tr></thead>
              <tbody>{list.map((a) => { const h = ch.get(a.id); const pipe = data.opportunities.filter((o) => o.account_id === a.id && o.status === "open").reduce((s, o) => s + o.amount, 0); return (
                <tr key={a.id}>
                  <td><Link href={`/dashboard/accounts/${a.id}`} className="font-semibold text-ink hover:text-blue">{a.name}</Link><span className="block text-xs text-muted">{[a.industry, a.region].filter(Boolean).join(" · ") || "No details"}</span></td>
                  <td>{memberName(data, a.owner_id)}</td><td className="capitalize">{a.lifecycle_stage}</td>
                  <td className="num text-right">{money(pipe, c)}</td><td className="num text-right">{h ? money(h.arr, c) : "None"}</td>
                  <td>{h ? <HealthBadge health={h.health} score={h.score} /> : <span className="text-xs text-muted">Not a customer</span>}</td>
                  <td><div className="flex flex-wrap gap-1">{h?.churnRisk === "high" && <Badge tone="high">Churn risk</Badge>}{h && h.expansionPotential !== "low" && <Badge tone="opportunity">Expansion</Badge>}</div></td>
                  <td className="whitespace-nowrap">{h?.nextRenewal ?? ""}</td>
                </tr>); })}</tbody>
            </table>
          </div>
        ) : <EmptyState icon={Building2} title="No accounts found" body="Create accounts or import them from your CRM." action={{ href: "/dashboard/integrations", label: "Connect a CRM" }} />}
      </Card>
      <Card title="Upcoming renewals" description="Next 90 days" bodyClass="p-0">
        {upcoming.length ? <table className="table"><thead><tr><th>Account</th><th>Renewal date</th><th className="text-right">Current ARR</th><th>Owner</th><th>Status</th></tr></thead><tbody>{upcoming.map((r) => <tr key={r.id}><td><Link href={`/dashboard/accounts/${r.account_id}`} className="font-semibold text-ink hover:text-blue">{data.accounts.find((a) => a.id === r.account_id)?.name}</Link></td><td>{r.renewal_date} <span className="text-xs text-muted">({daysBetween(data.now, r.renewal_date)} days)</span></td><td className="num text-right">{money(r.current_arr, c)}</td><td>{memberName(data, r.owner_id)}</td><td className="capitalize">{r.status.replace("_", " ")}</td></tr>)}</tbody></table> : <p className="p-5 text-sm text-muted">No renewals due in the next 90 days.</p>}
      </Card>
    </div>
  );
}
