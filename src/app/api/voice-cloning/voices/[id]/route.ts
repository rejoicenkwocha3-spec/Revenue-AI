import { handle, json, ApiError } from "@/lib/api";
import { orgAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteClonedVoice } from "@/lib/voices";
import { logActivity } from "@/lib/activity";

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: v } = await admin.from("voice_profiles").select("id, org_id, name").eq("id", id).maybeSingle();
  if (!v) throw new ApiError(404, "Voice not found.");
  const { ctx } = await orgAccess(v.org_id, "voice.clone");
  await deleteClonedVoice(id);
  await logActivity({ orgId: v.org_id, userId: ctx.userId, action: "voice.deleted", details: { voice: v.name } });
  return json({ ok: true });
});
