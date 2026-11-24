import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";

const schema = z.object({ auto_sync: z.boolean().optional(), sync_interval_hours: z.number().int().min(1).max(168).optional(), field_mapping: z.object({ stages: z.record(z.string(), z.string().uuid()).optional() }).optional() });

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;
  const ctx = await requireUser("integration.manage");
  const body = await parseBody(req, schema);
  const { data, error } = await createAdminClient().from("integrations").update({ ...body, updated_at: new Date().toISOString() }).eq("org_id", ctx.orgId).eq("provider", provider).select("id");
  if (error) throw new ApiError(500, error.message);
  if (!data?.length) throw new ApiError(404, "Integration not found.");
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "integration.settings_changed", entityType: "integrations", entityId: data[0].id, details: body });
  return json({ ok: true });
});

/** Disconnects and deletes stored tokens. Imported records stay in Revenue AI. */
export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;
  const ctx = await requireUser("integration.manage");
  const admin = createAdminClient();
  const { data } = await admin.from("integrations").select("id").eq("org_id", ctx.orgId).eq("provider", provider).maybeSingle();
  if (!data) throw new ApiError(404, "Integration not found.");
  await admin.from("integration_credentials").delete().eq("integration_id", data.id);
  await admin.from("integrations").update({ status: "disconnected", auto_sync: false, account_label: null, updated_at: new Date().toISOString() }).eq("id", data.id);
  if (provider === "bi") await admin.from("organisations").update({ api_token_hash: null }).eq("id", ctx.orgId);
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "integration.disconnected", entityType: "integrations", entityId: data.id, details: { provider } });
  return json({ ok: true });
});
