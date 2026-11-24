import "server-only";
import crypto from "node:crypto";
import type { Db } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadOrgData } from "@/lib/revenue/load";
import { AGENTS, analyse, type ProposedAction, type Recommendation } from "@/lib/revenue/agents";
import { assessAll } from "@/lib/revenue/dealHealth";
import { assessCustomers } from "@/lib/revenue/customerHealth";
import { computeForecast } from "@/lib/revenue/forecast";
import { revenueInsights } from "@/lib/revenue/insights";
import { periodFor } from "@/lib/revenue/periods";
import { summariseFindings } from "@/lib/ai/claude";
import { audit, notify, orgMemberIds } from "@/lib/audit";
import { assertAgentAllowed, recordUsage } from "@/lib/billing";
import { ApiError } from "@/lib/api";
import type { AgentKey } from "@/config/plans";
import type { OrgData } from "@/lib/revenue/types";

interface AgentConfig { enabled: boolean; can_create_tasks: boolean; can_suggest_deal_updates: boolean; can_draft_emails: boolean; auto_create_tasks: boolean; use_llm: boolean }

function permitted(cfg: AgentConfig, action: ProposedAction | null | undefined): boolean {
  if (!action) return false;
  if (action.type === "create_task") return cfg.can_create_tasks;
  if (action.type === "update_deal") return cfg.can_suggest_deal_updates;
  return cfg.can_draft_emails;
}

/** Keeps stored health scores, risk factors, customer health and insights in step with the analysis. */
async function persistDerived(agent: AgentKey, d: OrgData) {
  const admin = createAdminClient();
  if (agent === "deal_inspection") {
    const health = assessAll(d);
    const rows = [...health.values()].map((h) => ({ opportunity_id: h.opportunityId, org_id: d.orgId, score: h.score, health: h.health, engagement_score: h.engagementScore, components: h.components, computed_at: new Date().toISOString() }));
    if (rows.length) await admin.from("deal_health_scores").upsert(rows, { onConflict: "opportunity_id" });
    await admin.from("deal_risk_factors").delete().eq("org_id", d.orgId);
    const factors = [...health.values()].flatMap((h) => h.factors.map((f) => ({ org_id: d.orgId, opportunity_id: h.opportunityId, code: f.code, severity: f.severity, kind: f.kind, title: f.title, evidence: f.evidence, recommendation: f.recommendation })));
    for (let i = 0; i < factors.length; i += 500) await admin.from("deal_risk_factors").insert(factors.slice(i, i + 500));
  }
  if (agent === "customer_retention") {
    const rows = assessCustomers(d).map((c) => ({ account_id: c.accountId, org_id: d.orgId, score: c.score, health: c.health, churn_risk: c.churnRisk, expansion_potential: c.expansionPotential, components: { signals: c.signals }, computed_at: new Date().toISOString() }));
    if (rows.length) await admin.from("customer_health_scores").upsert(rows, { onConflict: "account_id" });
  }
  if (agent === "revenue_insights") {
    const health = assessAll(d);
    const insights = revenueInsights(d, health, computeForecast(d, periodFor("quarter", d.now, d.fiscalStartMonth), health));
    await admin.from("ai_insights").delete().eq("org_id", d.orgId).eq("agent_key", "revenue_insights").is("dismissed_at", null);
    if (insights.length) await admin.from("ai_insights").insert(insights.map((i) => ({ org_id: d.orgId, category: i.category, title: i.title, body: i.body, severity: i.severity, evidence: i.evidence, is_projection: i.isProjection, source: "rules", agent_key: "revenue_insights" })));
  }
}

/**
 * Runs an agent. Data is read with the client passed in (the user's own session, so RLS applies;
 * scheduled runs pass the service client). Recommendations are stored with their evidence.
 * Actions wait for approval, except internal task creation when the organisation enabled auto tasks.
 */
