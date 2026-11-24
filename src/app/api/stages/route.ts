import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { dbError } from "@/lib/crud";
import { audit } from "@/lib/audit";

const stage = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(60), probability: z.coerce.number().int().min(0).max(100), kind: z.enum(["open", "won", "lost"]), expected_days: z.coerce.number().int().min(1).max(365) });

/** Replaces the pipeline stage configuration. Stages that still hold deals cannot be removed. */
export const PUT = handle(async (req: Request) => {
  const ctx = await requireUser("pipeline.configure");
  const { stages } = await parseBody(req, z.object({ stages: z.array(stage).min(3).max(15) }));
  if (stages.filter((s) => s.kind === "won").length !== 1 || stages.filter((s) => s.kind === "lost").length !== 1) throw new ApiError(400, "Keep exactly one won stage and one lost stage.");
  const supabase = await createClient();
  const { data: current } = await supabase.from("pipeline_stages").select("id").eq("org_id", ctx.orgId);
  const keep = new Set(stages.map((s) => s.id).filter(Boolean));
  const removed = (current ?? []).map((c) => c.id).filter((id) => !keep.has(id));
  if (removed.length) {
    const { count } = await supabase.from("opportunities").select("id", { count: "exact", head: true }).in("stage_id", removed);
    if (count) throw new ApiError(409, `${count} deals are still in a stage you removed. Move them first.`);
    const { error } = await supabase.from("pipeline_stages").delete().in("id", removed).eq("org_id", ctx.orgId);
    dbError(error, "stage");
  }
  for (const [i, s] of stages.entries()) {
    const row = { org_id: ctx.orgId, name: s.name, probability: s.probability, kind: s.kind, expected_days: s.expected_days, position: i + 1 };
    const { error } = s.id ? await supabase.from("pipeline_stages").update(row).eq("id", s.id).eq("org_id", ctx.orgId) : await supabase.from("pipeline_stages").insert(row);
    dbError(error, "stage");
  }
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "pipeline.stages_updated", details: { stages: stages.map((s) => s.name) } });
  return json({ ok: true });
});
