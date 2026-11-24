import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { ROLE_LABELS } from "@/lib/permissions";

async function target(orgId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("organisation_members").select("role").eq("org_id", orgId).eq("user_id", userId).maybeSingle();
  if (!data) throw new ApiError(404, "Member not found.");
  return data.role as string;
}

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;
  const ctx = await requireUser("team.manage");
  const { role } = await parseBody(req, z.object({ role: z.enum(["admin", "editor", "translator", "reviewer", "viewer"]) }));
  const current = await target(ctx.orgId, userId);
  if (current === "owner") throw new ApiError(403, "The owner's role cannot be changed.");
  if ((current === "admin" || role === "admin") && ctx.role !== "owner") throw new ApiError(403, "Only the owner can change administrator roles.");
  await createAdminClient().from("organisation_members").update({ role }).eq("org_id", ctx.orgId).eq("user_id", userId);
  await logActivity({ orgId: ctx.orgId, userId: ctx.userId, action: "team.role_changed", details: { role: ROLE_LABELS[role] } });
  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;
  const ctx = await requireUser("team.manage");
  const current = await target(ctx.orgId, userId);
  if (current === "owner") throw new ApiError(403, "The owner cannot be removed.");
  if (current === "admin" && ctx.role !== "owner") throw new ApiError(403, "Only the owner can remove administrators.");
  const admin = createAdminClient();
  await admin.from("organisation_members").delete().eq("org_id", ctx.orgId).eq("user_id", userId);
  await admin.from("profiles").update({ default_org_id: null }).eq("id", userId).eq("default_org_id", ctx.orgId);
  await logActivity({ orgId: ctx.orgId, userId: ctx.userId, action: "team.removed" });
  return json({ ok: true });
});
