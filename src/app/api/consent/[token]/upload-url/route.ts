import { bucketName } from "@/config/buckets";
import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { consentByToken } from "@/lib/consent-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_AUDIO_TYPES } from "@/config/media";

const schema = z.object({ mimeType: z.string(), sizeBytes: z.number().int().positive().max(25 * 1024 * 1024) });

/** Upload URL for the voice owner's spoken consent recording. Requires the owner's verified email session. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;
  const body = await parseBody(req, schema);
  const c = await consentByToken(token);
  if (c.status !== "pending") throw new ApiError(409, "This request has already been answered.");
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user || user.email?.toLowerCase() !== c.voice_owner_email.toLowerCase()) throw new ApiError(401, "Verify your email address first.");
  const base = body.mimeType.split(";")[0];
  if (!SAMPLE_AUDIO_TYPES.includes(base)) throw new ApiError(415, "Unsupported recording format.");
  const ext = base.includes("webm") ? "webm" : base.includes("ogg") ? "ogg" : base.includes("wav") ? "wav" : base.includes("mp4") || base.includes("m4a") ? "m4a" : "mp3";
  const path = `${c.org_id}/consents/${c.id}.${ext}`;
  const admin = createAdminClient();
  await admin.storage.from(bucketName("voice-samples")).remove([path]);
  const { data, error } = await admin.storage.from(bucketName("voice-samples")).createSignedUploadUrl(path);
  if (error || !data) throw new ApiError(500, error?.message ?? "Could not prepare upload.");
  return json({ path, signedUrl: data.signedUrl });
});
