import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { removePrefix, BUCKETS } from "@/lib/storage";
import { getEntitlements } from "@/lib/billing";
import { capabilities } from "@/lib/providers";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  sourceLanguage: z.string().min(2).max(5).nullable().optional(),
  targetLanguages: z.array(z.string().min(2).max(5)).max(30).optional(),
  originalAudioVolume: z.number().min(0).max(1).optional(),
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { ctx, project } = await projectAccess(id, "project.edit");
  const body = await parseBody(req, patchSchema);
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.description !== undefined) update.description = body.description;
  if (body.sourceLanguage !== undefined) update.source_language = body.sourceLanguage;
  if (body.originalAudioVolume !== undefined) update.original_audio_volume = body.originalAudioVolume;
  if (body.targetLanguages !== undefined) {
    const caps = capabilities();
    const targets = Array.from(new Set(body.targetLanguages)).filter((t) => t !== (body.sourceLanguage ?? project.source_language));
    const bad = targets.filter((t) => !caps.targetLanguages.includes(t));
    if (bad.length) throw new ApiError(400, `Unsupported target languages: ${bad.join(", ")}.`);
    const ent = await getEntitlements(project.org_id);
    if (targets.length > ent.targetLanguagesPerProject) throw new ApiError(402, `Your plan allows ${ent.targetLanguagesPerProject} target languages per project.`);
    update.target_languages = targets;
  }
  if (Object.keys(update).length === 0) return json({ ok: true });
  const admin = createAdminClient();
  const { error } = await admin.from("projects").update(update).eq("id", id);
  if (error) throw new ApiError(500, error.message);
  await logActivity({
    orgId: project.org_id,
    userId: ctx.userId,
    projectId: id,
    action: body.name && body.name !== project.name ? "project.renamed" : "project.updated",
    details: { name: body.name ?? project.name },
  });
  return json({ ok: true });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { ctx, project } = await projectAccess(id, "project.delete");
  const prefix = `${project.org_id}/${project.id}`;
  await Promise.all([removePrefix(BUCKETS.media, prefix), removePrefix(BUCKETS.generated, prefix), removePrefix(BUCKETS.exports, prefix)]);
  const admin = createAdminClient();
  const { error } = await admin.from("projects").delete().eq("id", id);
  if (error) throw new ApiError(500, error.message);
  await logActivity({ orgId: project.org_id, userId: ctx.userId, action: "project.deleted", details: { name: project.name } });
  return json({ ok: true });
});
