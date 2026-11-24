import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMOTIONS } from "@/config/languages";
import { can } from "@/lib/permissions";

const schema = z
  .object({
    text: z.string().max(5000).optional(),
    startMs: z.number().int().min(0).optional(),
    endMs: z.number().int().min(0).optional(),
    speed: z.number().min(0.5).max(2).optional(),
    pauseMs: z.number().int().min(0).max(10000).optional(),
    offsetMs: z.number().int().min(-10000).max(10000).optional(),
    emotion: z.enum(EMOTIONS).nullable().optional(),
    status: z.enum(["draft", "edited", "approved"]).optional(),
  })
  .refine((b) => b.startMs === undefined || b.endMs === undefined || b.endMs > b.startMs, { message: "End time must be after start time" });

/** Edits one translated line: wording, timing, delivery or review status. */
export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await parseBody(req, schema);
  const admin = createAdminClient();
  const { data: seg } = await admin.from("translation_segments").select("id, project_id, start_ms, end_ms").eq("id", id).maybeSingle();
  if (!seg) throw new ApiError(404, "Segment not found.");
  const { ctx, role } = await projectAccess(seg.project_id, "translation.edit");
  if (body.status === "approved" && !can(role, "dub.approve") && !can(role, "translation.edit")) throw new ApiError(403, "You cannot approve lines.");
  const start = body.startMs ?? seg.start_ms;
  const end = body.endMs ?? seg.end_ms;
  if (end <= start) throw new ApiError(400, "End time must be after start time.");
  const update: Record<string, unknown> = { updated_by: ctx.userId, updated_at: new Date().toISOString() };
  if (body.text !== undefined) {
    update.text = body.text;
    update.status = body.status ?? "edited";
  }
  if (body.status !== undefined) update.status = body.status;
  if (body.startMs !== undefined) update.start_ms = body.startMs;
  if (body.endMs !== undefined) update.end_ms = body.endMs;
  if (body.speed !== undefined) update.speed = body.speed;
  if (body.pauseMs !== undefined) update.pause_ms = body.pauseMs;
  if (body.offsetMs !== undefined) update.offset_ms = body.offsetMs;
  if (body.emotion !== undefined) update.emotion = body.emotion;
  const { data, error } = await admin.from("translation_segments").update(update).eq("id", id).select("*").single();
  if (error) throw new ApiError(500, error.message);
  return json({ segment: data });
});
