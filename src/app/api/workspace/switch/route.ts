import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const POST = handle(async (req: Request) => {
  const ctx = await requireUser();
  const { orgId } = await parseBody(req, z.object({ orgId: z.string().uuid() }));
  if (!ctx.memberships.some((m) => m.orgId === orgId)) throw new ApiError(404, "Workspace not found.");
  await createAdminClient().from("profiles").update({ default_org_id: orgId }).eq("id", ctx.userId);
  return json({ ok: true });
});
