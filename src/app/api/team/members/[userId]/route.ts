import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
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
  const body = await parseBody(req, z.object({ role: z.enum(["admin", "sales_manager", "sales_rep", "revops", "executive", "viewer"]).optional(), team_id: z.string().uuid().nullable().optional(), territory_id: z.string().uuid().nullable().optional() }));
  const role = body.role;
  const current = await target(ctx.orgId, userId);
  if (role && current === "owner") throw new ApiError(403, "The owner's role cannot be changed.");
  if (role && (current === "admin" || role === "admin") && ctx.role !== "owner") throw new ApiError(403, "Only the owner can change administrator roles.");
  const admin = createAdminClient();
  for (const [col, table] of [["team_id", "teams"], ["territory_id", "territories"]] as const) {
    const v = body[col];
    if (v) { const { data } = await admin.from(table).select("id").eq("id", v).eq("org_id", ctx.orgId).maybeSingle(); if (!data) throw new ApiError(400, "That team or territory does not belong to this organisation."); }
  }
  const patch: Record<string, unknown> = {};
  if (role) patch.role = role;
  if (body.team_id !== undefined) patch.team_id = body.team_id;
  if (body.territory_id !== undefined) patch.territory_id = body.territory_id;
  await admin.from("organisation_members").update(patch).eq("org_id", ctx.orgId).eq("user_id", userId);
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "team.member_updated", details: { role: role ? ROLE_LABELS[role] : undefined, team: body.team_id, territory: body.territory_id } });
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
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "team.removed" });
  return json({ ok: true });
});
