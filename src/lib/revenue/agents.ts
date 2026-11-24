import type { AgentKey } from "@/config/plans";
import type { Evidence, OrgData } from "./types";
import { assessAll, type DealHealth } from "./dealHealth";
import { computeForecast } from "./forecast";
import { assessCustomers } from "./customerHealth";
import { revenueInsights } from "./insights";
import { accountName, funnel, memberName, stageConversion, stageMap, summarize } from "./metrics";
import { daysBetween, isoDate, periodFor } from "./periods";

export type ProposedAction =
  | { type: "create_task"; title: string; description?: string; due_date: string; assignee_id: string | null; opportunity_id?: string | null; account_id?: string | null; priority: "low" | "medium" | "high" }
  | { type: "update_deal"; opportunity_id: string; changes: { forecast_category?: "pipeline" | "best_case" | "commit" | "omitted" }; reason: string }
  | { type: "draft_email"; to: string | null; subject: string; body: string; opportunity_id?: string | null; account_id?: string | null };

export interface Recommendation {
  title: string;
  body: string;
  evidence: Evidence[];
  opportunityId?: string | null;
  accountId?: string | null;
  targetUserId?: string | null;
  action?: ProposedAction | null;
  priority: number;
}

export interface AgentDefinition {
  key: AgentKey;
  name: string;
  purpose: string;
  reads: string[];
  canPropose: string[];
}

export const AGENTS: AgentDefinition[] = [
  { key: "deal_inspection", name: "Deal Inspection Agent", purpose: "Reviews open opportunities and identifies missing information, stalled deals and potential risks.", reads: ["Opportunities", "Activities", "Meetings", "Stakeholders", "Stage history"], canPropose: ["Follow up tasks for deal owners", "Forecast category changes for at risk commit deals"] },
  { key: "forecasting", name: "Forecasting Agent", purpose: "Analyses historical results and current pipeline to generate revenue projections with stated assumptions.", reads: ["Revenue transactions", "Opportunities", "Targets", "Stage conversion history"], canPropose: ["Forecast review tasks for managers"] },
  { key: "sales_productivity", name: "Sales Productivity Agent", purpose: "Recommends the most important tasks for each sales representative today.", reads: ["Tasks", "Opportunities", "Activities", "Renewals"], canPropose: ["Prioritised tasks", "Follow up email drafts"] },
  { key: "pipeline_analysis", name: "Pipeline Analysis Agent", purpose: "Identifies bottlenecks, conversion problems and coverage gaps in the pipeline.", reads: ["Opportunities", "Pipeline stages", "Stage history", "Targets"], canPropose: ["Pipeline review tasks"] },
  { key: "customer_retention", name: "Customer Retention Agent", purpose: "Identifies renewal risks and potential expansion opportunities across customers.", reads: ["Accounts", "Revenue transactions", "Renewals", "Activities"], canPropose: ["Renewal and check in tasks", "Customer check in email drafts"] },
  { key: "revenue_insights", name: "Revenue Insights Agent", purpose: "Answers business questions and publishes revenue insights using organisational revenue data.", reads: ["All revenue records the user can access"], canPropose: ["Insights on the overview dashboard"] },
];

const money = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const inDays = (d: OrgData, n: number) => isoDate(new Date(d.now.getTime() + n * 86400000));
const dealLink = (id: string) => `/dashboard/deals/${id}`;

function dealInspection(d: OrgData, health: Map<string, DealHealth>): Recommendation[] {
  const out: Recommendation[] = [];
  for (const h of health.values()) {
    const o = d.opportunities.find((x) => x.id === h.opportunityId)!;
    const serious = h.factors.filter((f) => f.severity !== "low");
    if (!serious.length) continue;
    const top = serious[0];
    out.push({
      title: `${o.name}: ${top.title.toLowerCase()}`,
      body: `Health ${h.score}/100. ${serious.map((f) => f.title).join(", ")}. ${top.recommendation}`,
      evidence: [{ label: "Opportunity", value: `${o.name} (${money(o.amount)})`, href: dealLink(o.id) }, ...serious.slice(0, 4).map((f) => ({ label: f.kind === "missing_information" ? "Missing information" : "Risk", value: f.evidence }))],
      opportunityId: o.id,
      targetUserId: o.owner_id,
      action: { type: "create_task", title: `${top.recommendation.replace(/\.$/, "")} (${o.name})`, description: serious.map((f) => `${f.title}: ${f.evidence}`).join("\n"), due_date: inDays(d, 2), assignee_id: o.owner_id, opportunity_id: o.id, priority: top.severity === "high" ? "high" : "medium" },
      priority: Math.round(100 - h.score + Math.min(30, o.amount / 10000)),
    });
    if (o.forecast_category === "commit" && h.health === "at_risk") {
      out.push({
        title: `Review commit status of ${o.name}`,
        body: `This deal is in Commit but scores ${h.score}/100. Moving it to Best Case keeps the commit number realistic until the risks are resolved.`,
        evidence: [{ label: "Forecast category", value: "Commit" }, { label: "Deal health", value: `${h.score}/100 (at risk)` }, ...h.factors.slice(0, 2).map((f) => ({ label: f.title, value: f.evidence }))],
        opportunityId: o.id,
        targetUserId: o.owner_id,
        action: { type: "update_deal", opportunity_id: o.id, changes: { forecast_category: "best_case" }, reason: `Deal health ${h.score}/100 with ${h.factors.length} risk factors` },
        priority: 90,
      });
    }
  }
  return out;
}

