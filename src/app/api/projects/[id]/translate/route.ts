import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueJob, kickWorker } from "@/lib/pipeline/queue";
import { logActivity } from "@/lib/activity";
import { capabilities } from "@/lib/providers";

export const maxDuration = 300;
const schema = z.object({ language: z.string().min(2).max(5) });

/** Translates (or re-translates draft lines) for one target language. Edited and approved lines are kept. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { ctx, project } = await projectAccess(id, "pipeline.run");
  const { language } = await parseBody(req, schema);
  if (!capabilities().targetLanguages.includes(language)) throw new ApiError(400, "That language is not supported by the connected providers.");
  if (!project.target_languages.includes(language)) throw new ApiError(400, "Add the language to the project's targets first.");
  const admin = createAdminClient();
  const { count } = await admin.from("transcript_segments").select("id", { count: "exact", head: true }).eq("project_id", id);
  if (!count) throw new ApiError(400, "Transcribe the media before translating.");
  await enqueueJob({ orgId: project.org_id, projectId: id, type: "translate", targetLanguage: language, createdBy: ctx.userId });
  await admin.from("projects").update({ status: "queued", status_detail: `Translation to ${language} queued` }).eq("id", id);
  await logActivity({ orgId: project.org_id, userId: ctx.userId, projectId: id, action: "translation.requested", details: { language } });
  kickWorker();
  return json({ ok: true });
});
