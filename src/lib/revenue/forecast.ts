import type { OrgData, Opportunity } from "./types";
import { dealProbability, memberName, accountName, orgTarget, stageMap, stageConversion } from "./metrics";
import { inPeriod, isoDate, shiftPeriod, type Period } from "./periods";
import type { DealHealth } from "./dealHealth";

export interface ForecastDeal {
  id: string; name: string; account: string; owner: string; amount: number; closeDate: string | null; category: string; stage: string;
  probability: number; probabilitySource: "historical stage rate" | "deal probability" | "stage default"; weighted: number; health: string | null;
}
export interface ForecastResult {
  period: Period;
  closedWon: number;
  commit: number;
  bestCase: number;
  pipeline: number;
  weightedPipeline: number;
  worstCase: number;
  expectedCase: number;
  bestCaseTotal: number;
  target: number | null;
  gapToTarget: number | null;
  coverage: number | null;
  runRate: number | null;
  confidence: "low" | "medium" | "high";
  closedDealsInSample: number;
  assumptions: string[];
  deals: ForecastDeal[];
}

const MIN_SAMPLE = 5;

/**
 * Builds a forecast for a period from closed revenue and open deals expected to close in the period.
 * The result is an estimate with an explicit range and stated assumptions, never a guarantee.
 */
