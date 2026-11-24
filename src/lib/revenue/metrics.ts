import type { OrgData, Opportunity } from "./types";
import { inPeriod, isoDate, periodFor, shiftPeriod, daysBetween, type Period } from "./periods";

export function stageMap(d: OrgData) {
  return new Map(d.stages.map((s) => [s.id, s]));
}
export function memberName(d: OrgData, id: string | null | undefined) {
  if (!id) return "Unassigned";
  return d.members.find((m) => m.user_id === id)?.full_name ?? "Former member";
}
export function accountName(d: OrgData, id: string | null | undefined) {
  if (!id) return "No account";
  return d.accounts.find((a) => a.id === id)?.name ?? "Unknown account";
}

/** Probability used for weighting: the deal's own probability, otherwise its stage default. */
export function dealProbability(d: OrgData, o: Opportunity): number {
  if (o.status === "won") return 100;
  if (o.status === "lost") return 0;
  if (o.probability != null) return o.probability;
  return o.stage_id ? stageMap(d).get(o.stage_id)?.probability ?? 0 : 0;
}

const POSITIVE = new Set(["new", "expansion", "renewal", "one_time"]);
const NEGATIVE = new Set(["churn", "contraction"]);

/** Annual recurring revenue at a date: recurring new and expansion bookings minus churn and contraction. Renewals keep existing ARR. */
export function arrAt(d: OrgData, at: Date): number {
  const cutoff = isoDate(at);
  let arr = 0;
  for (const t of d.transactions) {
    if (!t.recurring || t.occurred_on > cutoff) continue;
    if (t.type === "new" || t.type === "expansion") arr += t.amount;
    if (NEGATIVE.has(t.type)) arr -= t.amount;
  }
  return Math.max(0, arr);
}

export interface Summary {
  period: Period;
  totalRevenue: number;
  newRevenue: number;
  expansionRevenue: number;
  renewalRevenue: number;
  churnedRevenue: number;
  arr: number;
  mrr: number;
  pipelineValue: number;
  weightedPipeline: number;
  openDeals: number;
  closedWonCount: number;
  closedWonValue: number;
  closedLostCount: number;
  closedLostValue: number;
  winRate: number | null;
  avgDealSize: number | null;
  salesCycleDays: number | null;
  dealsAtRisk: number;
  target: number | null;
  quotaAttainment: number | null;
  pipelineInPeriod: number;
}

/** Bookings in a period come from revenue transactions (closed won deals create them automatically). */
export function summarize(d: OrgData, period: Period, atRiskIds?: Set<string>): Summary {
  const tx = d.transactions.filter((t) => inPeriod(t.occurred_on, period));
  const sum = (types: string[]) => tx.filter((t) => types.includes(t.type)).reduce((a, t) => a + t.amount, 0);
  const totalRevenue = tx.filter((t) => POSITIVE.has(t.type)).reduce((a, t) => a + t.amount, 0);
  const open = d.opportunities.filter((o) => o.status === "open");
  const won = d.opportunities.filter((o) => o.status === "won" && inPeriod(o.closed_at, period));
  const lost = d.opportunities.filter((o) => o.status === "lost" && inPeriod(o.closed_at, period));
  const decided = won.length + lost.length;
  const cycles = won.map((o) => daysBetween(o.created_at, o.closed_at!)).filter((n) => n >= 0);
  const target = orgTarget(d, period);
  const end = period.end < d.now ? period.end : d.now;
  const arr = arrAt(d, end);
  return {
    period,
    totalRevenue,
    newRevenue: sum(["new"]),
    expansionRevenue: sum(["expansion"]),
    renewalRevenue: sum(["renewal"]),
    churnedRevenue: sum(["churn", "contraction"]),
    arr,
    mrr: arr / 12,
    pipelineValue: open.reduce((a, o) => a + o.amount, 0),
    weightedPipeline: open.reduce((a, o) => a + (o.amount * dealProbability(d, o)) / 100, 0),
    openDeals: open.length,
    closedWonCount: won.length,
    closedWonValue: won.reduce((a, o) => a + o.amount, 0),
    closedLostCount: lost.length,
    closedLostValue: lost.reduce((a, o) => a + o.amount, 0),
    winRate: decided > 0 ? (won.length / decided) * 100 : null,
    avgDealSize: won.length ? won.reduce((a, o) => a + o.amount, 0) / won.length : null,
    salesCycleDays: cycles.length ? Math.round(cycles.reduce((a, n) => a + n, 0) / cycles.length) : null,
    dealsAtRisk: atRiskIds ? open.filter((o) => atRiskIds.has(o.id)).length : 0,
    target,
    quotaAttainment: target ? (totalRevenue / target) * 100 : null,
    pipelineInPeriod: open.filter((o) => inPeriod(o.close_date, period)).reduce((a, o) => a + o.amount, 0),
  };
}

/** Organisation target for a period: an exact organisation target, or the sum of individual targets for that period. */
export function orgTarget(d: OrgData, period: Period): number | null {
  const s = isoDate(period.start);
  const e = isoDate(period.end);
  const exact = d.targets.filter((t) => t.scope === "organisation" && t.period_start === s && t.period_end === e);
  if (exact.length) return exact.reduce((a, t) => a + t.amount, 0);
  const users = d.targets.filter((t) => t.scope === "user" && t.period_start === s && t.period_end === e);
  if (users.length) return users.reduce((a, t) => a + t.amount, 0);
  return null;
}

export function userTarget(d: OrgData, userId: string, period: Period): number | null {
  const s = isoDate(period.start);
  const e = isoDate(period.end);
  const t = d.targets.filter((x) => x.scope === "user" && x.user_id === userId && x.period_start === s && x.period_end === e);
  return t.length ? t.reduce((a, x) => a + x.amount, 0) : null;
}

