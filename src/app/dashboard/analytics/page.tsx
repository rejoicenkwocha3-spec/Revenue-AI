import { Download } from "lucide-react";
import { pageData, periodFromParams } from "@/lib/page";
import { summarize, byDimension, monthlySeries } from "@/lib/revenue/metrics";
import { inPeriod, isoDate, periodFor, shiftPeriod } from "@/lib/revenue/periods";
import { money, pct } from "@/lib/format";
import { PageHeader, Card, StatCard, ActualTag } from "@/components/app/ui";
import { PeriodPicker } from "@/components/app/PeriodPicker";
import { HBarChart, RevenueTrendChart, StackedBarChart, SERIES } from "@/components/app/charts";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { data } = await pageData();
  const period = periodFromParams(sp, data.fiscalStartMonth, data.now);
  const s = summarize(data, period);
  const c = data.currency;
  const months = Array.from({ length: 12 }, (_, i) => shiftPeriod(periodFor("month", data.now), i - 11));
  const composition = months.map((m) => {
    const tx = data.transactions.filter((t) => inPeriod(t.occurred_on, m));
    const sum = (types: string[]) => tx.filter((t) => types.includes(t.type)).reduce((a, t) => a + t.amount, 0);
    return { label: m.start.toLocaleDateString("en", { month: "short", year: "2-digit", timeZone: "UTC" }), new: sum(["new"]), expansion: sum(["expansion"]), renewal: sum(["renewal", "one_time"]), churn: -sum(["churn", "contraction"]) };
  });
  const dims = (["owner", "region", "product"] as const).map((d) => ({ d, rows: byDimension(data, period, d) }));
  const titles = { owner: "Revenue by representative", region: "Revenue by region", product: "Revenue by product" };
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Analytics" description="Booked revenue, recurring revenue and sales efficiency from recorded transactions and closed deals." actions={<><PeriodPicker period={period} basePath="/dashboard/analytics" fiscal={data.fiscalStartMonth} /><a className="btn btn-outline btn-sm" href={`/api/reports/export?type=revenue`}><Download size={14} />Export revenue</a></>} />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total revenue" value={money(s.totalRevenue, c, true)} sub={<ActualTag />} />
        <StatCard label="MRR" value={money(s.mrr, c, true)} sub="ARR ÷ 12" />
        <StatCard label="ARR" value={money(s.arr, c, true)} sub={`At ${isoDate(period.end < data.now ? period.end : data.now)}`} />
        <StatCard label="New revenue" value={money(s.newRevenue, c, true)} />
        <StatCard label="Expansion" value={money(s.expansionRevenue, c, true)} tone="green" />
        <StatCard label="Churned" value={money(s.churnedRevenue, c, true)} tone="red" />
        <StatCard label="Pipeline value" value={money(s.pipelineValue, c, true)} />
        <StatCard label="Win rate" value={pct(s.winRate)} />
        <StatCard label="Average deal size" value={money(s.avgDealSize, c, true)} />
        <StatCard label="Sales cycle" value={s.salesCycleDays != null ? `${s.salesCycleDays} days` : "No data"} />
        <StatCard label="Deals won" value={s.closedWonCount} tone="green" />
        <StatCard label="Deals lost" value={s.closedLostCount} tone="red" />
        <StatCard label="Renewals booked" value={money(s.renewalRevenue, c, true)} />
        <StatCard label="Net new ARR" value={money(s.newRevenue + s.expansionRevenue - s.churnedRevenue, c, true)} />
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Revenue trend" description="Actual bookings by month with projected weighted pipeline"><RevenueTrendChart data={monthlySeries(data, 12, 3)} /></Card>
        <Card title="Revenue composition" description="New, expansion and renewal bookings against churn and contraction by month">
          <StackedBarChart data={composition} keys={[{ key: "new", name: "New", color: SERIES[0] }, { key: "expansion", name: "Expansion", color: SERIES[1] }, { key: "renewal", name: "Renewal and one time", color: SERIES[2] }, { key: "churn", name: "Churn and contraction", color: SERIES[3] }]} />
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {dims.map(({ d, rows }) => (
          <Card key={d} title={titles[d]} description={period.label}>
            {rows.length ? <><HBarChart data={rows.slice(0, 8)} /><table className="table mt-3"><caption className="sr-only">{titles[d]}</caption><tbody>{rows.slice(0, 8).map((r) => <tr key={r.name}><td>{r.name}</td><td className="num text-right font-semibold">{money(r.value, c)}</td></tr>)}</tbody></table></> : <p className="text-sm text-muted">No revenue booked in this period.</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
