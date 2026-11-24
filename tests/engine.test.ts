import { test } from "node:test";
import assert from "node:assert/strict";
import type { OrgData, Opportunity } from "@/lib/revenue/types";
import { summarize, arrAt, stageConversion, repPerformance, orgTarget } from "@/lib/revenue/metrics";
import { assessDeal, assessAll } from "@/lib/revenue/dealHealth";
import { computeForecast } from "@/lib/revenue/forecast";
import { periodFor, isoDate, shiftPeriod } from "@/lib/revenue/periods";
import { analyse } from "@/lib/revenue/agents";
import { assessCustomers } from "@/lib/revenue/customerHealth";
import { runTool } from "@/lib/ai/tools";

const now = new Date("2026-11-24T12:00:00Z");
const day = 86400000;
const ago = (n: number) => new Date(now.getTime() - n * day).toISOString();
const ahead = (n: number) => isoDate(new Date(now.getTime() + n * day));
const stages = [
  { id: "s1", name: "Qualification", position: 1, probability: 20, kind: "open" as const, expected_days: 14 },
  { id: "s2", name: "Proposal", position: 2, probability: 60, kind: "open" as const, expected_days: 14 },
  { id: "won", name: "Closed Won", position: 3, probability: 100, kind: "won" as const, expected_days: 1 },
  { id: "lost", name: "Closed Lost", position: 4, probability: 0, kind: "lost" as const, expected_days: 1 },
];
function opp(p: Partial<Opportunity> & { id: string }): Opportunity {
  return { name: p.id, account_id: "a1", owner_id: "u1", stage_id: "s1", amount: 10000, probability: null, close_date: ahead(10), forecast_category: "pipeline", deal_type: "new_business", product: "Platform", region: "EMEA", lead_source: null, next_step: "Call", next_step_date: ahead(3), description: null, competitors: [], status: "open", loss_reason: null, stage_entered_at: ago(3), closed_at: null, last_activity_at: ago(1), created_at: ago(20), updated_at: ago(1), ...p };
}
function data(): OrgData {
  return {
    orgId: "o", fiscalStartMonth: 1, currency: "USD", stages, now,
    members: [{ user_id: "u1", role: "sales_rep", team_id: null, territory_id: null, full_name: "Ria Rep", email: "r@x.com" }, { user_id: "u2", role: "sales_manager", team_id: null, territory_id: null, full_name: "Max Manager", email: "m@x.com" }],
    accounts: [{ id: "a1", name: "Acme", industry: null, region: "EMEA", owner_id: "u1", lifecycle_stage: "customer", priority: "high", employee_count: 10, created_at: ago(300) }],
    contacts: [{ id: "c1", account_id: "a1", first_name: "Ann", last_name: "Lee", email: "ann@acme.com", title: "CFO", buying_role: "economic_buyer", last_contacted_at: ago(2) }],
    oppContacts: [{ opportunity_id: "healthy", contact_id: "c1", role: null }],
    opportunities: [
      opp({ id: "healthy", stage_id: "s2", amount: 50000, forecast_category: "commit" }),
      opp({ id: "risky", stage_id: "s2", amount: 80000, forecast_category: "commit", close_date: ahead(-5), last_activity_at: ago(40), stage_entered_at: ago(45), next_step: null }),
      opp({ id: "won1", stage_id: "won", status: "won", amount: 30000, closed_at: ago(10), forecast_category: "closed" }),
      opp({ id: "lost1", stage_id: "lost", status: "lost", amount: 20000, closed_at: ago(12), forecast_category: "omitted" }),
    ],
    activities: [{ id: "x1", type: "call", subject: "Call", notes: null, opportunity_id: "healthy", account_id: "a1", contact_id: "c1", user_id: "u1", outcome: "positive", competitor_mentioned: null, objection: null, budget_discussed: true, occurred_at: ago(1) }],
    meetings: [],
    transactions: [
      { id: "t1", account_id: "a1", opportunity_id: "won1", owner_id: "u1", type: "new", amount: 30000, recurring: true, product: "Platform", region: "EMEA", occurred_on: isoDate(new Date(ago(10))) },
      { id: "t2", account_id: "a1", opportunity_id: null, owner_id: "u1", type: "contraction", amount: 5000, recurring: true, product: null, region: null, occurred_on: isoDate(new Date(ago(5))) },
    ],
    targets: [{ id: "g1", scope: "organisation", team_id: null, user_id: null, period_type: "quarter", period_start: "2026-10-01", period_end: "2026-12-31", amount: 200000 }],
    tasks: [], renewals: [{ id: "r1", account_id: "a1", owner_id: "u1", renewal_date: ahead(20), current_arr: 25000, expected_arr: null, status: "upcoming" }],
    history: [],
  };
}