export async function runAgent(params: { orgId: string; agent: AgentKey; reader: Db; userId: string | null; trigger: "manual" | "scheduled" }) {
  const { orgId, agent, reader, userId } = params;
  const admin = createAdminClient();
  await assertAgentAllowed(orgId, agent);
  const { data: cfg } = await admin.from("ai_agent_configs").select("*").eq("org_id", orgId).eq("agent_key", agent).maybeSingle();
  if (!cfg) throw new ApiError(404, "Agent configuration not found.");
  if (!cfg.enabled) throw new ApiError(409, "Activate this agent before running it.");

  const data = await loadOrgData(reader, orgId);
  const recs = analyse(agent, data);
  const runId = crypto.randomUUID();
  const def = AGENTS.find((a) => a.key === agent)!;

  await admin.from("ai_agent_activities").update({ status: "superseded" }).eq("org_id", orgId).eq("agent_key", agent).in("status", ["pending", "info"]).eq("kind", "recommendation");

  const summary = cfg.use_llm ? await summariseFindings(`${def.name} findings`, recs.slice(0, 20).map((r) => ({ title: r.title, detail: r.body, evidence: r.evidence }))) : null;
  await admin.from("ai_agent_activities").insert({
    org_id: orgId, agent_key: agent, run_id: runId, kind: "run", status: "info", triggered_by: userId, priority: 0,
    title: `${def.name} ${params.trigger === "scheduled" ? "scheduled run" : "run"}: ${recs.length} finding${recs.length === 1 ? "" : "s"}`,
    body: summary ?? (recs.length ? recs.slice(0, 3).map((r) => r.title).join(". ") + "." : "No issues found in the current data."),
    evidence: [{ label: "Records analysed", value: `${data.opportunities.length} opportunities, ${data.accounts.length} accounts, ${data.activities.length} activities` }, { label: "Summary", value: summary ? "Written by AI from the findings below" : "Rule based" }],
  });

  let autoCompleted = 0;
  const rows = recs.map((r: Recommendation) => {
    const action = permitted(cfg as AgentConfig, r.action) ? r.action! : null;
    return {
      org_id: orgId, agent_key: agent, run_id: runId, kind: "recommendation", title: r.title, body: r.body, evidence: r.evidence,
      opportunity_id: r.opportunityId ?? null, account_id: r.accountId ?? null, target_user_id: r.targetUserId ?? null,
      proposed_action: action, status: action ? "pending" : "info", priority: r.priority, triggered_by: userId,
    };
  });
  const { data: inserted, error } = rows.length ? await admin.from("ai_agent_activities").insert(rows).select("id, proposed_action") : { data: [], error: null };
  if (error) throw new ApiError(500, error.message);

  if (cfg.auto_create_tasks) {
    for (const row of inserted ?? []) {
      const a = row.proposed_action as ProposedAction | null;
      if (a?.type !== "create_task") continue;
      await executeAction({ activityId: row.id, orgId, actor: null, writer: admin, auto: true });
      autoCompleted++;
    }
  }
  await persistDerived(agent, data);
  await admin.from("ai_agent_configs").update({ last_run_at: new Date().toISOString() }).eq("org_id", orgId).eq("agent_key", agent);
  await recordUsage(orgId, userId, "agent_run");
  await audit({ orgId, userId, actorType: "agent", agentKey: agent, action: "agent.run", details: { runId, findings: recs.length, trigger: params.trigger, autoCompletedTasks: autoCompleted } });
  const pending = rows.filter((r) => r.status === "pending").length - autoCompleted;
  if (pending > 0) {
    await notify({ userIds: await orgMemberIds(orgId, ["owner", "admin", "sales_manager", "revops"]), orgId, title: `${def.name} has ${pending} action${pending > 1 ? "s" : ""} awaiting approval`, link: "/dashboard/agents?status=pending" });
  }
  return { runId, findings: recs.length, pending, autoCompleted };
}

/**
 * Executes an approved action. `writer` is the approving user's own client so Row Level Security
 * decides whether they may change the record; automatic task creation uses the service client.
 * Emails are never sent: approving a draft makes it available to copy into the user's mail client.
 */
