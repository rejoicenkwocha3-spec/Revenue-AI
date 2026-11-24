import crypto from "node:crypto";
import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { ttsProviderById, ttsProvider } from "@/lib/providers";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadBuffer, signedUrl, BUCKETS } from "@/lib/storage";
import { EMOTIONS } from "@/config/languages";
import { can } from "@/lib/permissions";

const schema = z.object({
  provider: z.string().max(40).optional(),
  voiceId: z.string().min(1).max(120),
  language: z.string().min(2).max(5),
  text: z.string().trim().min(1).max(240),
  emotion: z.enum(EMOTIONS).optional(),
  accent: z.string().max(60).nullable().optional(),
});

/** Generates a short voice preview with the real provider. Cached per text, voice and delivery. */
export const POST = handle(async (req: Request) => {
  const ctx = await requireUser();
  if (!can(ctx.role, "translation.edit")) throw new ApiError(403, "Your role cannot generate previews.");
  const body = await parseBody(req, schema);
  const provider = (body.provider && ttsProviderById(body.provider)) || ttsProvider();
  if (!provider) throw new ApiError(400, "Voice generation is not configured on the server.");
  if (!provider.languages.includes(body.language)) throw new ApiError(400, `${provider.name} cannot speak this language.`);
  const admin = createAdminClient();
  const { data: clone } = await admin.from("voice_profiles").select("org_id, status").eq("provider_voice_id", body.voiceId).eq("is_cloned", true).maybeSingle();
  if (clone && (clone.org_id !== ctx.orgId || clone.status !== "active")) throw new ApiError(403, "That cloned voice is not available in this workspace.");

  const hash = crypto.createHash("sha256").update(JSON.stringify([provider.id, body.voiceId, body.language, body.text, body.emotion ?? "neutral", body.accent ?? ""])).digest("hex").slice(0, 32);
  const objectPath = `${ctx.orgId}/previews/${hash}.mp3`;
  const { data: existing } = await admin.storage.from(BUCKETS.generated).list(`${ctx.orgId}/previews`, { search: `${hash}.mp3`, limit: 1 });
  if (!existing?.length) {
    const audio = await provider.synthesize({ text: body.text, voiceId: body.voiceId, language: body.language, emotion: body.emotion, accent: body.accent });
    await uploadBuffer(BUCKETS.generated, objectPath, audio, "audio/mpeg");
  }
  return json({ url: await signedUrl(BUCKETS.generated, objectPath, 600) });
});
