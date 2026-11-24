import { handle, json, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const ctx = await requireUser("team.manage");
  const admin = createAdminClient();
  const { data } = await admin.from("team_invitations").select("org_id").eq("id", id).maybeSingle();
  if (!data || data.org_id !== ctx.orgId) throw new ApiError(404, "Invitation not found.");
  await admin.from("team_invitations").update({ status: "revoked" }).eq("id", id);
  return json({ ok: true });
});
