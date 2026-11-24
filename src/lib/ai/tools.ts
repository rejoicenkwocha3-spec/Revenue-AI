import type { OrgData } from "@/lib/revenue/types";
import { assessAll, assessDeal } from "@/lib/revenue/dealHealth";
import { computeForecast } from "@/lib/revenue/forecast";
import { assessCustomers } from "@/lib/revenue/customerHealth";
import { accountName, dealProbability, funnel, memberName, repPerformance, stageMap, summarize, stageConversion } from "@/lib/revenue/metrics";
import { analyse } from "@/lib/revenue/agents";
import { daysBetween, periodFor, shiftPeriod, isoDate, type PeriodType } from "@/lib/revenue/periods";

/** Tools the assistant uses to read the organisation's data. Every tool returns computed values from real records. */
export const TOOL_DEFS = [
  { name: "get_revenue_summary", description: "Actual revenue metrics for a period: bookings, new, expansion, churn, ARR, MRR, pipeline, weighted pipeline, win rate, average deal size, sales cycle, target and attainment.", input_schema: { type: "object" as const, properties: { period_type: { type: "string", enum: ["month", "quarter", "year"] }, offset: { type: "integer", description: "0 for the current period, -1 for the previous one" } }, required: ["period_type"], additionalProperties: false } },
  { name: "get_forecast", description: "Revenue forecast for a period: closed won, commit, best case, pipeline, worst, expected and best case projections, confidence, assumptions and the deals included.", input_schema: { type: "object" as const, properties: { period_type: { type: "string", enum: ["month", "quarter", "year"] } }, required: ["period_type"], additionalProperties: false } },
  { name: "list_opportunities", description: "Search opportunities with health scores. Filter by status, owner name, stage, health, minimum amount or close date window.", input_schema: { type: "object" as const, properties: { status: { type: "string", enum: ["open", "won", "lost", "any"] }, owner: { type: "string" }, stage: { type: "string" }, health: { type: "string", enum: ["healthy", "watch", "at_risk"] }, min_amount: { type: "number" }, closing_within_days: { type: "integer" }, sort: { type: "string", enum: ["amount", "close_date", "health", "probability"] }, limit: { type: "integer" } }, additionalProperties: false } },
  { name: "get_deal_details", description: "Full detail for one deal by name or id: stage, amount, owner, stakeholders, recent activities, risk factors, missing information and recommendations.", input_schema: { type: "object" as const, properties: { deal: { type: "string" } }, required: ["deal"], additionalProperties: false } },
  { name: "get_inactive_deals", description: "Open deals with no logged activity for at least the given number of days.", input_schema: { type: "object" as const, properties: { days: { type: "integer" } }, additionalProperties: false } },
  { name: "get_rep_performance", description: "Performance by sales representative for a period: revenue, quota attainment, deals won and lost, win rate, pipeline, activities and meetings.", input_schema: { type: "object" as const, properties: { period_type: { type: "string", enum: ["month", "quarter", "year"] } }, required: ["period_type"], additionalProperties: false } },
  { name: "get_pipeline_analysis", description: "Open pipeline by stage, historical stage conversion and new pipeline trend for the last 30 and 60 days.", input_schema: { type: "object" as const, properties: {}, additionalProperties: false } },
  { name: "get_customer_health", description: "Customer health, churn risk, expansion potential and upcoming renewals for customer accounts.", input_schema: { type: "object" as const, properties: { filter: { type: "string", enum: ["all", "churn_risk", "expansion"] } }, additionalProperties: false } },
  { name: "get_priorities", description: "Ranked priorities for today from the Sales Productivity and Deal Inspection analyses.", input_schema: { type: "object" as const, properties: { for_user: { type: "string", description: "A team member's name, or 'me'" } }, additionalProperties: false } },
];

const r0 = (n: number | null | undefined) => (n == null ? null : Math.round(n));

