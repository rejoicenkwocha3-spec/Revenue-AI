import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMOTIONS } from "@/config/languages";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  voiceProvider: z.string().max(40).nullable().optional(),
  voiceId: z.string().max(120).nullable().optional(),
  voiceName: z.string().max(120).nullable().optional(),
  accent: z.string().max(60).nullable().optional(),
  emotion: z.enum(EMOTIONS).optional(),
});

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await parseBody(req, schema);
  const admin = createAdminClient();
  const { data: sp } = await admin.from("speakers").select("id, project_id, display_name").eq("id", id).maybeSingle();
  if (!sp) throw new ApiError(404, "Speaker not found.");
  const { ctx, project } = await projectAccess(sp.project_id, "translation.edit");
  const update: Record<string, unknown> = {};
  if (body.displayName !== undefined) update.display_name = body.displayName;
  if (body.voiceProvider !== undefined) update.voice_provider = body.voiceProvider;
  if (body.voiceId !== undefined) update.voice_id = body.voiceId;
  if (body.voiceName !== undefined) update.voice_name = body.voiceName;
  if (body.accent !== undefined) update.accent = body.accent;
  if (body.emotion !== undefined) update.emotion = body.emotion;
  // Cloned voices may only be assigned when the voice belongs to this workspace and is active.
  if (body.voiceId) {
    const { data: cloned } = await admin.from("voice_profiles").select("org_id, status, is_cloned").eq("provider_voice_id", body.voiceId).eq("is_cloned", true);
    if (cloned?.length && !cloned.some((c) => c.org_id === project.org_id && c.status === "active")) {
      throw new ApiError(403, "That cloned voice is not available in this workspace.");
    }
  }
  const { error } = await admin.from("speakers").update(update).eq("id", id);
  if (error) throw new ApiError(500, error.message);
  await logActivity({ orgId: project.org_id, userId: ctx.userId, projectId: project.id, action: "speaker.updated", details: { speaker: body.displayName ?? sp.display_name } });
  return json({ ok: true });
});
