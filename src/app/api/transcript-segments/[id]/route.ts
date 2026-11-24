import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ text: z.string().min(1).max(5000).optional(), speakerId: z.string().uuid().optional() });

/** Corrects the source transcript or reassigns a line to another speaker. */
export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await parseBody(req, schema);
  const admin = createAdminClient();
  const { data: seg } = await admin.from("transcript_segments").select("id, project_id").eq("id", id).maybeSingle();
  if (!seg) throw new ApiError(404, "Segment not found.");
  await projectAccess(seg.project_id, "translation.edit");
  const update: Record<string, unknown> = {};
  if (body.text !== undefined) update.source_text = body.text;
  if (body.speakerId !== undefined) {
    const { data: sp } = await admin.from("speakers").select("project_id").eq("id", body.speakerId).maybeSingle();
    if (!sp || sp.project_id !== seg.project_id) throw new ApiError(400, "Speaker does not belong to this project.");
    update.speaker_id = body.speakerId;
  }
  const { error } = await admin.from("transcript_segments").update(update).eq("id", id);
  if (error) throw new ApiError(500, error.message);
  return json({ ok: true });
});
