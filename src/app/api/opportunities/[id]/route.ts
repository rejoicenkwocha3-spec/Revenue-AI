import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { opportunitySchema } from "@/lib/schemas";
import { assertAffected, assertId, clean, dbError } from "@/lib/crud";
import { audit, notify } from "@/lib/audit";
import { can } from "@/lib/permissions";

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  assertId(id);
  const ctx = await requireUser("crm.write");
  const body = clean(await parseBody(req, opportunitySchema.partial()));
  if (body.owner_id !== undefined && !can(ctx.role, "deal.manage_any")) throw new ApiError(403, "Only managers can reassign deals.");
  const supabase = await createClient();
  const { data: before } = await supabase.from("opportunities").select("owner_id, name").eq("id", id).maybeSingle();
  const { data, error } = await supabase.from("opportunities").update(body).eq("id", id).eq("org_id", ctx.orgId).select("*");
  dbError(error, "opportunity");
  assertAffected(data, "opportunity");
  const changed = Object.keys(body);
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "opportunity.updated", entityType: "opportunities", entityId: id, details: { fields: changed } });
  if (body.owner_id && before && body.owner_id !== before.owner_id && body.owner_id !== ctx.userId) {
    await notify({ userIds: [body.owner_id], orgId: ctx.orgId, title: `${ctx.fullName} assigned you ${before.name}`, link: `/dashboard/deals/${id}` });
  }
  return json(data![0]);
});

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  assertId(id);
  const ctx = await requireUser("deal.manage_any");
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunities").delete().eq("id", id).eq("org_id", ctx.orgId).select("id, name");
  dbError(error, "opportunity");
  assertAffected(data, "opportunity");
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "opportunity.deleted", entityType: "opportunities", entityId: id, details: { name: data![0].name } });
  return json({ ok: true });
});
