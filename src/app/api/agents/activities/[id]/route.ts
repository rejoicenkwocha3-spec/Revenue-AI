import { z } from "zod";
import { handle, json, parseBody, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { assertId } from "@/lib/crud";
import { executeAction, rejectAction } from "@/lib/agents/run";

/** Approve or reject an agent's proposed action. Approval executes it with the approver's own permissions. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  assertId(id);
  const ctx = await requireUser("agent.approve");
  const { decision, reason } = await parseBody(req, z.object({ decision: z.enum(["approve", "reject"]), reason: z.string().trim().max(500).optional() }));
  if (decision === "reject") {
    await rejectAction({ activityId: id, orgId: ctx.orgId, actor: ctx.userId, reason });
    return json({ ok: true });
  }
  return json(await executeAction({ activityId: id, orgId: ctx.orgId, actor: ctx.userId, writer: await createClient() }));
});