function forecasting(d: OrgData, health: Map<string, DealHealth>): Recommendation[] {
  const out: Recommendation[] = [];
  for (const type of ["month", "quarter"] as const) {
    const p = periodFor(type, d.now, d.fiscalStartMonth);
    const f = computeForecast(d, p, health);
    const ev: Evidence[] = [
      { label: "Closed won (actual)", value: money(f.closedWon) },
      { label: "Commit", value: money(f.commit) },
      { label: "Best case deals", value: money(f.bestCase) },
      { label: "Expected case (projection)", value: money(f.expectedCase) },
      { label: "Range (projection)", value: `${money(f.worstCase)} to ${money(f.bestCaseTotal)}` },
      { label: "Confidence", value: `${f.confidence} (${f.closedDealsInSample} closed deals in sample)` },
    ];
    if (f.target != null) ev.push({ label: "Target", value: money(f.target) });
    const short = f.target != null && f.expectedCase < f.target;
    const upside = f.deals.filter((x) => x.category === "best_case").slice(0, 3);
    out.push({
      title: `${p.label}: projected ${money(f.expectedCase)}${f.target != null ? ` against ${money(f.target)} target` : ""}`,
      body: `${short ? `Projected shortfall of ${money(f.target! - f.expectedCase)}.` : f.target != null ? "Expected case meets the target." : "No target is set for this period."} ${upside.length ? `Largest best case deals that could close the gap: ${upside.map((x) => `${x.name} (${money(x.amount)})`).join(", ")}.` : ""} This is a projection based on the stated assumptions, not a guaranteed result.`,
      evidence: ev,
      action: short ? { type: "create_task", title: `Review ${p.label} forecast gap of ${money(f.target! - f.expectedCase)}`, description: f.assumptions.join("\n"), due_date: inDays(d, 3), assignee_id: null, priority: "high" } : null,
      priority: short ? 85 : 40,
    });
  }
  return out;
}

function salesProductivity(d: OrgData, health: Map<string, DealHealth>): Recommendation[] {
  const out: Recommendation[] = [];
  const today = isoDate(d.now);
  for (const m of d.members.filter((x) => ["sales_rep", "sales_manager", "owner", "admin"].includes(x.role))) {
    const items: { text: string; score: number; ev: Evidence; action?: ProposedAction }[] = [];
    for (const t of d.tasks.filter((t) => t.assignee_id === m.user_id && t.status === "open" && t.due_date && t.due_date <= today)) {
      items.push({ text: `Overdue task: ${t.title}`, score: 70 + (t.priority === "high" ? 15 : 0), ev: { label: "Task due", value: `${t.title} (${t.due_date})` } });
    }
    for (const o of d.opportunities.filter((o) => o.owner_id === m.user_id && o.status === "open")) {
      const h = health.get(o.id);
      if (!h) continue;
      const inactive = h.factors.find((f) => f.code === "inactive" || f.code === "no_activity");
      if (inactive) {
        const champion = d.oppContacts.filter((c) => c.opportunity_id === o.id).map((c) => d.contacts.find((x) => x.id === c.contact_id)).find((c) => c?.email);
        items.push({
          text: `Re engage ${o.name} (${money(o.amount)})`,
          score: 50 + Math.min(40, o.amount / 5000),
          ev: { label: o.name, value: inactive.evidence, href: dealLink(o.id) },
          action: { type: "draft_email", to: champion?.email ?? null, subject: `Next steps on ${o.name}`, body: `Hi ${champion?.first_name ?? "there"},\n\nI wanted to follow up on our last conversation about ${o.name}. Could we find 20 minutes this week to confirm next steps${o.close_date ? ` ahead of the ${o.close_date} timeline` : ""}?\n\nBest regards,\n${m.full_name}`, opportunity_id: o.id },
        });
      }
      if (o.close_date && o.close_date >= today && daysBetween(d.now, o.close_date) <= 14) {
        items.push({ text: `Closing soon: ${o.name} on ${o.close_date}`, score: 60 + Math.min(30, o.amount / 5000), ev: { label: o.name, value: `${money(o.amount)}, closes ${o.close_date}`, href: dealLink(o.id) } });
      }
    }
    for (const r of d.renewals.filter((r) => r.owner_id === m.user_id && r.status === "upcoming" && daysBetween(d.now, r.renewal_date) <= 30 && daysBetween(d.now, r.renewal_date) >= 0)) {
      items.push({ text: `Renewal in ${daysBetween(d.now, r.renewal_date)} days: ${accountName(d, r.account_id)}`, score: 65, ev: { label: "Renewal", value: `${accountName(d, r.account_id)} on ${r.renewal_date}, ${money(r.current_arr)} ARR` } });
    }
    items.sort((a, b) => b.score - a.score);
    if (!items.length) continue;
    out.push({
      title: `Today's priorities for ${m.full_name}`,
      body: items.slice(0, 5).map((x, i) => `${i + 1}. ${x.text}`).join("\n"),
      evidence: items.slice(0, 5).map((x) => x.ev),
      targetUserId: m.user_id,
      priority: Math.round(items[0].score),
    });
    for (const x of items.filter((x) => x.action).slice(0, 2)) {
      out.push({ title: x.text, body: "A follow up email draft is ready for review. Nothing is sent automatically.", evidence: [x.ev], targetUserId: m.user_id, opportunityId: x.action && "opportunity_id" in x.action ? x.action.opportunity_id ?? null : null, action: x.action, priority: Math.round(x.score) });
    }
  }
  return out;
}

