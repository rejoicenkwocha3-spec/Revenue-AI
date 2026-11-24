import { handle, json, ApiError } from "@/lib/api";
import { orgAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteClonedVoice } from "@/lib/voices";
import { logActivity } from "@/lib/activity";

/** Revokes consent and deletes every voice created from it. */
export const POST = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: c } = await admin.from("voice_consents").select("id, org_id, voice_owner_name").eq("id", id).maybeSingle();
  if (!c) throw new ApiError(404, "Consent not found.");
  const { ctx } = await orgAccess(c.org_id, "voice.clone");
  const { data: voices } = await admin.from("voice_profiles").select("id").eq("consent_id", id).eq("status", "active");
  for (const v of voices ?? []) await deleteClonedVoice(v.id);
  await admin.from("voice_consents").update({ status: "revoked", revoked_at: new Date().toISOString(), token_hash: null }).eq("id", id);
  await logActivity({ orgId: c.org_id, userId: ctx.userId, action: "consent.revoked", details: { owner: c.voice_owner_name } });
  return json({ ok: true });
});
