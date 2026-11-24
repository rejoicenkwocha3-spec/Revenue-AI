import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { ACCEPTED_MEDIA } from "@/config/media";

const schema = z.object({
  projectId: z.string().uuid(),
  path: z.string().min(10),
  fileName: z.string().min(1).max(255),
  mimeType: z.string(),
  durationSeconds: z.number().positive().max(60 * 60 * 6).nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

/** Registers an uploaded file after verifying the object exists in storage with the expected prefix. */
export const POST = handle(async (req: Request) => {
  const body = await parseBody(req, schema);
  const { ctx, project } = await projectAccess(body.projectId, "media.upload");
  if (!body.path.startsWith(`${project.org_id}/${project.id}/original/`)) throw new ApiError(400, "Invalid upload path.");
  const kind = ACCEPTED_MEDIA[body.mimeType];
  if (!kind) throw new ApiError(415, "Unsupported media type.");

  const admin = createAdminClient();
  const folder = body.path.slice(0, body.path.lastIndexOf("/"));
  const name = body.path.slice(body.path.lastIndexOf("/") + 1);
  const { data: listed } = await admin.storage.from("media").list(folder, { search: name, limit: 5 });
  const obj = listed?.find((o) => o.name === name);
  if (!obj) throw new ApiError(400, "The upload did not finish. Try again.");
  const size = Number((obj.metadata as { size?: number } | null)?.size ?? 0);

  // One source file per project: replace any earlier upload.
  const { data: previous } = await admin.from("media_files").select("id, storage_path, bucket").eq("project_id", project.id).in("kind", ["video", "audio"]);
  if (previous?.length) {
    await admin.storage.from("media").remove(previous.map((p) => p.storage_path));
    await admin.from("media_files").delete().in("id", previous.map((p) => p.id));
  }
  const { data, error } = await admin
    .from("media_files")
    .insert({
      org_id: project.org_id,
      project_id: project.id,
      kind,
      bucket: "media",
      storage_path: body.path,
      file_name: body.fileName,
      mime_type: body.mimeType,
      size_bytes: size,
      duration_seconds: body.durationSeconds ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) throw new ApiError(500, error.message);
  await admin.from("projects").update({ media_kind: kind, duration_seconds: body.durationSeconds ?? null }).eq("id", project.id);
  await logActivity({ orgId: project.org_id, userId: ctx.userId, projectId: project.id, action: "media.uploaded", details: { file: body.fileName } });
  return json({ id: data.id, kind });
});
