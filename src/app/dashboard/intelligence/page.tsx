import Link from "next/link";
import { Sparkles } from "lucide-react";
import { pageData } from "@/lib/page";
import { revenueInsights } from "@/lib/revenue/insights";
import { computeForecast } from "@/lib/revenue/forecast";
import { analyse } from "@/lib/revenue/agents";
import { periodFor, shiftPeriod, daysBetween } from "@/lib/revenue/periods";
import { summarize, stageConversion, repPerformance } from "@/lib/revenue/metrics";
import { money, pct } from "@/lib/format";
import { PageHeader, Card, Badge, Evidence, ProjectionTag, ActualTag, StatCard } from "@/components/app/ui";

export const metadata = { title: "Revenue Intelligence" };

export default async function IntelligencePage() {
  const { data, health } = await pageData();
  const q = periodFor("quarter", data.now, data.fiscalStartMonth);
  const f = computeForecast(data, q, health);
  const insights = revenueInsights(data, health, f);
  const cur = summarize(data, q);
  const prev = summarize(data, shiftPeriod(q, -1, data.fiscalStartMonth));
  const pipelineFindings = analyse("pipeline_analysis", data);
  const moves = data.history.filter((h) => h.field === "stage" && daysBetween(h.created_at, data.now) <= 30);
  const advanced = moves.filter((h) => { const a = data.stages.find((s) => s.name === h.old_value)?.position ?? 0; const b = data.stages.find((s) => s.name === h.new_value)?.position ?? 0; return b > a; }).length;
  const reps = repPerformance(data, q).slice(0, 3);
  const c = data.currency;
  const delta = (a: number | null, b: number | null) => (a != null && b != null && b !== 0 ? `${a >= b ? "+" : ""}${pct(((a - b) / b) * 100)} vs ${prev.period.label}` : `No ${prev.period.label} comparison`);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Revenue Intelligence" description={`Patterns in revenue, pipeline movement, deal risk, conversion and team performance for ${q.label}, with the records behind each finding.`} actions={<Link href="/dashboard/assistant" className="btn btn-primary btn-sm"><Sparkles size={14} />Ask a question</Link>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue this quarter" value={money(cur.totalRevenue, c, true)} sub={delta(cur.totalRevenue, prev.totalRevenue)} />
        <StatCard label="Win rate" value={pct(cur.winRate)} sub={cur.winRate != null && prev.winRate != null ? `${prev.period.label}: ${pct(prev.winRate)}` : "Needs closed deals"} />
        <StatCard label="Pipeline movement (30 days)" value={`${moves.length} stage changes`} sub={`${advanced} advanced, ${moves.length - advanced} moved back or closed`} />
        <StatCard label="Expected quarter" value={money(f.expectedCase, c, true)} projection sub={`Confidence ${f.confidence}`} />
      </section>
      <Card title="Insights" description="Generated from your records. Projections are labelled.">
        {insights.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {insights.map((i) => <li key={i.title} className="rounded-xl border border-line p-4"><div className="flex flex-wrap gap-2"><Badge tone={i.severity}>{i.category.replace("_", " ")}</Badge>{i.isProjection ? <ProjectionTag /> : <ActualTag />}</div><p className="mt-2 font-semibold text-ink">{i.title}</p><p className="mt-1 text-sm text-body">{i.body}</p><Evidence items={i.evidence} /></li>)}
          </ul>
        ) : <p className="text-sm text-muted">Insights appear once deals, revenue and activities are recorded.</p>}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Pipeline analysis" description="Bottlenecks, conversion and coverage">
          {pipelineFindings.length ? <ul className="space-y-3">{pipelineFindings.map((p) => <li key={p.title} className="rounded-lg border border-line p-3"><p className="font-semibold text-ink">{p.title}</p><p className="mt-1 text-sm text-body">{p.body}</p><Evidence items={p.evidence.slice(0, 4)} /></li>)}</ul> : <p className="text-sm text-muted">No bottlenecks or coverage gaps detected.</p>}
        </Card>
        <div className="space-y-6">
          <Card title="Conversion by stage" description="Closed deals reaching each stage that were won">
            {stageConversion(data).some((s) => s.rate != null) ? <ul className="space-y-2">{stageConversion(data).map((s) => <li key={s.stage} className="flex items-center gap-3 text-sm"><span className="w-28 shrink-0 truncate text-ink">{s.stage}</span><div className="h-2 flex-1 rounded-full bg-canvas"><div className="h-2 rounded-full bg-blue" style={{ width: `${s.rate ?? 0}%` }} /></div><span className="w-24 text-right text-xs tabular-nums text-muted">{s.rate != null ? `${pct(s.rate)} of ${s.reached}` : "No data"}</span></li>)}</ul> : <p className="text-sm text-muted">Needs closed deals.</p>}
          </Card>
          <Card title="Top performers this quarter" actions={<Link href="/dashboard/performance" className="text-sm font-semibold text-blue">Team performance</Link>}>
            {reps.length ? <ul className="space-y-2 text-sm">{reps.map((r) => <li key={r.userId} className="flex justify-between"><span className="text-ink">{r.name}</span><span className="tabular-nums text-muted">{money(r.revenue, c)}{r.attainment != null && ` · ${pct(r.attainment)} of quota`}</span></li>)}</ul> : <p className="text-sm text-muted">No representatives yet.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
