import { handle, json, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueJob, kickWorker } from "@/lib/pipeline/queue";
import { logActivity } from "@/lib/activity";
import { sttProvider, translationProvider } from "@/lib/providers";
import { getEntitlements } from "@/lib/billing";

export const maxDuration = 300;

/** Starts the pipeline: extract audio, transcribe, detect speakers and translate into every target language. */
export const POST = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { ctx, project } = await projectAccess(id, "pipeline.run");
  if (!sttProvider()) throw new ApiError(400, "Speech recognition is not configured. Add ELEVENLABS_API_KEY or OPENAI_API_KEY on the server.");
  if (project.target_languages.length && !translationProvider()) throw new ApiError(400, "Translation is not configured. Add DEEPL_API_KEY or OPENAI_API_KEY on the server.");
  const ent = await getEntitlements(project.org_id);
  if (ent.minutesIncluded === 0) throw new ApiError(402, "An active subscription is required to process media. Choose a plan on the Billing page.", "subscription_required");
  const admin = createAdminClient();
  const { data: media } = await admin.from("media_files").select("id").eq("project_id", id).in("kind", ["video", "audio"]).limit(1);
  if (!media?.length) throw new ApiError(400, "Upload a video or audio file first.");
  const { data: running } = await admin.from("processing_jobs").select("id").eq("project_id", id).in("status", ["queued", "running"]).limit(1);
  if (running?.length) throw new ApiError(409, "This project is already processing.");

  await enqueueJob({ orgId: project.org_id, projectId: id, type: "extract_audio", createdBy: ctx.userId });
  await admin.from("projects").update({ status: "queued", status_detail: "Waiting for a worker" }).eq("id", id);
  await logActivity({ orgId: project.org_id, userId: ctx.userId, projectId: id, action: "pipeline.started", details: { name: project.name } });
  kickWorker();
  return json({ ok: true });
});
