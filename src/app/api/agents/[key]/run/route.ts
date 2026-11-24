import { handle, json, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/agents/run";
import { AGENTS } from "@/lib/revenue/agents";
import type { AgentKey } from "@/config/plans";

export const maxDuration = 120;

/** Runs an agent on demand. It reads data with the caller's own permissions. */
export const POST = handle(async (_req: Request, { params }: { params: Promise<{ key: string }> }) => {
  const { key } = await params;
  if (!AGENTS.some((a) => a.key === key)) throw new ApiError(404, "Unknown agent.");
  const ctx = await requireUser("agent.run");
  return json(await runAgent({ orgId: ctx.orgId, agent: key as AgentKey, reader: await createClient(), userId: ctx.userId, trigger: "manual" }));
});