test("periods follow the fiscal calendar", () => {
  assert.equal(periodFor("quarter", now).label, "Q4 2026");
  const fy = periodFor("quarter", now, 4);
  assert.equal(isoDate(fy.start), "2026-10-01");
  assert.equal(fy.label, "Q3 FY2027");
  assert.equal(isoDate(shiftPeriod(periodFor("quarter", now), -1).start), "2026-07-01");
});

test("summary uses actual bookings and ARR nets churn and contraction", () => {
  const d = data();
  const s = summarize(d, periodFor("quarter", now));
  assert.equal(s.totalRevenue, 30000);
  assert.equal(s.churnedRevenue, 5000);
  assert.equal(arrAt(d, now), 25000);
  assert.equal(s.closedWonCount, 1);
  assert.equal(s.closedLostCount, 1);
  assert.equal(s.winRate, 50);
  assert.equal(s.pipelineValue, 130000);
  assert.equal(s.weightedPipeline, 130000 * 0.6);
  assert.equal(orgTarget(d, periodFor("quarter", now)), 200000);
});

test("deal health flags risks with evidence and keeps missing information separate", () => {
  const d = data();
  const risky = assessDeal(d, d.opportunities[1]);
  const codes = risky.factors.map((f) => f.code);
  assert.ok(codes.includes("close_date_passed"));
  assert.ok(codes.includes("inactive"));
  assert.ok(codes.includes("stalled"));
  assert.equal(risky.factors.find((f) => f.code === "no_stakeholders")?.kind, "missing_information");
  assert.equal(risky.health, "at_risk");
  for (const f of risky.factors) assert.ok(f.evidence.length > 10);
  const healthy = assessDeal(d, d.opportunities[0]);
  assert.ok(healthy.score > risky.score);
});

test("forecast scenarios are ordered and state assumptions", () => {
  const d = data();
  d.opportunities[1].close_date = ahead(10);
  const f = computeForecast(d, periodFor("quarter", now), assessAll(d));
  assert.equal(f.closedWon, 30000);
  assert.ok(f.worstCase <= f.expectedCase && f.expectedCase <= f.bestCaseTotal, `${f.worstCase} ${f.expectedCase} ${f.bestCaseTotal}`);
  assert.equal(f.confidence, "low");
  assert.ok(f.assumptions.some((a) => a.includes("not yet")));
  assert.equal(f.deals.length, 2);
});

test("stage conversion and rep performance use closed deals", () => {
  const d = data();
  let conv = stageConversion(d);
  assert.equal(conv.find((c) => c.stage === "Qualification")?.reached, 2);
  assert.equal(conv.find((c) => c.stage === "Proposal")?.reached, 1, "lost deal without history only reached the first stage");
  d.history.push({ opportunity_id: "lost1", field: "stage", old_value: "Proposal", new_value: "Closed Lost", created_at: ago(12) });
  conv = stageConversion(d);
  assert.equal(conv.find((c) => c.stage === "Proposal")?.reached, 2);
  assert.equal(conv.find((c) => c.stage === "Proposal")?.rate, 50);
  const reps = repPerformance(d, periodFor("quarter", now));
  assert.equal(reps[0].name, "Ria Rep");
  assert.equal(reps[0].revenue, 30000);
});

test("agents return evidence and only approval-gated actions", () => {
  const d = data();
  for (const key of ["deal_inspection", "forecasting", "sales_productivity", "pipeline_analysis", "customer_retention", "revenue_insights"] as const) {
    const recs = analyse(key, d);
    for (const r of recs) {
      assert.ok(r.title.length > 0);
      assert.ok(Array.isArray(r.evidence));
      if (r.action) assert.ok(["create_task", "update_deal", "draft_email"].includes(r.action.type));
    }
  }
  const di = analyse("deal_inspection", d);
  assert.ok(di.some((r) => r.opportunityId === "risky"));
  assert.ok(di.some((r) => r.action?.type === "update_deal"), "commit deal at risk should propose a category change");
});

test("customer health finds renewal and contraction signals", () => {
  const c = assessCustomers(data())[0];
  assert.equal(c.arr, 25000);
  assert.ok(c.signals.some((s) => s.text.includes("Contraction")));
  assert.ok(c.signals.some((s) => s.text.includes("Renewal due")));
});

test("assistant tools return real figures", () => {
  const d = data();
  const me = { userId: "u1", name: "Ria Rep" };
  const s = runTool("get_revenue_summary", { period_type: "quarter" }, d, me) as Record<string, unknown>;
  assert.equal(s.totalRevenue, 30000);
  const risk = runTool("list_opportunities", { health: "at_risk" }, d, me) as { total: number };
  assert.equal(risk.total, 1);
  const deal = runTool("get_deal_details", { deal: "risky" }, d, me) as { name?: string };
  assert.equal(deal.name, "risky");
  const none = runTool("get_deal_details", { deal: "does not exist" }, d, me) as { error?: string };
  assert.ok(none.error);
});
