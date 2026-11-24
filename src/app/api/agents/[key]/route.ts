import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { AGENTS } from "@/lib/revenue/agents";
import { assertAgentAllowed } from "@/lib/billing";
import type { AgentKey } from "@/config/plans";

const schema = z.object({ enabled: z.boolean().optional(), can_create_tasks: z.boolean().optional(), can_suggest_deal_updates: z.boolean().optional(), can_draft_emails: z.boolean().optional(), auto_create_tasks: z.boolean().optional(), use_llm: z.boolean().optional() });

/** Activates an agent or changes what it may propose. Recorded in the audit trail. */
export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ key: string }> }) => {
  const { key } = await params;
  if (!AGENTS.some((a) => a.key === key)) throw new ApiError(404, "Unknown agent.");
  const ctx = await requireUser("agent.configure");
  const body = await parseBody(req, schema);
  if (body.enabled) await assertAgentAllowed(ctx.orgId, key as AgentKey);
  const { error } = await createAdminClient().from("ai_agent_configs").update({ ...body, updated_by: ctx.userId, updated_at: new Date().toISOString() }).eq("org_id", ctx.orgId).eq("agent_key", key);
  if (error) throw new ApiError(500, error.message);
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "agent.configured", agentKey: key, details: body });
  return json({ ok: true });
});