export function computeForecast(d: OrgData, period: Period, health?: Map<string, DealHealth>): ForecastResult {
  const POS = new Set(["new", "expansion", "renewal", "one_time"]);
  const closedWon = d.transactions.filter((t) => POS.has(t.type) && inPeriod(t.occurred_on, period)).reduce((a, t) => a + t.amount, 0);
  const stages = stageMap(d);
  const conv = new Map(stageConversion(d).map((c) => [c.stage, c]));
  const yearAgo = new Date(d.now.getTime() - 365 * 86400000).toISOString();
  const closedSample = d.opportunities.filter((o) => o.status !== "open" && (o.closed_at ?? "") >= yearAgo).length;

  const deals: ForecastDeal[] = d.opportunities
    .filter((o) => o.status === "open" && o.forecast_category !== "omitted" && inPeriod(o.close_date, period))
    .map((o: Opportunity) => {
      const stage = o.stage_id ? stages.get(o.stage_id) : undefined;
      const c = stage ? conv.get(stage.name) : undefined;
      let probability: number;
      let probabilitySource: ForecastDeal["probabilitySource"];
      if (c && c.reached >= MIN_SAMPLE && c.rate != null) {
        probability = Math.round(c.rate);
        probabilitySource = "historical stage rate";
      } else if (o.probability != null && o.probability !== stage?.probability) {
        probability = o.probability;
        probabilitySource = "deal probability";
      } else {
        probability = dealProbability(d, o);
        probabilitySource = "stage default";
      }
      const h = health?.get(o.id) ?? null;
      const riskFactor = h?.health === "at_risk" ? 0.5 : 1;
      return {
        id: o.id, name: o.name, account: accountName(d, o.account_id), owner: memberName(d, o.owner_id), amount: o.amount, closeDate: o.close_date,
        category: o.forecast_category, stage: stage?.name ?? "Not set", probability, probabilitySource, weighted: (o.amount * probability * riskFactor) / 100, health: h?.health ?? null,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const sumBy = (cat: string) => deals.filter((x) => x.category === cat).reduce((a, x) => a + x.amount, 0);
  const commit = sumBy("commit");
  const bestCase = sumBy("best_case");
  const pipeline = sumBy("pipeline");
  const weightedPipeline = deals.reduce((a, x) => a + x.weighted, 0);
  const worstCase = closedWon + deals.filter((x) => x.category === "commit" && x.health !== "at_risk").reduce((a, x) => a + (x.amount * x.probability) / 100, 0);
  const expectedCase = closedWon + weightedPipeline;
  const bestCaseTotal = closedWon + commit + bestCase + deals.filter((x) => x.category === "pipeline").reduce((a, x) => a + (x.amount * x.probability) / 100, 0);
  const target = orgTarget(d, period);

  // Run rate: average bookings in the previous four periods of the same length.
  const prior = [1, 2, 3, 4].map((i) => shiftPeriod(period, -i, d.fiscalStartMonth));
  const priorTotals = prior.map((p) => d.transactions.filter((t) => POS.has(t.type) && inPeriod(t.occurred_on, p)).reduce((a, t) => a + t.amount, 0));
  const withData = priorTotals.filter((v) => v > 0);
  const runRate = withData.length >= 2 ? priorTotals.reduce((a, v) => a + v, 0) / priorTotals.length : null;

  const confidence: ForecastResult["confidence"] = closedSample >= 30 ? "high" : closedSample >= 10 ? "medium" : "low";
  const historicalStages = [...conv.values()].filter((c) => c.reached >= MIN_SAMPLE).map((c) => c.stage);
  const remaining = target != null ? Math.max(0, target - closedWon) : null;
  const assumptions = [
    `Closed revenue (${fmt(closedWon)}) is actual bookings recorded in ${period.label}.`,
    `Open deals are included when their expected close date falls between ${isoDate(period.start)} and ${isoDate(period.end)}. Deals in the Omitted category are excluded.`,
    historicalStages.length
      ? `Win probability uses your historical stage conversion for ${historicalStages.join(", ")} (at least ${MIN_SAMPLE} closed deals each). Other stages use the deal or stage probability.`
      : `There are not yet ${MIN_SAMPLE} closed deals per stage, so win probability uses each deal's probability or its stage default rather than your history.`,
    "Deals flagged at risk by deal health scoring are counted at half their weighted value in the expected case.",
    "Worst case: closed revenue plus commit deals that are not at risk, weighted by probability. Best case: closed revenue plus the full value of commit and best case deals and weighted pipeline.",
    `Confidence is ${confidence}: based on ${closedSample} deal${closedSample === 1 ? "" : "s"} closed in the last 12 months.${confidence === "low" ? " Treat the projection as directional." : ""}`,
  ];
  return {
    period, closedWon, commit, bestCase, pipeline, weightedPipeline, worstCase, expectedCase, bestCaseTotal, target,
    gapToTarget: target != null ? target - expectedCase : null,
    coverage: remaining ? (commit + bestCase + pipeline) / remaining : null,
    runRate, confidence, closedDealsInSample: closedSample, assumptions, deals,
  };
}

function fmt(n: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export interface AccuracyRow { periodStart: string; periodEnd: string; forecast: number; actual: number; accuracy: number | null; snapshotAt: string }

/** Compares the last snapshot taken before each past period ended with the revenue actually booked. */
export function forecastAccuracy(d: OrgData, snapshots: { period_start: string; period_end: string; expected_case: number; submitted_amount: number | null; created_at: string }[]): AccuracyRow[] {
  const POS = new Set(["new", "expansion", "renewal", "one_time"]);
  const today = isoDate(d.now);
  const byPeriod = new Map<string, (typeof snapshots)[number]>();
  for (const s of snapshots) {
    if (s.period_end >= today) continue;
    if (s.created_at.slice(0, 10) > s.period_end) continue;
    const key = `${s.period_start}|${s.period_end}`;
    const cur = byPeriod.get(key);
    if (!cur || cur.created_at < s.created_at) byPeriod.set(key, s);
  }
  return [...byPeriod.values()].map((s) => {
    const actual = d.transactions.filter((t) => POS.has(t.type) && t.occurred_on >= s.period_start && t.occurred_on <= s.period_end).reduce((a, t) => a + t.amount, 0);
    const forecast = Number(s.submitted_amount ?? s.expected_case);
    return { periodStart: s.period_start, periodEnd: s.period_end, forecast, actual, accuracy: actual > 0 ? Math.max(0, 100 - (Math.abs(forecast - actual) / actual) * 100) : null, snapshotAt: s.created_at };
  }).sort((a, b) => a.periodStart.localeCompare(b.periodStart));
}
