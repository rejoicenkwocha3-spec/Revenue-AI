import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashToken } from "@/lib/tokens";
import { logActivity, notify } from "@/lib/activity";

export const POST = handle(async (req: Request) => {
  const { token } = await parseBody(req, z.object({ token: z.string().min(20) }));
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) throw new ApiError(401, "Sign in to accept the invitation.");
  const admin = createAdminClient();
  const { data: inv } = await admin.from("team_invitations").select("*").eq("token_hash", hashToken(token)).maybeSingle();
  if (!inv || inv.status !== "pending") throw new ApiError(404, "This invitation is no longer valid.");
  if (new Date(inv.expires_at) < new Date()) {
    await admin.from("team_invitations").update({ status: "expired" }).eq("id", inv.id);
    throw new ApiError(410, "This invitation has expired. Ask for a new one.");
  }
  if (user.email?.toLowerCase() !== inv.email.toLowerCase()) throw new ApiError(403, `This invitation is for ${inv.email}. Sign in with that address.`);
  const { error } = await admin.from("organisation_members").upsert({ org_id: inv.org_id, user_id: user.id, role: inv.role }, { onConflict: "org_id,user_id" });
  if (error) throw new ApiError(500, error.message);
  await admin.from("team_invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", inv.id);
  await admin.from("profiles").update({ default_org_id: inv.org_id }).eq("id", user.id);
  await logActivity({ orgId: inv.org_id, userId: user.id, action: "team.joined" });
  if (inv.invited_by) await notify({ userIds: [inv.invited_by], orgId: inv.org_id, title: `${user.email} joined your workspace` });
  return json({ ok: true });
});
