import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity, notify, orgMemberIds } from "@/lib/activity";
import { can } from "@/lib/permissions";

const schema = z.object({ action: z.enum(["submit", "approve", "request_changes"]), note: z.string().max(1000).optional() });

export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { action, note } = await parseBody(req, schema);
  const { ctx, project, role } = await projectAccess(id, action === "submit" ? "translation.edit" : "dub.approve");
  if (action !== "submit" && !can(role, "dub.approve")) throw new ApiError(403, "Only owners, administrators and reviewers can approve.");
  const admin = createAdminClient();
  const update =
    action === "submit"
      ? { approval_status: "in_review", approved_by: null, approved_at: null }
      : action === "approve"
        ? { approval_status: "approved", approved_by: ctx.userId, approved_at: new Date().toISOString() }
        : { approval_status: "changes_requested", approved_by: null, approved_at: null };
  await admin.from("projects").update(update).eq("id", id);
  const actionName = action === "submit" ? "approval.submitted" : action === "approve" ? "approval.approved" : "approval.changes_requested";
  await logActivity({ orgId: project.org_id, userId: ctx.userId, projectId: id, action: actionName, details: { name: project.name, note } });
  const recipients =
    action === "submit"
      ? await orgMemberIds(project.org_id, ["owner", "admin", "reviewer"])
      : await orgMemberIds(project.org_id, ["owner", "admin", "editor", "translator"]);
  await notify({
    userIds: recipients.filter((u) => u !== ctx.userId),
    orgId: project.org_id,
    title:
      action === "submit" ? `${project.name} is ready for review` : action === "approve" ? `${project.name} was approved` : `Changes requested on ${project.name}`,
    body: note,
    link: `/dashboard/projects/${id}`,
  });
  return json({ ok: true });
});
