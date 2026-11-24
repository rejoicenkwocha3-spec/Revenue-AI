import Link from "next/link";
import { AlertTriangle, BadgeDollarSign, Briefcase, CircleCheck, CircleX, Gauge, LineChart, Percent, Scale, Target, TrendingUp, Layers, Sparkles, Database } from "lucide-react";
import { pageData, periodFromParams } from "@/lib/page";
import { summarize, monthlySeries, funnel, byDimension, memberName, accountName } from "@/lib/revenue/metrics";
import { computeForecast, forecastAccuracy } from "@/lib/revenue/forecast";
import { revenueInsights } from "@/lib/revenue/insights";
import { money, pct } from "@/lib/format";
import { timeAgo } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { PageHeader, StatCard, Card, HealthBadge, Badge, Evidence, ProjectionTag, ActualTag, EmptyState, Notice } from "@/components/app/ui";
import { RevenueTrendChart, FunnelChart, HBarChart, ForecastActualChart } from "@/components/app/charts";
import { PeriodPicker } from "@/components/app/PeriodPicker";
import { SampleDataButton } from "./SampleDataButton";

export const metadata = { title: "Overview" };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { ctx, data, health, supabase } = await pageData();
  const period = periodFromParams(sp, data.fiscalStartMonth, data.now);
  const c = data.currency;
  const atRiskIds = new Set([...health.values()].filter((h) => h.health === "at_risk").map((h) => h.opportunityId));
  const s = summarize(data, period, atRiskIds);
  const f = computeForecast(data, period, health);
  const insights = revenueInsights(data, health, computeForecast(data, periodFromParams({}, data.fiscalStartMonth, data.now), health));
  const empty = data.opportunities.length === 0 && data.transactions.length === 0;

  const { data: snapshots } = await supabase.from("forecast_snapshots").select("period_start, period_end, expected_case, submitted_amount, created_at").eq("org_id", ctx.orgId).order("created_at", { ascending: false }).limit(200);
  const accuracy = forecastAccuracy(data, (snapshots ?? []).map((x) => ({ ...x, expected_case: Number(x.expected_case), submitted_amount: x.submitted_amount == null ? null : Number(x.submitted_amount) })));
  const risky = [...health.values()].filter((h) => h.health !== "healthy").map((h) => ({ h, o: data.opportunities.find((o) => o.id === h.opportunityId)! })).sort((a, b) => a.h.score - b.h.score || b.o.amount - a.o.amount).slice(0, 6);
  const recent = data.activities.slice(0, 7);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={`Welcome back, ${ctx.fullName.split(" ")[0]}`}
        description={<>Revenue performance for <span className="font-semibold text-ink">{period.label}</span>. Actual results come from booked revenue; projections are marked and explain their assumptions.</>}
        actions={<PeriodPicker period={period} basePath="/dashboard" fiscal={data.fiscalStartMonth} />}
      />

      {empty && (
        <Card>
          <EmptyState icon={Database} title="Your revenue workspace is ready" body="Add opportunities, connect your CRM or load clearly labelled example records to explore every feature. Every dashboard number is calculated from the records in this workspace.">
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/dashboard/opportunities?new=1" className="btn btn-primary btn-sm">Add an opportunity</Link>
              <Link href="/dashboard/integrations" className="btn btn-outline btn-sm">Connect a CRM</Link>
              {can(ctx.role, "deal.manage_any") && <SampleDataButton />}
            </div>
          </EmptyState>
        </Card>
      )}

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total revenue" value={money(s.totalRevenue, c, true)} icon={BadgeDollarSign} tone="blue" sub={<><ActualTag />Booked in period</>} />
        <StatCard label="Forecasted revenue" value={money(f.expectedCase, c, true)} icon={TrendingUp} tone="purple" projection sub={`Range ${money(f.worstCase, c, true)} to ${money(f.bestCaseTotal, c, true)}`} />
        <StatCard label="Total pipeline" value={money(s.pipelineValue, c, true)} icon={Layers} tone="blue" sub={`${s.openDeals} open deals`} />
        <StatCard label="Weighted pipeline" value={money(s.weightedPipeline, c, true)} icon={Scale} tone="purple" sub="Amount × probability" />
        <StatCard label="Closed won" value={money(s.closedWonValue, c, true)} icon={CircleCheck} tone="green" sub={`${s.closedWonCount} deals`} />
        <StatCard label="Closed lost" value={money(s.closedLostValue, c, true)} icon={CircleX} tone="red" sub={`${s.closedLostCount} deals`} />
        <StatCard label="Deals at risk" value={s.dealsAtRisk} icon={AlertTriangle} tone="amber" sub={<Link href="/dashboard/deals?health=at_risk" className="text-blue hover:underline">Inspect deals</Link>} />
        <StatCard label="Average deal size" value={money(s.avgDealSize, c, true)} icon={Briefcase} tone="navy" sub="Won deals in period" />
        <StatCard label="Win rate" value={pct(s.winRate)} icon={Percent} tone="green" sub={`${s.closedWonCount} won of ${s.closedWonCount + s.closedLostCount} decided`} />
        <StatCard label="Quota attainment" value={s.target ? pct(s.quotaAttainment) : "No target"} icon={Target} tone="blue" sub={s.target ? `of ${money(s.target, c, true)}` : <Link href="/dashboard/targets" className="text-blue hover:underline">Set a target</Link>} />
        <StatCard label="Annual recurring revenue" value={money(s.arr, c, true)} icon={LineChart} tone="navy" sub={`MRR ${money(s.mrr, c, true)}`} />
        <StatCard label="Sales cycle" value={s.salesCycleDays != null ? `${s.salesCycleDays} days` : "No data"} icon={Gauge} tone="amber" sub="Created to closed won" />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Revenue performance" description="Monthly booked revenue (actual) and weighted pipeline by expected close month (projection).">
          <RevenueTrendChart data={monthlySeries(data, 12, 3)} />
        </Card>
        <Card title="Pipeline funnel" description="Open deal value by stage" actions={<Link href="/dashboard/pipeline" className="text-sm font-semibold text-blue">Open pipeline</Link>}>
          {s.openDeals ? <FunnelChart data={funnel(data)} /> : <p className="text-sm text-muted">No open deals yet.</p>}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="AI generated insights" description="From your records by the revenue insights rules" className="xl:col-span-2" actions={<Link href="/dashboard/intelligence" className="text-sm font-semibold text-blue">All intelligence</Link>}>
          {insights.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {insights.slice(0, 4).map((i) => (
                <li key={i.title} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone={i.severity}>{i.severity}</Badge>{i.isProjection ? <ProjectionTag /> : <ActualTag />}</div>
                  <p className="mt-2 font-semibold text-ink">{i.title}</p>
                  <p className="mt-1 text-sm text-body">{i.body}</p>
                  <Evidence items={i.evidence.slice(0, 3)} />
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Insights appear once there are deals, revenue and activity to analyse.</p>}
        </Card>
        <Card title="Forecast versus actual" description="Last forecast snapshot before each period ended, against booked revenue">
          {accuracy.length ? (
            <ForecastActualChart data={accuracy.slice(-6).map((a) => ({ label: a.periodStart.slice(0, 7), forecast: Math.round(a.forecast), actual: Math.round(a.actual) }))} />
          ) : (
            <div className="space-y-3 text-sm">
              <Notice>No completed forecast periods yet. Save forecast snapshots on the Forecasting page and accuracy is tracked automatically when each period ends.</Notice>
              <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2"><span>This period so far</span><span className="font-semibold tabular-nums">{money(f.closedWon, c)}</span></div>
              <div className="flex items-center justify-between rounded-lg bg-lavender px-3 py-2"><span className="inline-flex items-center gap-1.5"><Sparkles size={13} />Expected case</span><span className="font-semibold tabular-nums">{money(f.expectedCase, c)}</span></div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Revenue by sales representative" description={`Booked in ${period.label}`}>
          {byDimension(data, period, "owner").length ? <HBarChart data={byDimension(data, period, "owner").slice(0, 8)} /> : <p className="text-sm text-muted">No revenue booked in this period.</p>}
        </Card>
        <Card title="Deal risk overview" description="Lowest health open deals" actions={<Link href="/dashboard/deals" className="text-sm font-semibold text-blue">Inspect</Link>} bodyClass="p-0">
          {risky.length ? (
            <ul className="divide-y divide-line">
              {risky.map(({ h, o }) => (
                <li key={o.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/dashboard/deals/${o.id}`} className="truncate font-semibold text-ink hover:text-blue">{o.name}</Link>
                    <HealthBadge health={h.health} score={h.score} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{money(o.amount, c)} · {h.factors[0]?.title ?? "Low engagement"}</p>
                </li>
              ))}
            </ul>
          ) : <p className="p-5 text-sm text-muted">No open deals need attention.</p>}
        </Card>
        <Card title="Recent activities" actions={<Link href="/dashboard/activities" className="text-sm font-semibold text-blue">All activity</Link>} bodyClass="p-0">
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((a) => (
                <li key={a.id} className="px-5 py-3 text-sm">
                  <p className="truncate font-medium text-ink"><span className="capitalize text-muted">{a.type}:</span> {a.subject}</p>
                  <p className="truncate text-xs text-muted">{memberName(data, a.user_id)} · {a.opportunity_id ? data.opportunities.find((o) => o.id === a.opportunity_id)?.name : accountName(data, a.account_id)} · {timeAgo(a.occurred_at)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="p-5 text-sm text-muted">Logged calls, emails and meetings appear here.</p>}
        </Card>
      </div>
    </div>
  );
}
