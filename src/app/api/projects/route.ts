import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { getEntitlements } from "@/lib/billing";
import { capabilities } from "@/lib/providers";

const schema = z.object({
  name: z.string().trim().min(1, "Name the project").max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  sourceLanguage: z.string().min(2).max(5).nullable().optional(),
  targetLanguages: z.array(z.string().min(2).max(5)).max(30).default([]),
});

export const POST = handle(async (req: Request) => {
  const ctx = await requireUser("project.create");
  const body = await parseBody(req, schema);
  const caps = capabilities();
  const ent = await getEntitlements(ctx.orgId);
  const targets = Array.from(new Set(body.targetLanguages)).filter((t) => t !== body.sourceLanguage);
  const unsupported = targets.filter((t) => !caps.targetLanguages.includes(t));
  if (unsupported.length) throw new ApiError(400, `These target languages are not supported by the connected providers: ${unsupported.join(", ")}.`);
  if (body.sourceLanguage && caps.stt && !caps.stt.languages.includes(body.sourceLanguage)) {
    throw new ApiError(400, "The source language is not supported by the connected speech recognition provider.");
  }
  if (targets.length > ent.targetLanguagesPerProject) {
    throw new ApiError(402, `Your plan allows ${ent.targetLanguagesPerProject} target ${ent.targetLanguagesPerProject === 1 ? "language" : "languages"} per project.`);
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .insert({
      org_id: ctx.orgId,
      name: body.name,
      description: body.description ?? null,
      source_language: body.sourceLanguage ?? null,
      target_languages: targets,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) throw new ApiError(500, error.message);
  await logActivity({ orgId: ctx.orgId, userId: ctx.userId, projectId: data.id, action: "project.created", details: { name: body.name } });
  return json({ id: data.id }, 201);
});
