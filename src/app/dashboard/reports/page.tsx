import { Download, FileSpreadsheet } from "lucide-react";
import { pageData, periodFromParams } from "@/lib/page";
import { summarize } from "@/lib/revenue/metrics";
import { computeForecast } from "@/lib/revenue/forecast";
import { isoDate } from "@/lib/revenue/periods";
import { can } from "@/lib/permissions";
import { money, pct } from "@/lib/format";
import { PageHeader, Card, ProjectionTag } from "@/components/app/ui";
import { PeriodPicker } from "@/components/app/PeriodPicker";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { ctx, data, health } = await pageData();
  const period = periodFromParams(sp, data.fiscalStartMonth, data.now);
  const s = summarize(data, period);
  const f = computeForecast(data, period, health);
  const q = `period=${period.type}&start=${isoDate(period.start)}`;
  const c = data.currency;
  const reports = [
    { type: "opportunities", title: "Pipeline and opportunities", body: "Every deal with stage, owner, value, probability, close date, forecast category and health score." },
    { type: "forecast", title: "Forecast report", body: "Closed revenue, commit, best case, scenarios, the deals included and every assumption for the selected period." },
    { type: "revenue", title: "Revenue transactions", body: "New, expansion, renewal, contraction and churn bookings with account, owner, product and region." },
    { type: "performance", title: "Sales performance", body: "Revenue, quota attainment, wins, losses, win rate, activity and pipeline per representative." },
    { type: "customers", title: "Customer health and renewals", body: "ARR, health score, churn risk, expansion potential and next renewal per customer." },
    ...(can(ctx.role, "audit.view") ? [{ type: "audit", title: "Audit log", body: "Every change by people, agents, integrations and billing." }] : []),
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Reports" description="Executive summary for the selected period and CSV exports for spreadsheets and BI tools." actions={<PeriodPicker period={period} basePath="/dashboard/reports" fiscal={data.fiscalStartMonth} />} />
      <Card title={`Executive summary: ${period.label}`}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold">Actual results</h3>
            <dl className="mt-2 divide-y divide-line text-sm">
              {[["Revenue booked", money(s.totalRevenue, c)], ["New business", money(s.newRevenue, c)], ["Expansion", money(s.expansionRevenue, c)], ["Churn and contraction", money(s.churnedRevenue, c)], ["ARR", money(s.arr, c)], ["Deals won", `${s.closedWonCount} (${money(s.closedWonValue, c)})`], ["Deals lost", `${s.closedLostCount} (${money(s.closedLostValue, c)})`], ["Win rate", pct(s.winRate)], ["Average deal size", money(s.avgDealSize, c)], ["Quota attainment", s.target ? pct(s.quotaAttainment) : "No target"]].map(([k, v]) => <div key={k} className="flex justify-between py-2"><dt className="text-muted">{k}</dt><dd className="font-semibold tabular-nums text-ink">{v}</dd></div>)}
            </dl>
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold">Forecast <ProjectionTag /></h3>
            <dl className="mt-2 divide-y divide-line text-sm">
              {[["Expected case", money(f.expectedCase, c)], ["Worst case", money(f.worstCase, c)], ["Best case", money(f.bestCaseTotal, c)], ["Commit deals", money(f.commit, c)], ["Open pipeline in period", money(f.commit + f.bestCase + f.pipeline, c)], ["Confidence", f.confidence]].map(([k, v]) => <div key={k} className="flex justify-between py-2"><dt className="text-muted">{k}</dt><dd className="font-semibold capitalize tabular-nums text-ink">{v}</dd></div>)}
            </dl>
            <p className="mt-3 text-xs text-muted">{f.assumptions[2]}</p>
          </div>
        </div>
      </Card>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.type} className="card flex flex-col p-5">
            <FileSpreadsheet size={20} className="text-blue" />
            <h2 className="mt-3 font-bold">{r.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{r.body}</p>
            <a href={`/api/reports/export?type=${r.type}&${q}`} className="btn btn-outline btn-sm mt-4 self-start"><Download size={14} />Download CSV</a>
          </div>
        ))}
      </section>
    </div>
  );
}
