import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueJob, kickWorker } from "@/lib/pipeline/queue";
import { logActivity } from "@/lib/activity";
import { assertMinutesAvailable } from "@/lib/billing";
import { ttsProvider } from "@/lib/providers";

export const maxDuration = 300;
const schema = z.object({ language: z.string().min(2).max(5), embedSubtitles: z.boolean().default(true) });

/** Generates the dub for one language: voices, synchronisation, subtitles and render. Usage is checked first. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { ctx, project } = await projectAccess(id, "pipeline.run");
  const { language, embedSubtitles } = await parseBody(req, schema);
  if (!ttsProvider()) throw new ApiError(400, "Voice generation is not configured. Add ELEVENLABS_API_KEY or OPENAI_API_KEY on the server.");
  if (!project.target_languages.includes(language)) throw new ApiError(400, "This language is not a target of the project.");
  const admin = createAdminClient();
  const [{ count }, { data: speakers }, { data: busy }] = await Promise.all([
    admin.from("translation_segments").select("id", { count: "exact", head: true }).eq("project_id", id).eq("target_language", language),
    admin.from("speakers").select("display_name, voice_id").eq("project_id", id),
    admin.from("processing_jobs").select("id").eq("project_id", id).in("status", ["queued", "running"]).limit(1),
  ]);
  if (!count) throw new ApiError(400, "Translate the transcript into this language first.");
  const missing = (speakers ?? []).filter((s) => !s.voice_id).map((s) => s.display_name);
  if (missing.length) throw new ApiError(400, `Assign a voice to ${missing.join(", ")} first.`);
  if (busy?.length) throw new ApiError(409, "Wait for the current processing step to finish.");

  const minutes = Math.ceil(((Number(project.duration_seconds) || 0) / 60) * 10) / 10;
  await assertMinutesAvailable(project.org_id, minutes);

  await enqueueJob({ orgId: project.org_id, projectId: id, type: "generate_voice", targetLanguage: language, createdBy: ctx.userId, payload: { embedSubtitles } });
  await admin.from("projects").update({ status: "queued", status_detail: `Dub generation for ${language} queued` }).eq("id", id);
  await logActivity({ orgId: project.org_id, userId: ctx.userId, projectId: id, action: "dub.requested", details: { language } });
  kickWorker();
  return json({ ok: true, minutes });
});
