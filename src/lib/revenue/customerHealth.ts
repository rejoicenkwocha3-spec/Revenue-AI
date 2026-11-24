import type { Evidence, OrgData } from "./types";
import { arrAt } from "./metrics";
import { daysBetween } from "./periods";

export interface CustomerHealth {
  accountId: string;
  name: string;
  arr: number;
  score: number;
  health: "healthy" | "watch" | "at_risk";
  churnRisk: "low" | "medium" | "high";
  expansionPotential: "low" | "medium" | "high";
  nextRenewal: string | null;
  signals: { kind: "risk" | "opportunity" | "missing_information"; text: string }[];
  evidence: Evidence[];
}

/** Customer health for accounts with booked revenue or a renewal, from recorded revenue, engagement and renewals. */
export function assessCustomers(d: OrgData): CustomerHealth[] {
  const customers = d.accounts.filter((a) => a.lifecycle_stage === "customer" || d.transactions.some((t) => t.account_id === a.id) || d.renewals.some((r) => r.account_id === a.id));
  return customers.map((a): CustomerHealth => {
    const tx = d.transactions.filter((t) => t.account_id === a.id && t.recurring);
    const arr = Math.max(0, tx.reduce((s, t) => s + (t.type === "new" || t.type === "expansion" ? t.amount : t.type === "churn" || t.type === "contraction" ? -t.amount : 0), 0));
    const acts = d.activities.filter((x) => x.account_id === a.id || d.opportunities.some((o) => o.id === x.opportunity_id && o.account_id === a.id));
    const last = acts[0]?.occurred_at ?? null;
    const sinceTouch = last ? daysBetween(last, d.now) : null;
    const recent90 = acts.filter((x) => daysBetween(x.occurred_at, d.now) <= 90);
    const negatives = recent90.filter((x) => x.outcome === "negative").length;
    const contraction = tx.some((t) => (t.type === "contraction" || t.type === "churn") && daysBetween(t.occurred_on, d.now) <= 180);
    const expansions = tx.filter((t) => t.type === "expansion").length;
    const renewal = d.renewals.filter((r) => r.account_id === a.id && (r.status === "upcoming" || r.status === "in_progress")).sort((x, y) => x.renewal_date.localeCompare(y.renewal_date))[0];
    const daysToRenewal = renewal ? daysBetween(d.now, renewal.renewal_date) : null;
    const openExpansion = d.opportunities.some((o) => o.account_id === a.id && o.status === "open" && o.deal_type === "expansion");
    const signals: CustomerHealth["signals"] = [];
    let score = 80;
    if (sinceTouch == null) { signals.push({ kind: "missing_information", text: "No customer interactions logged." }); score -= 15; }
    else if (sinceTouch > 60) { signals.push({ kind: "risk", text: `No logged interaction for ${sinceTouch} days.` }); score -= 20; }
    else if (sinceTouch > 30) { signals.push({ kind: "risk", text: `Last interaction ${sinceTouch} days ago.` }); score -= 8; }
    if (negatives) { signals.push({ kind: "risk", text: `${negatives} negative interaction${negatives > 1 ? "s" : ""} in the last 90 days.` }); score -= 12 * Math.min(negatives, 2); }
    if (contraction) { signals.push({ kind: "risk", text: "Contraction or churn recorded in the last 180 days." }); score -= 20; }
    if (daysToRenewal != null && daysToRenewal <= 90) {
      signals.push({ kind: daysToRenewal < 0 ? "risk" : "risk", text: daysToRenewal < 0 ? `Renewal date ${renewal!.renewal_date} has passed without being marked renewed.` : `Renewal due in ${daysToRenewal} days (${renewal!.renewal_date}).` });
      score -= daysToRenewal < 0 ? 20 : sinceTouch != null && sinceTouch > 30 ? 12 : 4;
    }
    if (recent90.length >= 4 && negatives === 0) { signals.push({ kind: "opportunity", text: `${recent90.length} interactions in the last 90 days with no negative outcomes.` }); score += 10; }
    if (expansions) signals.push({ kind: "opportunity", text: `${expansions} previous expansion${expansions > 1 ? "s" : ""} recorded.` });
    score = Math.max(0, Math.min(100, score));
    const health: CustomerHealth["health"] = score >= 70 ? "healthy" : score >= 45 ? "watch" : "at_risk";
    const churnRisk: CustomerHealth["churnRisk"] = health === "at_risk" ? "high" : health === "watch" ? "medium" : "low";
    const expansionPotential: CustomerHealth["expansionPotential"] = openExpansion ? "high" : health === "healthy" && (expansions > 0 || recent90.length >= 4) ? "medium" : "low";
    return {
      accountId: a.id, name: a.name, arr, score, health, churnRisk, expansionPotential, nextRenewal: renewal?.renewal_date ?? null, signals,
      evidence: [
        { label: "ARR", value: String(Math.round(arr)) },
        { label: "Last interaction", value: last ? last.slice(0, 10) : "None logged" },
        { label: "Interactions in last 90 days", value: String(recent90.length) },
        { label: "Next renewal", value: renewal?.renewal_date ?? "None recorded" },
      ],
    };
  }).sort((x, y) => x.score - y.score);
}

export function totalArr(d: OrgData) {
  return arrAt(d, d.now);
}
