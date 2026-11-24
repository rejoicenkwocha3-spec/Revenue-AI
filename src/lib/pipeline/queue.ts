import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runJob, JobDeferred } from "./steps";
import { ProviderError, ProviderNotConfiguredError } from "@/lib/providers/types";
import { notify, orgMemberIds, logActivity } from "@/lib/activity";

export type JobType = "extract_audio" | "transcribe" | "translate" | "generate_voice" | "synchronise" | "subtitles" | "render";

export interface JobRow {
  id: string;
  org_id: string;
  project_id: string;
  type: JobType;
  target_language: string | null;
  status: string;
  attempts: number;
  max_attempts: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  created_by: string | null;
}

export const JOB_LABELS: Record<JobType, string> = {
  extract_audio: "Extract audio",
  transcribe: "Transcribe speech and detect speakers",
  translate: "Translate transcript",
  generate_voice: "Generate voice",
  synchronise: "Synchronise audio",
  subtitles: "Generate subtitles",
  render: "Render and export",
};

const PROJECT_STATUS: Record<JobType, string> = {
  extract_audio: "transcribing",
  transcribe: "transcribing",
  translate: "translating",
  generate_voice: "generating_voice",
  synchronise: "synchronising",
  subtitles: "rendering",
  render: "rendering",
};

export async function enqueueJob(params: {
  orgId: string;
  projectId: string;
  type: JobType;
  targetLanguage?: string | null;
  payload?: Record<string, unknown>;
  createdBy?: string | null;
}) {
  const admin = createAdminClient();
  // Avoid duplicate pending work for the same step.
  let existing = admin
    .from("processing_jobs")
    .select("id")
    .eq("project_id", params.projectId)
    .eq("type", params.type)
    .in("status", ["queued", "running"]);
  existing = params.targetLanguage ? existing.eq("target_language", params.targetLanguage) : existing.is("target_language", null);
  const { data: dup } = await existing.limit(1);
  if (dup && dup.length) return dup[0].id as string;

  const { data, error } = await admin
    .from("processing_jobs")
    .insert({
      org_id: params.orgId,
      project_id: params.projectId,
      type: params.type,
      target_language: params.targetLanguage ?? null,
      payload: params.payload ?? {},
      created_by: params.createdBy ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Could not queue ${params.type}: ${error.message}`);
  return data.id as string;
}

/** Schedules the worker to run after the current response is sent. */
export function kickWorker(budgetMs = 240_000) {
  after(async () => {
    try {
      await runWorker({ budgetMs });
    } catch (e) {
      console.error("[worker]", e);
    }
  });
}

/** Processes queued jobs until the queue is empty or the time budget is spent. */
export async function runWorker({ budgetMs }: { budgetMs: number }) {
  const admin = createAdminClient();
  const deadline = Date.now() + budgetMs;
  let processed = 0;
  while (Date.now() < deadline - 15_000) {
    const { data, error } = await admin.rpc("claim_next_job");
    if (error) throw new Error(`Queue unavailable: ${error.message}`);
    const job = (Array.isArray(data) ? data[0] : data) as JobRow | undefined;
    if (!job) break;
    processed++;
    await execute(job, deadline);
  }
  return { processed };
}

async function execute(job: JobRow, deadline: number) {
  const admin = createAdminClient();
  await admin
    .from("projects")
    .update({ status: PROJECT_STATUS[job.type], status_detail: `${JOB_LABELS[job.type]}${job.target_language ? ` (${job.target_language})` : ""}` })
    .eq("id", job.project_id);

  try {
    const result = await runJob(job, deadline);
    await admin
      .from("processing_jobs")
      .update({ status: "completed", result: result.result ?? {}, finished_at: new Date().toISOString(), locked_at: null, error: null })
      .eq("id", job.id);
    for (const next of result.next ?? []) {
      await enqueueJob({ orgId: job.org_id, projectId: job.project_id, createdBy: job.created_by, ...next });
    }
    if (result.projectStatus) {
      await admin.from("projects").update({ status: result.projectStatus, status_detail: result.statusDetail ?? null }).eq("id", job.project_id);
    }
    if (result.notifyTitle) {
      const users = await orgMemberIds(job.org_id);
      await notify({ userIds: users, orgId: job.org_id, title: result.notifyTitle, body: result.notifyBody, link: `/dashboard/projects/${job.project_id}` });
    }
  } catch (err) {
    if (err instanceof JobDeferred) {
      // Work continues in the next run; this does not count as a failed attempt.
      await admin
        .from("processing_jobs")
        .update({ status: "queued", locked_at: null, attempts: Math.max(0, job.attempts - 1), result: err.progress })
        .eq("id", job.id);
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    const permanent =
      err instanceof ProviderNotConfiguredError || (err instanceof ProviderError && !err.retryable) || job.attempts >= job.max_attempts;
    console.error(`[job ${job.type} ${job.id}]`, message);
    if (!permanent) {
      const delay = 30_000 * 2 ** (job.attempts - 1);
      await admin
        .from("processing_jobs")
        .update({ status: "queued", locked_at: null, error: message, run_after: new Date(Date.now() + delay).toISOString() })
        .eq("id", job.id);
      return;
    }
    await admin
      .from("processing_jobs")
      .update({ status: "failed", locked_at: null, error: message, finished_at: new Date().toISOString() })
      .eq("id", job.id);
    await admin.from("projects").update({ status: "failed", status_detail: `${JOB_LABELS[job.type]} failed: ${message}`.slice(0, 500) }).eq("id", job.project_id);
    const users = await orgMemberIds(job.org_id);
    await notify({
      userIds: users,
      orgId: job.org_id,
      title: `${JOB_LABELS[job.type]} failed`,
      body: message.slice(0, 300),
      link: `/dashboard/projects/${job.project_id}`,
    });
    await logActivity({ orgId: job.org_id, projectId: job.project_id, action: "job.failed", details: { type: job.type, error: message.slice(0, 300) } });
  }
}
