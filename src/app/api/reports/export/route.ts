import { handle, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { loadOrgData } from "@/lib/revenue/load";
import { assessAll } from "@/lib/revenue/dealHealth";
import { accountName, dealProbability, memberName, repPerformance, stageMap } from "@/lib/revenue/metrics";
import { computeForecast } from "@/lib/revenue/forecast";
import { assessCustomers } from "@/lib/revenue/customerHealth";
import { parsePeriod } from "@/lib/revenue/periods";
import { can } from "@/lib/permissions";

function csv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map((v) => {
    const s = v == null ? "" : String(v);
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // prevent spreadsheet formula injection
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  }).join(",")).join("\n");
}

/** CSV exports of report data, generated from the caller's records. */
export const GET = handle(async (req: Request) => {
  const ctx = await requireUser();
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "opportunities";
  const supabase = await createClient();
  const d = await loadOrgData(supabase, ctx.orgId);
  const period = parsePeriod(url.searchParams.get("period"), url.searchParams.get("start"), d.fiscalStartMonth, d.now);
  const health = assessAll(d);
  const stages = stageMap(d);
  let rows: (string | number | null)[][];
  if (type === "opportunities") {
    rows = [["Name", "Account", "Owner", "Stage", "Status", "Amount", "Probability", "Close date", "Forecast category", "Health", "Health score", "Last activity"],
      ...d.opportunities.map((o) => [o.name, accountName(d, o.account_id), memberName(d, o.owner_id), stages.get(o.stage_id ?? "")?.name ?? "", o.status, o.amount, dealProbability(d, o), o.close_date, o.forecast_category, health.get(o.id)?.health ?? "", health.get(o.id)?.score ?? "", o.last_activity_at?.slice(0, 10) ?? ""])];
  } else if (type === "revenue") {
    rows = [["Date", "Type", "Amount", "Account", "Owner", "Product", "Region", "Recurring"], ...d.transactions.map((t) => [t.occurred_on, t.type, t.amount, accountName(d, t.account_id), memberName(d, t.owner_id), t.product, t.region, t.recurring ? "yes" : "no"])];
  } else if (type === "forecast") {
    const f = computeForecast(d, period, health);
    rows = [["Period", period.label], ["Closed won (actual)", f.closedWon], ["Commit", f.commit], ["Best case deals", f.bestCase], ["Pipeline deals", f.pipeline], ["Worst case (projection)", f.worstCase], ["Expected case (projection)", f.expectedCase], ["Best case (projection)", f.bestCaseTotal], ["Target", f.target], ["Confidence", f.confidence], [],
      ["Deal", "Account", "Owner", "Stage", "Category", "Amount", "Probability", "Probability source", "Weighted", "Close date"], ...f.deals.map((x) => [x.name, x.account, x.owner, x.stage, x.category, x.amount, x.probability, x.probabilitySource, Math.round(x.weighted), x.closeDate]), [], ["Assumptions"], ...f.assumptions.map((a) => [a])];
  } else if (type === "performance") {
    rows = [["Representative", "Revenue", "Target", "Attainment %", "Won", "Lost", "Win rate %", "Open pipeline", "Opportunities created", "Meetings", "Activities"], ...repPerformance(d, period).map((r) => [r.name, Math.round(r.revenue), r.target, r.attainment != null ? Math.round(r.attainment) : null, r.dealsWon, r.dealsLost, r.winRate != null ? Math.round(r.winRate) : null, Math.round(r.openPipeline), r.opportunitiesCreated, r.meetingsBooked, r.activities])];
  } else if (type === "customers") {
    rows = [["Account", "ARR", "Health score", "Health", "Churn risk", "Expansion potential", "Next renewal"], ...assessCustomers(d).map((c) => [c.name, Math.round(c.arr), c.score, c.health, c.churnRisk, c.expansionPotential, c.nextRenewal])];
  } else if (type === "audit") {
    if (!can(ctx.role, "audit.view")) throw new ApiError(403, "Your role does not allow viewing the audit log.");
    const { data } = await supabase.from("audit_logs").select("created_at, actor_type, agent_key, action, entity_type, entity_id, details, user_id").eq("org_id", ctx.orgId).order("created_at", { ascending: false }).limit(5000);
    rows = [["Time", "Actor type", "User", "Agent", "Action", "Entity", "Entity id", "Details"], ...(data ?? []).map((a) => [a.created_at, a.actor_type, memberName(d, a.user_id), a.agent_key, a.action, a.entity_type, a.entity_id, JSON.stringify(a.details)])];
  } else throw new ApiError(400, "Unknown report type.");
  return new Response(csv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="revenue-ai-${type}-${new Date().toISOString().slice(0, 10)}.csv"` } });
});
