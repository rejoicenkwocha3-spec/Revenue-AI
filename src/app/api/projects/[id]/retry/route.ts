import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { kickWorker } from "@/lib/pipeline/queue";
import { logActivity } from "@/lib/activity";

export const maxDuration = 300;
const schema = z.object({ jobId: z.string().uuid() });

export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { ctx, project } = await projectAccess(id, "pipeline.run");
  const { jobId } = await parseBody(req, schema);
  const admin = createAdminClient();
  const { data: job } = await admin.from("processing_jobs").select("id, status, project_id").eq("id", jobId).maybeSingle();
  if (!job || job.project_id !== id) throw new ApiError(404, "Job not found.");
  if (job.status !== "failed") throw new ApiError(400, "Only failed steps can be retried.");
  await admin.from("processing_jobs").update({ status: "queued", attempts: 0, error: null, run_after: new Date().toISOString(), finished_at: null }).eq("id", jobId);
  await admin.from("projects").update({ status: "queued", status_detail: "Retrying" }).eq("id", id);
  await logActivity({ orgId: project.org_id, userId: ctx.userId, projectId: id, action: "job.retried" });
  kickWorker();
  return json({ ok: true });
});