/** Monthly bookings for the last `months` months, plus weighted pipeline expected to close in future months. */
export function monthlySeries(d: OrgData, months = 12, ahead = 3) {
  const cur = periodFor("month", d.now);
  const rows: { key: string; label: string; actual: number | null; projected: number | null; target: number | null; isFuture: boolean }[] = [];
  for (let i = -(months - 1); i <= ahead; i++) {
    const p = shiftPeriod(cur, i);
    const isFuture = i > 0;
    const actual = isFuture ? null : d.transactions.filter((t) => POSITIVE.has(t.type) && inPeriod(t.occurred_on, p)).reduce((a, t) => a + t.amount, 0);
    const projected = i >= 0
      ? d.opportunities.filter((o) => o.status === "open" && inPeriod(o.close_date, p)).reduce((a, o) => a + (o.amount * dealProbability(d, o)) / 100, 0)
      : null;
    rows.push({
      key: isoDate(p.start),
      label: p.start.toLocaleDateString("en", { month: "short", year: "2-digit", timeZone: "UTC" }),
      actual,
      projected: projected == null ? null : (i === 0 ? (actual ?? 0) + projected : projected),
      target: orgTarget(d, p),
      isFuture,
    });
  }
  return rows;
}

/** Open pipeline by stage, with conversion from each stage based on stage history of deals created in the last year. */
export function funnel(d: OrgData) {
  const open = d.stages.filter((s) => s.kind === "open");
  return open.map((s) => {
    const deals = d.opportunities.filter((o) => o.status === "open" && o.stage_id === s.id);
    return { stageId: s.id, stage: s.name, count: deals.length, value: deals.reduce((a, o) => a + o.amount, 0), probability: s.probability };
  });
}

/**
 * Share of closed deals that reached each open stage and went on to win.
 * Won deals passed every stage. A lost deal reached the open stage it was lost from, taken from stage history;
 * when history is missing it is counted as reaching only the first stage.
 */
export function stageConversion(d: OrgData) {
  const open = d.stages.filter((s) => s.kind === "open");
  const lostStageNames = new Set(d.stages.filter((s) => s.kind === "lost").map((s) => s.name));
  const firstPos = open[0]?.position ?? 0;
  const lostFrom = new Map<string, number>();
  for (const h of [...d.history].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (h.field === "stage" && h.new_value && lostStageNames.has(h.new_value) && h.old_value) {
      const pos = open.find((s) => s.name === h.old_value)?.position;
      if (pos != null) lostFrom.set(h.opportunity_id, pos);
    }
  }
  const closed = d.opportunities.filter((o) => o.status !== "open");
  return open.map((s) => {
    const reached = closed.filter((o) => o.status === "won" || (lostFrom.get(o.id) ?? firstPos) >= s.position);
    const won = reached.filter((o) => o.status === "won");
    return { stage: s.name, reached: reached.length, won: won.length, rate: reached.length ? (won.length / reached.length) * 100 : null };
  });
}

export function byDimension(d: OrgData, period: Period, dim: "owner" | "region" | "product") {
  const map = new Map<string, number>();
  for (const t of d.transactions) {
    if (!POSITIVE.has(t.type) || !inPeriod(t.occurred_on, period)) continue;
    const key = dim === "owner" ? memberName(d, t.owner_id) : (dim === "region" ? t.region : t.product) || "Not set";
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export interface RepPerformance {
  userId: string; name: string; role: string; revenue: number; target: number | null; attainment: number | null; dealsWon: number; dealsLost: number;
  winRate: number | null; openPipeline: number; opportunitiesCreated: number; meetingsBooked: number; activities: number; avgDealSize: number | null;
}

export function repPerformance(d: OrgData, period: Period): RepPerformance[] {
  return d.members
    .filter((m) => ["sales_rep", "sales_manager", "owner", "admin"].includes(m.role) || d.opportunities.some((o) => o.owner_id === m.user_id))
    .map((m) => {
      const revenue = d.transactions.filter((t) => t.owner_id === m.user_id && POSITIVE.has(t.type) && inPeriod(t.occurred_on, period)).reduce((a, t) => a + t.amount, 0);
      const won = d.opportunities.filter((o) => o.owner_id === m.user_id && o.status === "won" && inPeriod(o.closed_at, period));
      const lost = d.opportunities.filter((o) => o.owner_id === m.user_id && o.status === "lost" && inPeriod(o.closed_at, period));
      const target = userTarget(d, m.user_id, period);
      return {
        userId: m.user_id,
        name: m.full_name,
        role: m.role,
        revenue,
        target,
        attainment: target ? (revenue / target) * 100 : null,
        dealsWon: won.length,
        dealsLost: lost.length,
        winRate: won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : null,
        openPipeline: d.opportunities.filter((o) => o.owner_id === m.user_id && o.status === "open").reduce((a, o) => a + o.amount, 0),
        opportunitiesCreated: d.opportunities.filter((o) => o.owner_id === m.user_id && inPeriod(o.created_at, period)).length,
        meetingsBooked: d.meetings.filter((x) => x.organiser_id === m.user_id && inPeriod(x.starts_at, period) && x.status !== "cancelled").length,
        activities: d.activities.filter((a) => a.user_id === m.user_id && inPeriod(a.occurred_at, period)).length,
        avgDealSize: won.length ? won.reduce((a, o) => a + o.amount, 0) / won.length : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.openPipeline - a.openPipeline);
}

export function lastActivityAt(d: OrgData, o: Opportunity): string | null {
  return o.last_activity_at ?? null;
}
