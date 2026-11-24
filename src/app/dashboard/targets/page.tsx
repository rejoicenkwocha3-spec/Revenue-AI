import { Plus } from "lucide-react";
import { pageData } from "@/lib/page";
import { memberName, userTarget, orgTarget, repPerformance } from "@/lib/revenue/metrics";
import { periodFor, isoDate } from "@/lib/revenue/periods";
import { can } from "@/lib/permissions";
import { money, pct } from "@/lib/format";
import { PageHeader, Card, Restricted } from "@/components/app/ui";
import { FormButton, ActionButton } from "@/components/app/forms";

export const metadata = { title: "Targets and Quotas" };

export default async function TargetsPage() {
  const { ctx, data, supabase } = await pageData();
  const { data: teams } = await supabase.from("teams").select("id, name").eq("org_id", ctx.orgId);
  const manage = can(ctx.role, "target.manage");
  const c = data.currency;
  const q = periodFor("quarter", data.now, data.fiscalStartMonth);
  const fields = [
    { name: "scope", label: "Applies to", type: "select" as const, required: true, half: true, options: [{ value: "organisation", label: "Whole organisation" }, { value: "user", label: "A team member" }, { value: "team", label: "A team" }] },
    { name: "period_type", label: "Period", type: "select" as const, required: true, half: true, options: [{ value: "quarter", label: "Quarter" }, { value: "month", label: "Month" }, { value: "year", label: "Year" }] },
    { name: "period_start", label: "Any date in the period", type: "date" as const, required: true, half: true, hint: "The period follows your fiscal calendar" },
    { name: "amount", label: "Target amount", type: "number" as const, required: true, min: 0, half: true },
    { name: "user_id", label: "Team member", type: "select" as const, half: true, options: data.members.map((m) => ({ value: m.user_id, label: m.full_name })) },
    { name: "team_id", label: "Team", type: "select" as const, half: true, options: (teams ?? []).map((t) => ({ value: t.id, label: t.name })) },
  ];
  const targets = [...data.targets].sort((a, b) => b.period_start.localeCompare(a.period_start));
  const reps = repPerformance(data, q);
  const ot = orgTarget(data, q);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Targets and Quotas" description="Set revenue targets for the organisation, teams and individual representatives. Attainment is calculated from booked revenue." actions={manage && <FormButton label="Set target" icon={<Plus size={15} />} title="Set a revenue target" endpoint="/api/targets" fields={fields} initial={{ scope: "organisation", period_type: "quarter", period_start: isoDate(data.now) }} />} />
      {!manage && <Restricted what="change targets" />}
      <Card title={`Quota attainment for ${q.label}`} description={ot != null ? `Organisation target ${money(ot, c)}` : "No organisation target for this quarter"} bodyClass="p-0">
        <table className="table">
          <thead><tr><th>Representative</th><th className="text-right">Quota</th><th className="text-right">Booked</th><th>Attainment</th></tr></thead>
          <tbody>{reps.map((r) => { const t = userTarget(data, r.userId, q); return <tr key={r.userId}><td className="font-semibold text-ink">{r.name}</td><td className="num text-right">{t != null ? money(t, c) : "Not set"}</td><td className="num text-right">{money(r.revenue, c)}</td><td>{t ? pct((r.revenue / t) * 100) : "No quota"}</td></tr>; })}</tbody>
        </table>
      </Card>
      <Card title="All targets" bodyClass="p-0">
        {targets.length ? (
          <table className="table">
            <thead><tr><th>Applies to</th><th>Period</th><th className="text-right">Amount</th><th /></tr></thead>
            <tbody>{targets.map((t) => <tr key={t.id}><td>{t.scope === "organisation" ? "Organisation" : t.scope === "user" ? memberName(data, t.user_id) : (teams ?? []).find((x) => x.id === t.team_id)?.name ?? "Team"}</td><td className="capitalize">{t.period_type}: {t.period_start} to {t.period_end}</td><td className="num text-right font-semibold">{money(t.amount, c)}</td><td className="text-right">{manage && <ActionButton endpoint={`/api/targets/${t.id}`} method="DELETE" label="Delete" confirm="Delete target?" className="btn btn-ghost btn-xs" />}</td></tr>)}</tbody>
          </table>
        ) : <p className="p-5 text-sm text-muted">No targets yet. Targets enable quota attainment, forecast gap analysis and coverage.</p>}
      </Card>
    </div>
  );
}
