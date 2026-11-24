import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_LIMITS, getPlan, type AgentKey, type Plan } from "@/config/plans";
import { ApiError } from "@/lib/api";

export interface Entitlements {
  plan: Plan | null;
  planName: string;
  subscription: { id: string; status: string; currentPeriodEnd: string | null; currentPeriodStart: string } | null;
  periodStart: string;
  seats: number;
  maxOpportunities: number | null;
  aiQueriesPerMonth: number;
  aiQueriesUsed: number;
  agents: AgentKey[];
  maxIntegrations: number | null;
}

/** Plan limits come only from verified subscriptions (activated by Selar notifications). */
export async function getEntitlements(orgId: string): Promise<Entitlements> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, plan_id, status, current_period_start, current_period_end")
    .eq("org_id", orgId)
    .eq("status", "active")
    .or(`current_period_end.is.null,current_period_end.gt.${nowIso}`)
    .order("current_period_end", { ascending: false, nullsFirst: true })
    .limit(1)
    .maybeSingle();
  const plan = sub ? getPlan(sub.plan_id) ?? null : null;
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const periodStart = sub?.current_period_start && new Date(sub.current_period_start) > monthStart ? sub.current_period_start : monthStart.toISOString();
  const { count } = await admin.from("usage_records").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("kind", "ai_query").gte("created_at", periodStart);
  return {
    plan,
    planName: plan?.name ?? FREE_LIMITS.name,
    subscription: sub ? { id: sub.id, status: sub.status, currentPeriodEnd: sub.current_period_end, currentPeriodStart: sub.current_period_start } : null,
    periodStart,
    seats: plan?.seats ?? FREE_LIMITS.seats,
    maxOpportunities: plan ? plan.maxOpportunities : FREE_LIMITS.maxOpportunities,
    aiQueriesPerMonth: plan?.aiQueriesPerMonth ?? FREE_LIMITS.aiQueriesPerMonth,
    aiQueriesUsed: count ?? 0,
    agents: plan?.agents ?? FREE_LIMITS.agents,
    maxIntegrations: plan ? plan.maxIntegrations : FREE_LIMITS.maxIntegrations,
  };
}

export async function assertAiQueryAvailable(orgId: string) {
  const e = await getEntitlements(orgId);
  if (e.aiQueriesUsed >= e.aiQueriesPerMonth) {
    throw new ApiError(402, `Your ${e.planName} plan includes ${e.aiQueriesPerMonth} AI questions a month and they are used up. Upgrade on the Billing page.`, "ai_limit");
  }
  return e;
}

export async function assertOpportunityCapacity(orgId: string, adding = 1) {
  const e = await getEntitlements(orgId);
  if (e.maxOpportunities == null) return e;
  const { count } = await createAdminClient().from("opportunities").select("id", { count: "exact", head: true }).eq("org_id", orgId);
  if ((count ?? 0) + adding > e.maxOpportunities) {
    throw new ApiError(402, `Your ${e.planName} plan allows ${e.maxOpportunities} opportunities. Upgrade on the Billing page to add more.`, "opportunity_limit");
  }
  return e;
}

export async function assertAgentAllowed(orgId: string, agent: AgentKey) {
  const e = await getEntitlements(orgId);
  if (!e.agents.includes(agent)) throw new ApiError(402, `This agent is not included in the ${e.planName} plan. Upgrade on the Billing page.`, "agent_not_in_plan");
  return e;
}

export async function assertIntegrationCapacity(orgId: string) {
  const e = await getEntitlements(orgId);
  if (e.maxIntegrations == null) return e;
  const { count } = await createAdminClient().from("integrations").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "connected");
  if ((count ?? 0) >= e.maxIntegrations) {
    throw new ApiError(402, e.maxIntegrations === 0 ? "Integrations need an active plan. Choose one on the Billing page." : `Your ${e.planName} plan allows ${e.maxIntegrations} connected integrations.`, "integration_limit");
  }
  return e;
}

export async function recordUsage(orgId: string, userId: string | null, kind: "ai_query" | "agent_run") {
  await createAdminClient().from("usage_records").insert({ org_id: orgId, user_id: userId, kind });
}