function pipelineAnalysis(d: OrgData): Recommendation[] {
  const out: Recommendation[] = [];
  const stages = stageMap(d);
  const open = d.opportunities.filter((o) => o.status === "open");
  if (!open.length) return out;
  for (const s of d.stages.filter((s) => s.kind === "open")) {
    const deals = open.filter((o) => o.stage_id === s.id);
    if (deals.length < 2) continue;
    const avgAge = deals.reduce((a, o) => a + daysBetween(o.stage_entered_at, d.now), 0) / deals.length;
    if (avgAge > s.expected_days * 1.5) {
      out.push({
        title: `Bottleneck in ${s.name}`,
        body: `${deals.length} deals worth ${money(deals.reduce((a, o) => a + o.amount, 0))} have spent an average of ${Math.round(avgAge)} days in ${s.name}, against an expected ${s.expected_days}. Review exit criteria and coach on advancing or disqualifying these deals.`,
        evidence: deals.sort((a, b) => b.amount - a.amount).slice(0, 4).map((o) => ({ label: o.name, value: `${daysBetween(o.stage_entered_at, d.now)} days in stage`, href: dealLink(o.id) })),
        action: { type: "create_task", title: `Run a ${s.name} pipeline review`, due_date: inDays(d, 5), assignee_id: null, priority: "medium", description: `${deals.length} deals average ${Math.round(avgAge)} days in ${s.name}.` },
        priority: 60 + Math.min(30, deals.length * 3),
      });
    }
  }
  const conv = stageConversion(d).filter((c) => c.reached >= 5 && c.rate != null);
  if (conv.length >= 2) {
    const worst = conv.reduce((a, b) => ((a.rate ?? 100) < (b.rate ?? 100) ? a : b));
    out.push({
      title: `Lowest historical conversion from ${worst.stage}`,
      body: `Of ${worst.reached} closed deals that reached ${worst.stage}, ${worst.won} were won (${Math.round(worst.rate!)}%). This is the weakest point in the funnel based on closed deals.`,
      evidence: conv.map((c) => ({ label: c.stage, value: `${Math.round(c.rate!)}% of ${c.reached}` })),
      priority: 55,
    });
  }
  const q = periodFor("quarter", d.now, d.fiscalStartMonth);
  const s = summarize(d, q);
  if (s.target != null) {
    const remaining = Math.max(0, s.target - s.totalRevenue);
    const coverage = remaining ? s.pipelineInPeriod / remaining : null;
    if (coverage != null && coverage < 3) {
      out.push({
        title: `Pipeline coverage is ${coverage.toFixed(1)}x for ${q.label}`,
        body: `Open pipeline closing this quarter is ${money(s.pipelineInPeriod)} against ${money(remaining)} of remaining target. Many teams aim for about 3x coverage; the right ratio for you depends on your own win rate.`,
        evidence: [{ label: "Remaining target", value: money(remaining) }, { label: "Pipeline closing this quarter", value: money(s.pipelineInPeriod) }, { label: "Win rate this quarter", value: s.winRate != null ? `${Math.round(s.winRate)}%` : "No closed deals yet" }],
        action: { type: "create_task", title: `Generate pipeline to close the ${q.label} coverage gap`, due_date: inDays(d, 7), assignee_id: null, priority: "high" },
        priority: 80,
      });
    }
  }
  const total = open.reduce((a, o) => a + o.amount, 0);
  const biggest = [...open].sort((a, b) => b.amount - a.amount)[0];
  if (total > 0 && open.length >= 4 && biggest.amount / total > 0.35) {
    out.push({ title: "Pipeline concentrated in one deal", body: `${biggest.name} is ${Math.round((biggest.amount / total) * 100)}% of open pipeline. The forecast is sensitive to this single outcome.`, evidence: [{ label: biggest.name, value: money(biggest.amount), href: dealLink(biggest.id) }, { label: "Total open pipeline", value: money(total) }], opportunityId: biggest.id, priority: 50 });
  }
  const f = funnel(d);
  const empty = f.filter((x) => x.count === 0 && stages.size > 0).map((x) => x.stage);
  if (empty.length && empty.length < f.length) {
    out.push({ title: `No deals in ${empty.join(", ")}`, body: "Empty stages can signal a gap in prospecting or deals skipping qualification steps.", evidence: f.map((x) => ({ label: x.stage, value: `${x.count} deals, ${money(x.value)}` })), priority: 35 });
  }
  return out;
}

