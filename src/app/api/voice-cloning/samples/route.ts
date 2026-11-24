import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { orgAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { SAMPLE_AUDIO_TYPES } from "@/config/media";
import { safeFileName } from "@/lib/utils";

const schema = z.object({ consentId: z.string().uuid(), fileName: z.string().min(1).max(200), mimeType: z.string(), sizeBytes: z.number().int().positive().max(50 * 1024 * 1024) });

/** Signed upload URL for a voice sample. Only for verified consents. */
export const POST = handle(async (req: Request) => {
  const body = await parseBody(req, schema);
  const admin = createAdminClient();
  const { data: c } = await admin.from("voice_consents").select("id, org_id, status").eq("id", body.consentId).maybeSingle();
  if (!c) throw new ApiError(404, "Consent not found.");
  await orgAccess(c.org_id, "voice.clone");
  if (c.status !== "verified") throw new ApiError(403, "The voice owner has not verified consent yet.");
  if (!SAMPLE_AUDIO_TYPES.includes(body.mimeType)) throw new ApiError(415, "Upload MP3, WAV, M4A, OGG, WEBM or FLAC audio.");
  const path = `${c.org_id}/samples/${c.id}/${Date.now()}_${safeFileName(body.fileName)}`;
  const { data, error } = await admin.storage.from("voice-samples").createSignedUploadUrl(path);
  if (error || !data) throw new ApiError(500, error?.message ?? "Could not prepare upload.");
  return json({ path, signedUrl: data.signedUrl });
});