export async function executeAction(params: { activityId: string; orgId: string; actor: string | null; writer: Db; auto?: boolean }) {
  const admin = createAdminClient();
  const { data: act } = await admin.from("ai_agent_activities").select("*").eq("id", params.activityId).eq("org_id", params.orgId).maybeSingle();
  if (!act) throw new ApiError(404, "Recommendation not found.");
  if (act.status !== "pending") throw new ApiError(409, "This recommendation has already been decided.");
  const action = act.proposed_action as ProposedAction | null;
  if (!action) throw new ApiError(400, "This recommendation has no action to approve.");
  let result = "";
  try {
    if (action.type === "create_task") {
      const { data: task, error } = await params.writer.from("tasks").insert({
        org_id: params.orgId, title: action.title.slice(0, 300), description: action.description ?? null, due_date: action.due_date, priority: action.priority,
        kind: "follow_up", assignee_id: action.assignee_id ?? params.actor, opportunity_id: action.opportunity_id ?? null, account_id: action.account_id ?? null,
        source: "agent", created_by: params.actor,
      }).select("id").single();
      if (error) throw new Error(error.message);
      result = `Task created (${task.id}).`;
      if (action.assignee_id && action.assignee_id !== params.actor) await notify({ userIds: [action.assignee_id], orgId: params.orgId, title: `New task: ${action.title}`, link: "/dashboard/activities" });
    } else if (action.type === "update_deal") {
      const { data, error } = await params.writer.from("opportunities").update(action.changes).eq("id", action.opportunity_id).eq("org_id", params.orgId).select("id");
      if (error) throw new Error(error.message);
      if (!data?.length) throw new Error("You do not have permission to update this deal.");
      result = `Deal updated: ${Object.entries(action.changes).map(([k, v]) => `${k.replace("_", " ")} set to ${String(v).replace("_", " ")}`).join(", ")}.`;
    } else {
      result = "Email draft approved. It has not been sent: copy it into your email client to send it.";
    }
  } catch (err) {
    await admin.from("ai_agent_activities").update({ status: "failed", decided_by: params.actor, decided_at: new Date().toISOString(), result: (err as Error).message }).eq("id", act.id);
    await audit({ orgId: params.orgId, userId: params.actor, actorType: params.auto ? "agent" : "user", agentKey: act.agent_key, action: "agent.action_failed", entityType: "ai_agent_activity", entityId: act.id, details: { action, error: (err as Error).message } });
    throw new ApiError(403, (err as Error).message);
  }
  await admin.from("ai_agent_activities").update({ status: "completed", decided_by: params.actor, decided_at: new Date().toISOString(), result: params.auto ? `${result} Created automatically because auto task creation is enabled.` : result }).eq("id", act.id);
  await audit({ orgId: params.orgId, userId: params.actor, actorType: params.auto ? "agent" : "user", agentKey: act.agent_key, action: params.auto ? "agent.action_auto_executed" : "agent.action_approved", entityType: "ai_agent_activity", entityId: act.id, details: { action, result } });
  return { result };
}

export async function rejectAction(params: { activityId: string; orgId: string; actor: string; reason?: string }) {
  const admin = createAdminClient();
  const { data: act } = await admin.from("ai_agent_activities").select("id, status, agent_key, proposed_action").eq("id", params.activityId).eq("org_id", params.orgId).maybeSingle();
  if (!act) throw new ApiError(404, "Recommendation not found.");
  if (act.status !== "pending") throw new ApiError(409, "This recommendation has already been decided.");
  await admin.from("ai_agent_activities").update({ status: "rejected", decided_by: params.actor, decided_at: new Date().toISOString(), result: params.reason ?? "Rejected" }).eq("id", act.id);
  await audit({ orgId: params.orgId, userId: params.actor, agentKey: act.agent_key, action: "agent.action_rejected", entityType: "ai_agent_activity", entityId: act.id, details: { action: act.proposed_action, reason: params.reason ?? null } });
}
