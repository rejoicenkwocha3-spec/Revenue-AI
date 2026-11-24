import type { Evidence, OrgData, Opportunity } from "./types";
import { accountName, stageMap } from "./metrics";
import { daysBetween, isoDate } from "./periods";

export type Severity = "low" | "medium" | "high";
export interface RiskFactor {
  code: string;
  severity: Severity;
  kind: "risk" | "missing_information";
  title: string;
  evidence: string;
  recommendation: string;
}
export interface DealHealth {
  opportunityId: string;
  score: number;
  health: "healthy" | "watch" | "at_risk";
  engagementScore: number;
  factors: RiskFactor[];
  facts: Evidence[];
  components: Record<string, number | string | null>;
}

const WEIGHT: Record<Severity, number> = { high: 22, medium: 11, low: 5 };

/**
 * Rule based deal health. Every factor cites the record it came from.
 * Missing data is reported as missing information, never as a fact about the buyer.
 */
export function assessDeal(d: OrgData, o: Opportunity): DealHealth {
  const stages = stageMap(d);
  const stage = o.stage_id ? stages.get(o.stage_id) : undefined;
  const today = isoDate(d.now);
  const factors: RiskFactor[] = [];
  const acts = d.activities.filter((a) => a.opportunity_id === o.id);
  const meetings = d.meetings.filter((m) => m.opportunity_id === o.id);
  const recent = acts.filter((a) => daysBetween(a.occurred_at, d.now) <= 30);
  const stakeholders = d.oppContacts.filter((c) => c.opportunity_id === o.id).map((c) => d.contacts.find((x) => x.id === c.contact_id)).filter(Boolean);
  const lastTouch = o.last_activity_at ?? null;
  const sinceTouch = daysBetween(lastTouch ?? o.created_at, d.now);
  const daysInStage = daysBetween(o.stage_entered_at, d.now);
  const late = (stage?.position ?? 0) >= 3;

  if (o.status === "open") {
    if (!lastTouch && sinceTouch > 7) {
      factors.push({ code: "no_activity", severity: sinceTouch > 21 ? "high" : "medium", kind: "risk", title: "No logged activity", evidence: `No calls, emails or meetings logged since the deal was created ${sinceTouch} days ago.`, recommendation: "Log the latest buyer interaction or schedule a call to confirm the deal is still active." });
    } else if (lastTouch && sinceTouch > 14) {
      factors.push({ code: "inactive", severity: sinceTouch > 30 ? "high" : "medium", kind: "risk", title: "Deal has gone quiet", evidence: `Last logged activity was ${sinceTouch} days ago (${lastTouch.slice(0, 10)}).`, recommendation: "Re engage the champion with a specific next step and a date." });
    }
    if (stage && daysInStage > stage.expected_days) {
      factors.push({ code: "stalled", severity: daysInStage > stage.expected_days * 2 ? "high" : "medium", kind: "risk", title: `Stalled in ${stage.name}`, evidence: `${daysInStage} days in ${stage.name}; the expected time for this stage is ${stage.expected_days} days.`, recommendation: `Agree the exit criteria for ${stage.name} with the buyer or move the deal back.` });
    }
    if (!o.close_date) {
      factors.push({ code: "no_close_date", severity: "medium", kind: "missing_information", title: "Expected close date missing", evidence: "The opportunity has no expected close date, so it cannot be placed in a forecast period.", recommendation: "Set a close date agreed with the buyer." });
    } else if (o.close_date < today) {
      factors.push({ code: "close_date_passed", severity: "high", kind: "risk", title: "Close date has passed", evidence: `Expected close date ${o.close_date} is ${daysBetween(o.close_date, d.now)} days in the past and the deal is still open.`, recommendation: "Confirm a realistic close date with the buyer and update the forecast category." });
    }
    const pushes = d.history.filter((h) => h.opportunity_id === o.id && h.field === "close_date" && h.old_value && h.new_value && h.new_value > h.old_value).length;
    if (pushes >= 2) {
      factors.push({ code: "close_date_pushed", severity: pushes >= 3 ? "high" : "medium", kind: "risk", title: "Close date pushed repeatedly", evidence: `The close date has moved later ${pushes} times.`, recommendation: "Validate the buying timeline and decision process before committing this deal." });
    }
    if (!o.amount) {
      factors.push({ code: "no_amount", severity: "medium", kind: "missing_information", title: "Deal value missing", evidence: "Amount is 0, so the deal adds nothing to pipeline or forecast.", recommendation: "Record the expected contract value." });
    }
    if (!o.next_step) {
      factors.push({ code: "no_next_step", severity: late ? "medium" : "low", kind: "missing_information", title: "No next step recorded", evidence: "The next step field is empty.", recommendation: "Record the next agreed action and its date." });
    } else if (o.next_step_date && o.next_step_date < today) {
      factors.push({ code: "next_step_overdue", severity: "medium", kind: "risk", title: "Next step is overdue", evidence: `Next step "${o.next_step}" was due ${o.next_step_date}.`, recommendation: "Complete or reschedule the next step." });
    }
    if (stakeholders.length === 0) {
      factors.push({ code: "no_stakeholders", severity: late ? "high" : "low", kind: "missing_information", title: "No buyer stakeholders linked", evidence: "No contacts are linked to this opportunity.", recommendation: "Add the buyer contacts involved in the decision." });
    } else {
      const roles = new Set(stakeholders.map((c) => c!.buying_role));
      if (late && !roles.has("decision_maker") && !roles.has("economic_buyer")) {
        factors.push({ code: "no_decision_maker", severity: "medium", kind: "missing_information", title: "Decision maker not identified", evidence: `${stakeholders.length} stakeholder${stakeholders.length > 1 ? "s" : ""} linked, none marked as decision maker or economic buyer.`, recommendation: "Identify and meet the economic buyer." });
      }
      if (late && stakeholders.length === 1) {
        factors.push({ code: "single_threaded", severity: "medium", kind: "risk", title: "Single threaded", evidence: "Only one buyer contact is linked at a late stage.", recommendation: "Multi thread the deal by engaging at least two more stakeholders." });
      }
    }
    if (late && (stage?.position ?? 0) >= 4 && !acts.some((a) => a.budget_discussed)) {
      factors.push({ code: "budget_unconfirmed", severity: "medium", kind: "missing_information", title: "Budget not discussed", evidence: "No logged activity records a budget discussion.", recommendation: "Confirm budget and approval process before proposal review." });
    }
    const negatives = [...recent.filter((a) => a.outcome === "negative").map((a) => `${a.type} "${a.subject}" on ${a.occurred_at.slice(0, 10)}`), ...meetings.filter((m) => m.outcome === "negative" && daysBetween(m.starts_at, d.now) <= 30).map((m) => `meeting "${m.title}" on ${m.starts_at.slice(0, 10)}`)];
    if (negatives.length) {
      factors.push({ code: "negative_outcome", severity: negatives.length > 1 ? "high" : "medium", kind: "risk", title: "Recent negative interaction", evidence: `Logged as negative: ${negatives.slice(0, 3).join("; ")}.`, recommendation: "Review the conversation with the manager and plan how to address the concern." });
    }
    const competitors = [...new Set([...o.competitors, ...acts.map((a) => a.competitor_mentioned).filter((x): x is string => !!x)])];
    if (competitors.length) {
      factors.push({ code: "competitor", severity: "low", kind: "risk", title: "Competitor involved", evidence: `Competitors recorded: ${competitors.join(", ")}.`, recommendation: "Prepare differentiation points and confirm the buyer's evaluation criteria." });
    }
    const objections = recent.filter((a) => a.objection);
    if (objections.length) {
      factors.push({ code: "objection", severity: "medium", kind: "risk", title: "Open objection", evidence: `Objection logged on ${objections[0].occurred_at.slice(0, 10)}: "${objections[0].objection}".`, recommendation: "Respond to the objection directly and confirm it is resolved." });
    }
  }

  const contactsTouched = new Set(recent.map((a) => a.contact_id).filter(Boolean)).size;
  const engagementScore = Math.min(100, recent.length * 12 + meetings.filter((m) => daysBetween(m.starts_at, d.now) <= 30 && m.status !== "cancelled").length * 15 + contactsTouched * 10);
  const penalty = factors.reduce((a, f) => a + WEIGHT[f.severity] * (f.kind === "missing_information" ? 0.6 : 1), 0);
  let score = Math.round(Math.max(0, Math.min(100, 100 - penalty + (engagementScore >= 50 ? 5 : 0))));
  if (o.status === "won") score = 100;
  if (o.status === "lost") score = 0;
  const health: DealHealth["health"] = score >= 70 ? "healthy" : score >= 45 ? "watch" : "at_risk";
  factors.sort((a, b) => WEIGHT[b.severity] - WEIGHT[a.severity]);
  return {
    opportunityId: o.id,
    score,
    health,
    engagementScore,
    factors,
    facts: [
      { label: "Account", value: accountName(d, o.account_id) },
      { label: "Stage", value: stage?.name ?? "Not set" },
      { label: "Days in stage", value: String(daysInStage) },
      { label: "Activities in last 30 days", value: String(recent.length) },
      { label: "Stakeholders linked", value: String(stakeholders.length) },
    ],
    components: { daysSinceActivity: sinceTouch, daysInStage, recentActivities: recent.length, stakeholders: stakeholders.length, engagementScore },
  };
}

export function assessAll(d: OrgData): Map<string, DealHealth> {
  const out = new Map<string, DealHealth>();
  for (const o of d.opportunities) if (o.status === "open") out.set(o.id, assessDeal(d, o));
  return out;
}
