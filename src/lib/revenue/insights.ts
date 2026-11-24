import type { Evidence, OrgData } from "./types";
import { summarize, byDimension } from "./metrics";
import { periodFor, shiftPeriod } from "./periods";
import type { DealHealth } from "./dealHealth";
import type { ForecastResult } from "./forecast";

export interface Insight {
  category: string;
  title: string;
  body: string;
  severity: "info" | "opportunity" | "warning" | "critical";
  isProjection: boolean;
  evidence: Evidence[];
}

const money = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${Math.round(n)}%`;

/** Rule based insights from the organisation's own records. Projections are labelled as projections. */
export function revenueInsights(d: OrgData, health: Map<string, DealHealth>, forecast: ForecastResult): Insight[] {
  const out: Insight[] = [];
  const q = periodFor("quarter", d.now, d.fiscalStartMonth);
  const prevQ = shiftPeriod(q, -1, d.fiscalStartMonth);
  const cur = summarize(d, q);
  const prev = summarize(d, prevQ);

  if (d.opportunities.length === 0) return out;

  if (forecast.target != null) {
    const gap = forecast.target - forecast.expectedCase;
    out.push({
      category: "forecast",
      title: gap > 0 ? `Projected ${money(gap)} short of the ${q.label} target` : `Projected to reach the ${q.label} target`,
      body: gap > 0
        ? `The expected case is ${money(forecast.expectedCase)} against a target of ${money(forecast.target)}. Remaining open pipeline in the period covers ${forecast.coverage ? forecast.coverage.toFixed(1) + "x" : "none"} of the remaining target.`
        : `The expected case is ${money(forecast.expectedCase)} against a target of ${money(forecast.target)}. Confidence is ${forecast.confidence}.`,
      severity: gap > 0 ? (forecast.worstCase < forecast.target * 0.7 ? "critical" : "warning") : "opportunity",
      isProjection: true,
      evidence: [
        { label: "Closed this quarter", value: money(forecast.closedWon) },
        { label: "Expected case (projection)", value: money(forecast.expectedCase) },
        { label: "Range (projection)", value: `${money(forecast.worstCase)} to ${money(forecast.bestCaseTotal)}` },
      ],
    });
  }

  const atRisk = [...health.values()].filter((h) => h.health === "at_risk");
  if (atRisk.length) {
    const value = atRisk.reduce((a, h) => a + (d.opportunities.find((o) => o.id === h.opportunityId)?.amount ?? 0), 0);
    const top = atRisk.map((h) => ({ h, o: d.opportunities.find((o) => o.id === h.opportunityId)! })).sort((a, b) => b.o.amount - a.o.amount).slice(0, 3);
    out.push({
      category: "deal_risk",
      title: `${atRisk.length} deal${atRisk.length > 1 ? "s" : ""} worth ${money(value)} at risk`,
      body: `Largest: ${top.map((t) => `${t.o.name} (${t.h.factors[0]?.title.toLowerCase() ?? "low score"})`).join("; ")}.`,
      severity: value > cur.pipelineValue * 0.25 ? "critical" : "warning",
      isProjection: false,
      evidence: top.map((t) => ({ label: t.o.name, value: `Health ${t.h.score}/100`, href: `/dashboard/deals/${t.o.id}` })),
    });
  }

  if (cur.winRate != null && prev.winRate != null && Math.abs(cur.winRate - prev.winRate) >= 5) {
    const up = cur.winRate > prev.winRate;
    out.push({
      category: "win_rate",
      title: `Win rate ${up ? "up" : "down"} to ${pct(cur.winRate)} this quarter`,
      body: `Compared with ${pct(prev.winRate)} in ${prevQ.label}, from ${cur.closedWonCount} won and ${cur.closedLostCount} lost deals this quarter.`,
      severity: up ? "opportunity" : "warning",
      isProjection: false,
      evidence: [{ label: `${q.label} win rate`, value: pct(cur.winRate) }, { label: `${prevQ.label} win rate`, value: pct(prev.winRate) }],
    });
  }

  const now30 = d.opportunities.filter((o) => (d.now.getTime() - new Date(o.created_at).getTime()) / 86400000 <= 30);
  const prior30 = d.opportunities.filter((o) => { const age = (d.now.getTime() - new Date(o.created_at).getTime()) / 86400000; return age > 30 && age <= 60; });
  const nv = now30.reduce((a, o) => a + o.amount, 0);
  const pv = prior30.reduce((a, o) => a + o.amount, 0);
  if (pv > 0 && Math.abs(nv - pv) / pv >= 0.2) {
    out.push({
      category: "pipeline",
      title: `New pipeline ${nv > pv ? "up" : "down"} ${pct((Math.abs(nv - pv) / pv) * 100)} in the last 30 days`,
      body: `${now30.length} opportunities worth ${money(nv)} were created in the last 30 days, compared with ${prior30.length} worth ${money(pv)} in the 30 days before.`,
      severity: nv > pv ? "opportunity" : "warning",
      isProjection: false,
      evidence: [{ label: "Last 30 days", value: money(nv) }, { label: "Previous 30 days", value: money(pv) }],
    });
  }

  const stale = [...health.values()].filter((h) => h.factors.some((f) => f.code === "inactive" || f.code === "no_activity"));
  if (stale.length) {
    out.push({
      category: "activity",
      title: `${stale.length} open deal${stale.length > 1 ? "s have" : " has"} no recent activity`,
      body: "These deals have no logged call, email or meeting in the last 14 days. Re engaging them is usually the fastest way to protect the forecast.",
      severity: "warning",
      isProjection: false,
      evidence: stale.slice(0, 4).map((h) => { const o = d.opportunities.find((x) => x.id === h.opportunityId)!; return { label: o.name, value: `${h.components.daysSinceActivity} days`, href: `/dashboard/deals/${o.id}` }; }),
    });
  }

  const regions = byDimension(d, q, "region");
  if (regions.length > 1 && cur.totalRevenue > 0) {
    out.push({
      category: "revenue",
      title: `${regions[0].name} leads revenue this quarter`,
      body: `${regions[0].name} booked ${money(regions[0].value)}, ${pct((regions[0].value / cur.totalRevenue) * 100)} of the quarter's ${money(cur.totalRevenue)}.`,
      severity: "info",
      isProjection: false,
      evidence: regions.slice(0, 3).map((r) => ({ label: r.name, value: money(r.value) })),
    });
  }
  return out;
}