export function runTool(name: string, input: Record<string, unknown>, d: OrgData, me: { userId: string; name: string }): unknown {
  const health = assessAll(d);
  const stages = stageMap(d);
  const pt = (input.period_type as PeriodType) ?? "quarter";
  switch (name) {
    case "get_revenue_summary": {
      const p = shiftPeriod(periodFor(pt, d.now, d.fiscalStartMonth), Number(input.offset ?? 0), d.fiscalStartMonth);
      const s = summarize(d, p, new Set([...health.values()].filter((h) => h.health === "at_risk").map((h) => h.opportunityId)));
      return { period: p.label, from: isoDate(p.start), to: isoDate(p.end), currency: d.currency, ...Object.fromEntries(Object.entries(s).filter(([k]) => k !== "period").map(([k, v]) => [k, typeof v === "number" ? r0(v) : v])), note: "Bookings are actual revenue transactions. ARR and MRR are at the end of the period or today." };
    }
    case "get_forecast": {
      const f = computeForecast(d, periodFor(pt, d.now, d.fiscalStartMonth), health);
      return { period: f.period.label, type: "projection", closedWonActual: r0(f.closedWon), commit: r0(f.commit), bestCaseDeals: r0(f.bestCase), pipelineDeals: r0(f.pipeline), worstCase: r0(f.worstCase), expectedCase: r0(f.expectedCase), bestCase: r0(f.bestCaseTotal), target: r0(f.target), gapToTarget: r0(f.gapToTarget), coverage: f.coverage, runRateAverage: r0(f.runRate), confidence: f.confidence, assumptions: f.assumptions, deals: f.deals.slice(0, 25).map((x) => ({ ...x, weighted: r0(x.weighted) })) };
    }
    case "list_opportunities": {
      let list = d.opportunities;
      const status = (input.status as string) ?? "open";
      if (status !== "any") list = list.filter((o) => o.status === status);
      if (input.owner) list = list.filter((o) => memberName(d, o.owner_id).toLowerCase().includes(String(input.owner).toLowerCase()));
      if (input.stage) list = list.filter((o) => (stages.get(o.stage_id ?? "")?.name ?? "").toLowerCase().includes(String(input.stage).toLowerCase()));
      if (input.health) list = list.filter((o) => health.get(o.id)?.health === input.health);
      if (input.min_amount) list = list.filter((o) => o.amount >= Number(input.min_amount));
      if (input.closing_within_days) list = list.filter((o) => o.close_date && daysBetween(d.now, o.close_date) <= Number(input.closing_within_days) && daysBetween(d.now, o.close_date) >= 0);
      const sort = input.sort ?? "amount";
      list = [...list].sort((a, b) => sort === "close_date" ? (a.close_date ?? "9999").localeCompare(b.close_date ?? "9999") : sort === "health" ? (health.get(a.id)?.score ?? 100) - (health.get(b.id)?.score ?? 100) : sort === "probability" ? dealProbability(d, b) - dealProbability(d, a) : b.amount - a.amount);
      return { total: list.length, opportunities: list.slice(0, Math.min(Number(input.limit ?? 15), 40)).map((o) => ({ id: o.id, name: o.name, account: accountName(d, o.account_id), owner: memberName(d, o.owner_id), stage: stages.get(o.stage_id ?? "")?.name ?? null, amount: o.amount, probability: dealProbability(d, o), closeDate: o.close_date, forecastCategory: o.forecast_category, status: o.status, health: health.get(o.id)?.health ?? null, healthScore: health.get(o.id)?.score ?? null, lastActivity: o.last_activity_at?.slice(0, 10) ?? null })) };
    }
    case "get_deal_details": {
      const q = String(input.deal ?? "").toLowerCase();
      const o = d.opportunities.find((x) => x.id === input.deal) ?? d.opportunities.find((x) => x.name.toLowerCase() === q) ?? d.opportunities.find((x) => x.name.toLowerCase().includes(q));
      if (!o) return { error: `No deal matches "${input.deal}".` };
      const h = assessDeal(d, o);
      return {
        id: o.id, name: o.name, account: accountName(d, o.account_id), owner: memberName(d, o.owner_id), stage: stages.get(o.stage_id ?? "")?.name, amount: o.amount, closeDate: o.close_date, forecastCategory: o.forecast_category, status: o.status, nextStep: o.next_step, competitors: o.competitors,
        stakeholders: d.oppContacts.filter((c) => c.opportunity_id === o.id).map((c) => { const x = d.contacts.find((y) => y.id === c.contact_id); return x ? { name: `${x.first_name} ${x.last_name ?? ""}`.trim(), title: x.title, role: x.buying_role } : null; }).filter(Boolean),
        recentActivities: d.activities.filter((a) => a.opportunity_id === o.id).slice(0, 8).map((a) => ({ type: a.type, subject: a.subject, date: a.occurred_at.slice(0, 10), outcome: a.outcome, objection: a.objection, competitor: a.competitor_mentioned })),
        health: { score: h.score, status: h.health, engagement: h.engagementScore, factors: h.factors },
      };
    }
    case "get_inactive_deals": {
      const days = Number(input.days ?? 14);
      const list = d.opportunities.filter((o) => o.status === "open" && daysBetween(o.last_activity_at ?? o.created_at, d.now) >= days).sort((a, b) => b.amount - a.amount);
      return { days, total: list.length, deals: list.slice(0, 25).map((o) => ({ name: o.name, owner: memberName(d, o.owner_id), amount: o.amount, lastActivity: o.last_activity_at?.slice(0, 10) ?? "never logged", daysSince: daysBetween(o.last_activity_at ?? o.created_at, d.now) })) };
    }
    case "get_rep_performance": {
      const p = periodFor(pt, d.now, d.fiscalStartMonth);
      return { period: p.label, reps: repPerformance(d, p).map((r) => ({ ...r, revenue: r0(r.revenue), attainment: r0(r.attainment), winRate: r0(r.winRate), openPipeline: r0(r.openPipeline), avgDealSize: r0(r.avgDealSize) })) };
    }
    case "get_pipeline_analysis": {
      const age = (o: { created_at: string }) => daysBetween(o.created_at, d.now);
      const last30 = d.opportunities.filter((o) => age(o) <= 30);
      const prev30 = d.opportunities.filter((o) => age(o) > 30 && age(o) <= 60);
      return { byStage: funnel(d), historicalConversion: stageConversion(d), newPipelineLast30Days: { count: last30.length, value: last30.reduce((a, o) => a + o.amount, 0) }, newPipelinePrevious30Days: { count: prev30.length, value: prev30.reduce((a, o) => a + o.amount, 0) }, findings: analyse("pipeline_analysis", d).map((x) => ({ title: x.title, detail: x.body })) };
    }
    case "get_customer_health": {
      let list = assessCustomers(d);
      if (input.filter === "churn_risk") list = list.filter((c) => c.churnRisk !== "low");
      if (input.filter === "expansion") list = list.filter((c) => c.expansionPotential !== "low");
      return { total: list.length, customers: list.slice(0, 25).map((c) => ({ name: c.name, arr: r0(c.arr), score: c.score, health: c.health, churnRisk: c.churnRisk, expansionPotential: c.expansionPotential, nextRenewal: c.nextRenewal, signals: c.signals })) };
    }
    case "get_priorities": {
      const who = String(input.for_user ?? "me");
      const target = who === "me" ? me.name : who;
      const recs = analyse("sales_productivity", d).filter((r) => !target || memberName(d, r.targetUserId).toLowerCase().includes(target.toLowerCase()));
      const risks = analyse("deal_inspection", d).slice(0, 5);
      return { forUser: target, priorities: recs.slice(0, 6).map((r) => ({ title: r.title, detail: r.body })), topDealRisks: risks.map((r) => ({ title: r.title, detail: r.body })) };
    }
  }
  return { error: `Unknown tool ${name}` };
}
