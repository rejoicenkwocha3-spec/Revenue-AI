import { Download } from "lucide-react";
import { pageData, periodFromParams } from "@/lib/page";
import { repPerformance } from "@/lib/revenue/metrics";
import { isoDate } from "@/lib/revenue/periods";
import { money, pct } from "@/lib/format";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { PageHeader, Card, Avatar } from "@/components/app/ui";
import { PeriodPicker } from "@/components/app/PeriodPicker";
import { HBarChart, SERIES } from "@/components/app/charts";

export const metadata = { title: "Team Performance" };

export default async function PerformancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { data } = await pageData();
  const period = periodFromParams(sp, data.fiscalStartMonth, data.now);
  const reps = repPerformance(data, period);
  const c = data.currency;
  const team = reps.reduce((a, r) => ({ revenue: a.revenue + r.revenue, target: a.target + (r.target ?? 0), won: a.won + r.dealsWon, lost: a.lost + r.dealsLost, meetings: a.meetings + r.meetingsBooked, created: a.created + r.opportunitiesCreated }), { revenue: 0, target: 0, won: 0, lost: 0, meetings: 0, created: 0 });
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Team Performance" description="Quota attainment, wins, losses, activity and pipeline for each representative. Compare the team side by side." actions={<><PeriodPicker period={period} basePath="/dashboard/performance" fiscal={data.fiscalStartMonth} /><a className="btn btn-outline btn-sm" href={`/api/reports/export?type=performance&period=${period.type}&start=${isoDate(period.start)}`}><Download size={14} />Export</a></>} />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[["Team revenue", money(team.revenue, c, true)], ["Team quota", team.target ? money(team.target, c, true) : "Not set"], ["Attainment", team.target ? pct((team.revenue / team.target) * 100) : "No quota"], ["Deals won", team.won], ["Win rate", team.won + team.lost ? pct((team.won / (team.won + team.lost)) * 100) : "No data"], ["Meetings", team.meetings]].map(([k, v]) => (
          <div key={k as string} className="card p-4"><p className="text-xs text-muted">{k}</p><p className="mt-1 font-display text-xl font-extrabold tabular-nums text-navy">{v}</p></div>
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Revenue by representative">{reps.some((r) => r.revenue) ? <HBarChart data={reps.map((r) => ({ name: r.name, value: Math.round(r.revenue) }))} /> : <p className="text-sm text-muted">No revenue booked in this period.</p>}</Card>
        <Card title="Open pipeline by representative">{reps.some((r) => r.openPipeline) ? <HBarChart data={reps.map((r) => ({ name: r.name, value: Math.round(r.openPipeline) }))} color={SERIES[2]} valueName="Open pipeline" /> : <p className="text-sm text-muted">No open pipeline.</p>}</Card>
      </div>
      <Card title="Comparison" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[1000px]">
            <thead><tr><th>Representative</th><th className="text-right">Revenue</th><th>Quota attainment</th><th className="text-right">Won</th><th className="text-right">Lost</th><th className="text-right">Win rate</th><th className="text-right">Avg deal</th><th className="text-right">Opps created</th><th className="text-right">Meetings</th><th className="text-right">Activities</th><th className="text-right">Open pipeline</th></tr></thead>
            <tbody>
              {reps.map((r) => (
                <tr key={r.userId}>
                  <td><div className="flex items-center gap-2.5"><Avatar name={r.name} /><div><p className="font-semibold text-ink">{r.name}</p><p className="text-xs text-muted">{ROLE_LABELS[r.role as Role] ?? r.role}</p></div></div></td>
                  <td className="num text-right font-semibold">{money(r.revenue, c)}</td>
                  <td className="min-w-[160px]">{r.attainment != null ? <div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-canvas"><div className="h-2 rounded-full" style={{ width: `${Math.min(100, r.attainment)}%`, background: r.attainment >= 100 ? "#19A875" : "#315BDB" }} /></div><span className="num text-xs">{pct(r.attainment)}</span></div> : <span className="text-xs text-muted">No quota set</span>}</td>
                  <td className="num text-right">{r.dealsWon}</td><td className="num text-right">{r.dealsLost}</td><td className="num text-right">{pct(r.winRate)}</td><td className="num text-right">{money(r.avgDealSize, c, true)}</td>
                  <td className="num text-right">{r.opportunitiesCreated}</td><td className="num text-right">{r.meetingsBooked}</td><td className="num text-right">{r.activities}</td><td className="num text-right">{money(r.openPipeline, c, true)}</td>
                </tr>
              ))}
              {reps.length === 0 && <tr><td colSpan={11} className="py-8 text-center text-muted">Invite sales representatives to compare performance.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