function customerRetention(d: OrgData): Recommendation[] {
  const out: Recommendation[] = [];
  for (const c of assessCustomers(d)) {
    const acct = d.accounts.find((a) => a.id === c.accountId);
    const owner = acct?.owner_id ?? d.renewals.find((r) => r.account_id === c.accountId)?.owner_id ?? null;
    const contact = d.contacts.find((x) => x.account_id === c.accountId && x.email);
    if (c.churnRisk !== "low") {
      out.push({
        title: `${c.churnRisk === "high" ? "Churn risk" : "Watch"}: ${c.name}`,
        body: `Customer health ${c.score}/100. ${c.signals.filter((s) => s.kind !== "opportunity").map((s) => s.text).join(" ")}`,
        evidence: [...c.evidence, ...c.signals.map((s) => ({ label: s.kind === "risk" ? "Risk signal" : s.kind === "missing_information" ? "Missing information" : "Positive signal", value: s.text }))],
        accountId: c.accountId,
        targetUserId: owner,
        action: { type: "create_task", title: `Customer check in with ${c.name}`, due_date: inDays(d, c.churnRisk === "high" ? 2 : 7), assignee_id: owner, account_id: c.accountId, priority: c.churnRisk === "high" ? "high" : "medium", description: c.signals.map((s) => s.text).join("\n") },
        priority: c.churnRisk === "high" ? 85 : 55,
      });
    }
    if (c.expansionPotential !== "low") {
      out.push({
        title: `Expansion opportunity: ${c.name}`,
        body: `${c.signals.filter((s) => s.kind === "opportunity").map((s) => s.text).join(" ") || "An open expansion deal exists."} Consider an expansion conversation.`,
        evidence: c.evidence,
        accountId: c.accountId,
        targetUserId: owner,
        action: contact ? { type: "draft_email", to: contact.email, subject: `Getting more value from Revenue AI at ${c.name}`, body: `Hi ${contact.first_name},\n\nThanks for the continued partnership. I would like to share a few ideas on how your team could get more value from what you already use, and hear about your plans for the coming quarter. Would you have 30 minutes next week?\n\nBest regards`, account_id: c.accountId } : null,
        priority: c.expansionPotential === "high" ? 65 : 45,
      });
    }
  }
  return out;
}

function revenueInsightsAgent(d: OrgData, health: Map<string, DealHealth>): Recommendation[] {
  const q = periodFor("quarter", d.now, d.fiscalStartMonth);
  return revenueInsights(d, health, computeForecast(d, q, health)).map((i) => ({
    title: i.title,
    body: `${i.body}${i.isProjection ? " This is a projection, not a confirmed result." : ""}`,
    evidence: i.evidence,
    priority: i.severity === "critical" ? 90 : i.severity === "warning" ? 70 : 50,
  }));
}

/** Runs one agent's analysis. Pure: reads the data passed in and returns recommendations with evidence. */
export function analyse(agent: AgentKey, d: OrgData): Recommendation[] {
  const health = assessAll(d);
  const recs =
    agent === "deal_inspection" ? dealInspection(d, health)
    : agent === "forecasting" ? forecasting(d, health)
    : agent === "sales_productivity" ? salesProductivity(d, health)
    : agent === "pipeline_analysis" ? pipelineAnalysis(d)
    : agent === "customer_retention" ? customerRetention(d)
    : revenueInsightsAgent(d, health);
  return recs.sort((a, b) => b.priority - a.priority).slice(0, 40);
}

export { memberName };
