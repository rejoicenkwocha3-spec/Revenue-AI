import Link from "next/link";
import { Download, Info } from "lucide-react";
import { pageData, periodFromParams } from "@/lib/page";
import { computeForecast, forecastAccuracy } from "@/lib/revenue/forecast";
import { isoDate } from "@/lib/revenue/periods";
import { can } from "@/lib/permissions";
import { money, pct } from "@/lib/format";
import { formatDateTime } from "@/lib/utils";
import { memberName } from "@/lib/revenue/metrics";
import { PageHeader, Card, StatCard, ProjectionTag, ActualTag, HealthBadge, Notice, Badge } from "@/components/app/ui";
import { PeriodPicker } from "@/components/app/PeriodPicker";
import { ScenarioBars, ForecastActualChart } from "@/components/app/charts";
import { ForecastForm } from "./ForecastForm";

export const metadata = { title: "Forecasting" };

export default async function ForecastingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { ctx, data, health, supabase } = await pageData();
  const period = periodFromParams(sp, data.fiscalStartMonth, data.now);
  const f = computeForecast(data, period, health);
  const c = data.currency;
  const [{ data: snaps }, { data: allSnaps }, { data: forecast }] = await Promise.all([
    supabase.from("forecast_snapshots").select("*").eq("org_id", ctx.orgId).eq("period_start", isoDate(period.start)).eq("period_end", isoDate(period.end)).order("created_at", { ascending: false }).limit(20),
    supabase.from("forecast_snapshots").select("period_start, period_end, expected_case, submitted_amount, created_at").eq("org_id", ctx.orgId).order("created_at", { ascending: false }).limit(500),
    supabase.from("forecasts").select("*").eq("org_id", ctx.orgId).eq("period_start", isoDate(period.start)).eq("period_end", isoDate(period.end)).is("team_id", null).maybeSingle(),
  ]);
  const accuracy = forecastAccuracy(data, (allSnaps ?? []).map((s) => ({ ...s, expected_case: Number(s.expected_case), submitted_amount: s.submitted_amount == null ? null : Number(s.submitted_amount) })));
  const avgAcc = accuracy.filter((a) => a.accuracy != null);
  const prevSnap = (snaps ?? [])[0];
  const groups = [["commit", "Commit"], ["best_case", "Best case"], ["pipeline", "Pipeline"]] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Forecasting" description="Forecasts combine booked revenue with open deals closing in the period. Every projection shows its range and assumptions; none is a guaranteed result."
        actions={<><PeriodPicker period={period} basePath="/dashboard/forecasting" fiscal={data.fiscalStartMonth} /><a href={`/api/reports/export?type=forecast&period=${period.type}&start=${isoDate(period.start)}`} className="btn btn-outline btn-sm"><Download size={14} />Export</a></>} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Closed won" value={money(f.closedWon, c, true)} sub={<ActualTag />} />
        <StatCard label="Target" value={f.target != null ? money(f.target, c, true) : "Not set"} sub={f.target == null ? <Link href="/dashboard/targets" className="text-blue">Set a target</Link> : `${pct((f.closedWon / f.target) * 100)} achieved`} />
        <StatCard label="Worst case" value={money(f.worstCase, c, true)} projection />
        <StatCard label="Expected case" value={money(f.expectedCase, c, true)} projection />
        <StatCard label="Best case" value={money(f.bestCaseTotal, c, true)} projection />
        <StatCard label={f.gapToTarget != null && f.gapToTarget > 0 ? "Projected shortfall" : "Projected surplus"} value={f.gapToTarget != null ? money(Math.abs(f.gapToTarget), c, true) : "No target"} tone={f.gapToTarget != null && f.gapToTarget > 0 ? "red" : "green"} projection={f.gapToTarget != null} sub={f.coverage != null ? `Coverage ${f.coverage.toFixed(1)}x` : undefined} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Scenarios" description={`Confidence: ${f.confidence} (${f.closedDealsInSample} deals closed in the last 12 months)`} actions={<ProjectionTag />}>
          <ScenarioBars worst={Math.round(f.worstCase)} expected={Math.round(f.expectedCase)} best={Math.round(f.bestCaseTotal)} target={f.target} />
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
            {[["Commit", f.commit], ["Best case deals", f.bestCase], ["Pipeline deals", f.pipeline], ["Run rate (4 period average)", f.runRate]].map(([k, v]) => <div key={k as string} className="rounded-lg bg-canvas p-3"><p className="text-xs text-muted">{k}</p><p className="font-semibold tabular-nums text-ink">{v == null ? "Not enough history" : money(v as number, c)}</p></div>)}
          </div>
        </Card>
        <Card title={forecast?.status === "submitted" ? "Submitted forecast" : "Submit a forecast"} description={forecast ? `Current call ${money(Number(forecast.submitted_amount ?? 0), c)} · ${forecast.status}` : period.label}>
          {can(ctx.role, "forecast.manage") ? <ForecastForm periodType={period.type} periodStart={isoDate(period.start)} expected={f.expectedCase} /> : <p className="text-sm text-muted">Managers, revenue operations and administrators submit forecasts. You can review the numbers here.</p>}
        </Card>
      </div>

      <Card title="Assumptions and uncertainty" actions={<Info size={16} className="text-muted" />}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-body">{f.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
        {f.confidence === "low" && <Notice tone="warning" className="mt-4">With limited closed deal history, these projections can move significantly. Treat them as directional and review the individual deals below.</Notice>}
      </Card>

      <Card title="Deals in this forecast" description={`${f.deals.length} open deals with a close date in ${period.label}`} bodyClass="p-0">
        {f.deals.length ? (
          <div className="overflow-x-auto">
            <table className="table min-w-[900px]">
              <thead><tr><th>Deal</th><th>Owner</th><th>Stage</th><th>Category</th><th className="text-right">Amount</th><th className="text-right">Probability</th><th className="text-right">Weighted</th><th>Health</th></tr></thead>
              <tbody>
                {groups.flatMap(([key, label]) => {
                  const list = f.deals.filter((x) => x.category === key);
                  if (!list.length) return [];
                  return [<tr key={key}><td colSpan={8} className="bg-canvas text-xs font-bold uppercase tracking-wide text-muted">{label} · {money(list.reduce((a, x) => a + x.amount, 0), c)}</td></tr>,
                    ...list.map((x) => <tr key={x.id}><td><Link href={`/dashboard/deals/${x.id}`} className="font-semibold text-ink hover:text-blue">{x.name}</Link><span className="block text-xs text-muted">{x.account} · closes {x.closeDate}</span></td><td>{x.owner}</td><td>{x.stage}</td><td className="capitalize">{x.category.replace("_", " ")}</td><td className="num text-right font-semibold">{money(x.amount, c)}</td><td className="num text-right">{x.probability}%<span className="block text-[11px] text-muted">{x.probabilitySource}</span></td><td className="num text-right">{money(x.weighted, c)}</td><td><HealthBadge health={x.health} /></td></tr>)];
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="p-5 text-sm text-muted">No open deals have an expected close date in this period.</p>}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Forecast changes" description="Snapshots saved for this period, newest first">
          {(snaps ?? []).length ? (
            <ul className="divide-y divide-line text-sm">
              {(snaps ?? []).map((s, i) => {
                const next = (snaps ?? [])[i + 1];
                const delta = next ? Number(s.expected_case) - Number(next.expected_case) : null;
                return <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><span className="text-muted">{formatDateTime(s.created_at)} · {memberName(data, s.taken_by)}</span><span className="tabular-nums"><span className="font-semibold text-ink">{money(Number(s.expected_case), c)}</span> expected{s.submitted_amount != null && <> · call {money(Number(s.submitted_amount), c)}</>}{delta != null && delta !== 0 && <Badge tone={delta > 0 ? "opportunity" : "warning"} className="ml-2">{delta > 0 ? "+" : ""}{money(delta, c, true)}</Badge>}</span></li>;
              })}
            </ul>
          ) : <p className="text-sm text-muted">Submit or save a forecast to start tracking how it changes over time.</p>}
          {prevSnap && <p className="mt-3 text-xs text-muted">Since the last snapshot the expected case has moved by {money(f.expectedCase - Number(prevSnap.expected_case), c)}.</p>}
        </Card>
        <Card title="Historical accuracy" description={avgAcc.length ? `Average accuracy ${pct(avgAcc.reduce((a, x) => a + (x.accuracy ?? 0), 0) / avgAcc.length)} across ${avgAcc.length} completed periods` : "Accuracy is measured once a forecasted period has ended"}>
          {accuracy.length ? <ForecastActualChart data={accuracy.slice(-8).map((a) => ({ label: a.periodStart.slice(0, 7), forecast: Math.round(a.forecast), actual: Math.round(a.actual) }))} /> : <p className="text-sm text-muted">No completed forecast periods yet.</p>}
        </Card>
      </div>
    </div>
  );
}
