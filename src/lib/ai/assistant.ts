import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { OrgData, Evidence } from "@/lib/revenue/types";
import { AI_MODEL, FALLBACK_OPTIONS, GROUNDING_RULES, aiConfigured, claude, textOf } from "./claude";
import { TOOL_DEFS, runTool } from "./tools";

export interface AssistantAnswer { text: string; evidence: Evidence[]; mode: "ai" | "rules" }

const SYSTEM = `You are the Revenue AI assistant for a B2B revenue team. You answer questions about the organisation's pipeline, forecasts, deals, customers and team performance.
Always call the tools to fetch data before answering a question about the business. Prefer one or two well chosen tool calls.
Keep answers short and skimmable: lead with the direct answer, then the supporting numbers, then at most three recommended actions.
Amounts are in the organisation's currency (shown in tool results).
${GROUNDING_RULES}`;

/** Answers a question with Claude, grounded through data tools that read the caller's records. */
export async function answerQuestion(question: string, history: { role: "user" | "assistant"; content: string }[], data: OrgData, me: { userId: string; name: string }): Promise<AssistantAnswer> {
  if (!aiConfigured()) return answerWithRules(question, data, me);
  const messages: Anthropic.Beta.BetaMessageParam[] = [...history.slice(-8).map((m) => ({ role: m.role, content: m.content })), { role: "user", content: question }];
  const used: Evidence[] = [];
  for (let turn = 0; turn < 6; turn++) {
    const res = await claude().beta.messages.create({
      model: AI_MODEL,
      max_tokens: 8000,
      ...FALLBACK_OPTIONS,
      output_config: { effort: "medium" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: TOOL_DEFS,
      messages,
    });
    if (res.stop_reason === "refusal") return { text: "I can't help with that request. Ask about your pipeline, forecast, deals, customers or team performance.", evidence: [], mode: "ai" };
    const toolUses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || toolUses.length === 0) {
      return { text: textOf(res.content) || "I could not produce an answer from the available data.", evidence: used, mode: "ai" };
    }
    messages.push({ role: "assistant", content: res.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = toolUses.map((t) => {
      try {
        const out = runTool(t.name, (t.input ?? {}) as Record<string, unknown>, data, me);
        used.push({ label: "Data source", value: TOOL_LABELS[t.name] ?? t.name });
        return { type: "tool_result", tool_use_id: t.id, content: JSON.stringify(out) };
      } catch (err) {
        return { type: "tool_result", tool_use_id: t.id, content: `Tool failed: ${(err as Error).message}`, is_error: true };
      }
    });
    messages.push({ role: "user", content: results });
  }
  return { text: "The question needed more steps than allowed. Try asking something more specific.", evidence: used, mode: "ai" };
}

const TOOL_LABELS: Record<string, string> = {
  get_revenue_summary: "Revenue summary from revenue transactions and opportunities",
  get_forecast: "Forecast computed from closed revenue and open deals",
  list_opportunities: "Opportunity records with health scores",
  get_deal_details: "Deal record, stakeholders and activity history",
  get_inactive_deals: "Activity history on open deals",
  get_rep_performance: "Performance by representative",
  get_pipeline_analysis: "Pipeline by stage and stage history",
  get_customer_health: "Customer accounts, revenue and renewals",
  get_priorities: "Tasks, deals and renewals by owner",
};

const money = (n: number | null | undefined) => (n == null ? "not set" : new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n));

/**
 * Without an AI key, common questions are answered directly from the same tools,
 * so the assistant still returns real figures rather than generated text.
 */
export function answerWithRules(question: string, d: OrgData, me: { userId: string; name: string }): AssistantAnswer {
  const q = question.toLowerCase();
  const ev = (name: string): Evidence[] => [{ label: "Data source", value: TOOL_LABELS[name] }];
  const note = "\n\nAnswered directly from your records. Add an ANTHROPIC_API_KEY to enable conversational answers.";
  if (/(forecast|likely to generate|on track|hit our|target|this quarter)/.test(q)) {
    const f = runTool("get_forecast", { period_type: /month/.test(q) ? "month" : /year/.test(q) ? "year" : "quarter" }, d, me) as Record<string, unknown>;
    return { mode: "rules", evidence: ev("get_forecast"), text: `Projection for ${f.period}: expected ${money(f.expectedCase as number)} (range ${money(f.worstCase as number)} to ${money(f.bestCase as number)}), with ${money(f.closedWonActual as number)} already closed.\nTarget: ${money(f.target as number)}.${f.gapToTarget != null ? ` Projected ${Number(f.gapToTarget) > 0 ? `shortfall of ${money(f.gapToTarget as number)}` : "to meet the target"}.` : ""}\nConfidence: ${f.confidence}. This is a projection, not a guaranteed result.\n\nAssumptions:\n${(f.assumptions as string[]).map((a) => `* ${a}`).join("\n")}${note}` };
  }
  if (/(risk|at risk|slipping)/.test(q)) {
    const r = runTool("list_opportunities", { health: "at_risk", sort: "amount", limit: 10 }, d, me) as { total: number; opportunities: { name: string; amount: number; owner: string; healthScore: number }[] };
    return { mode: "rules", evidence: ev("list_opportunities"), text: r.total ? `${r.total} open deal${r.total > 1 ? "s are" : " is"} at risk:\n${r.opportunities.map((o) => `* ${o.name}: ${money(o.amount)}, owner ${o.owner}, health ${o.healthScore}/100`).join("\n")}${note}` : `No open deals are currently flagged at risk.${note}` };
  }
  if (/(inactive|no activity|gone quiet|stale)/.test(q)) {
    const r = runTool("get_inactive_deals", { days: 14 }, d, me) as { total: number; deals: { name: string; amount: number; owner: string; daysSince: number }[] };
    return { mode: "rules", evidence: ev("get_inactive_deals"), text: r.total ? `${r.total} open deals have no activity for 14 days or more:\n${r.deals.slice(0, 10).map((o) => `* ${o.name}: ${money(o.amount)}, ${o.owner}, ${o.daysSince} days`).join("\n")}${note}` : `Every open deal has activity in the last 14 days.${note}` };
  }
  if (/(likely to close|most likely|best deals|close soon)/.test(q)) {
    const r = runTool("list_opportunities", { sort: "probability", limit: 10 }, d, me) as { opportunities: { name: string; amount: number; probability: number; closeDate: string | null; health: string | null }[] };
    return { mode: "rules", evidence: ev("list_opportunities"), text: `Open deals ranked by win probability:\n${r.opportunities.map((o) => `* ${o.name}: ${o.probability}%, ${money(o.amount)}, closes ${o.closeDate ?? "date not set"}${o.health ? `, ${o.health.replace("_", " ")}` : ""}`).join("\n")}${note}` };
  }
  if (/(rep|representative|performing|leaderboard|best seller|team perform)/.test(q)) {
    const r = runTool("get_rep_performance", { period_type: "quarter" }, d, me) as { period: string; reps: { name: string; revenue: number; attainment: number | null; dealsWon: number; winRate: number | null }[] };
    return { mode: "rules", evidence: ev("get_rep_performance"), text: `Performance in ${r.period}:\n${r.reps.map((x) => `* ${x.name}: ${money(x.revenue)}${x.attainment != null ? `, ${x.attainment}% of quota` : ""}, ${x.dealsWon} won${x.winRate != null ? `, ${x.winRate}% win rate` : ""}`).join("\n")}${note}` };
  }
  if (/(pipeline|declin|bottleneck|conversion)/.test(q)) {
    const r = runTool("get_pipeline_analysis", {}, d, me) as { byStage: { stage: string; count: number; value: number }[]; newPipelineLast30Days: { value: number; count: number }; newPipelinePrevious30Days: { value: number; count: number }; findings: { title: string; detail: string }[] };
    return { mode: "rules", evidence: ev("get_pipeline_analysis"), text: `Open pipeline by stage:\n${r.byStage.map((s) => `* ${s.stage}: ${s.count} deals, ${money(s.value)}`).join("\n")}\n\nNew pipeline: ${money(r.newPipelineLast30Days.value)} in the last 30 days versus ${money(r.newPipelinePrevious30Days.value)} in the 30 days before.\n${r.findings.length ? `\nFindings:\n${r.findings.map((f) => `* ${f.title}`).join("\n")}` : ""}${note}` };
  }
  if (/(expansion|upsell|churn|renewal|customer)/.test(q)) {
    const filter = /(expansion|upsell)/.test(q) ? "expansion" : /churn/.test(q) ? "churn_risk" : "all";
    const r = runTool("get_customer_health", { filter }, d, me) as { total: number; customers: { name: string; arr: number; health: string; churnRisk: string; expansionPotential: string; nextRenewal: string | null }[] };
    return { mode: "rules", evidence: ev("get_customer_health"), text: r.total ? `${r.total} customer${r.total > 1 ? "s" : ""}:\n${r.customers.slice(0, 10).map((c) => `* ${c.name}: ${money(c.arr)} ARR, ${c.health.replace("_", " ")}, churn risk ${c.churnRisk}, expansion ${c.expansionPotential}${c.nextRenewal ? `, renews ${c.nextRenewal}` : ""}`).join("\n")}${note}` : `No matching customers found.${note}` };
  }
  if (/(prioriti|today|focus|what should)/.test(q)) {
    const r = runTool("get_priorities", { for_user: "me" }, d, me) as { priorities: { title: string; detail: string }[]; topDealRisks: { title: string }[] };
    return { mode: "rules", evidence: ev("get_priorities"), text: `${r.priorities.length ? r.priorities.map((p) => `${p.title}\n${p.detail}`).join("\n\n") : "No overdue tasks or urgent deals are assigned to you."}${r.topDealRisks.length ? `\n\nTop deal risks across the team:\n${r.topDealRisks.map((x) => `* ${x.title}`).join("\n")}` : ""}${note}` };
  }
  const s = runTool("get_revenue_summary", { period_type: "quarter" }, d, me) as Record<string, number | string | null>;
  return { mode: "rules", evidence: ev("get_revenue_summary"), text: `Here is the current quarter (${s.period}) from your records:\n* Revenue booked: ${money(s.totalRevenue as number)}\n* Open pipeline: ${money(s.pipelineValue as number)} (weighted ${money(s.weightedPipeline as number)})\n* Win rate: ${s.winRate != null ? `${s.winRate}%` : "no closed deals yet"}\n* ARR: ${money(s.arr as number)}\n\nTry asking about the forecast, deals at risk, inactive deals, rep performance, pipeline, customers or today's priorities.${note}` };
}
