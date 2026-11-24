import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertStorageAvailable } from "@/lib/billing";
import { safeFileName } from "@/lib/utils";
import { ACCEPTED_MEDIA, MAX_UPLOAD_BYTES } from "@/config/media";

const schema = z.object({
  projectId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive(),
});

/** Validates an upload and returns a one time signed URL for a direct browser upload to private storage. */
export const POST = handle(async (req: Request) => {
  const body = await parseBody(req, schema);
  const { project } = await projectAccess(body.projectId, "media.upload");
  const kind = ACCEPTED_MEDIA[body.mimeType];
  if (!kind) throw new ApiError(415, "Upload an MP4, MOV, WEBM or MKV video, or an MP3, WAV, M4A, AAC, OGG or FLAC audio file.");
  if (body.sizeBytes > MAX_UPLOAD_BYTES) throw new ApiError(413, `Files can be up to ${Math.round(MAX_UPLOAD_BYTES / 1024 ** 3)} GB.`);
  await assertStorageAvailable(project.org_id, body.sizeBytes);
  const objectPath = `${project.org_id}/${project.id}/original/${Date.now()}_${safeFileName(body.fileName)}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("media").createSignedUploadUrl(objectPath);
  if (error || !data) throw new ApiError(500, `Could not prepare the upload: ${error?.message}`);
  return json({ path: objectPath, token: data.token, signedUrl: data.signedUrl, kind });
});
