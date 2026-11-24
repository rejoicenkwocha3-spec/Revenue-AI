import { handle, json, ApiError, requireUser } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const ctx = await requireUser();
  const admin = createAdminClient();
  const { data: m } = await admin.from("media_files").select("*").eq("id", id).maybeSingle();
  const membership = m && ctx.memberships.find((x) => x.orgId === m.org_id);
  if (!m || !membership) throw new ApiError(404, "File not found.");
  if (!can(membership.role, "project.delete")) throw new ApiError(403, "Your role does not allow deleting media.");
  await admin.storage.from(m.bucket).remove([m.storage_path]);
  await admin.from("media_files").delete().eq("id", id);
  if (m.project_id && m.kind !== "extracted_audio") {
    await admin.from("projects").update({ status: "draft", status_detail: "Source media was deleted. Upload a new file." }).eq("id", m.project_id);
  }
  await logActivity({ orgId: m.org_id, userId: ctx.userId, projectId: m.project_id, action: "media.deleted", details: { file: m.file_name } });
  return json({ ok: true });
});
