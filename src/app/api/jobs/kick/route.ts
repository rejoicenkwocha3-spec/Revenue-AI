import { handle, json, requireUser } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { kickWorker } from "@/lib/pipeline/queue";

export const maxDuration = 300;

/** Lets an open workspace resume queued work (for example after a retry delay) without a scheduler. */
export const POST = handle(async () => {
  const ctx = await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from("processing_jobs")
    .select("id")
    .in("org_id", ctx.memberships.map((m) => m.orgId))
    .eq("status", "queued")
    .lte("run_after", new Date().toISOString())
    .limit(1);
  if (data?.length) kickWorker();
  return json({ queued: !!data?.length });
});
