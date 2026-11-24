import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { newToken } from "@/lib/tokens";
import { siteUrl } from "@/lib/env";
import { getEntitlements } from "@/lib/billing";
import { logActivity, notify } from "@/lib/activity";
import { sendEmail, escapeHtml } from "@/lib/email";
import { ROLE_LABELS } from "@/lib/permissions";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), role: z.enum(["admin", "editor", "translator", "reviewer", "viewer"]) });

export const POST = handle(async (req: Request) => {
  const ctx = await requireUser("team.manage");
  const body = await parseBody(req, schema);
  if (body.role === "admin" && ctx.role !== "owner") throw new ApiError(403, "Only the workspace owner can invite administrators.");
  const admin = createAdminClient();
  const [{ count: members }, { count: pending }, ent, { data: existingMember }] = await Promise.all([
    admin.from("organisation_members").select("user_id", { count: "exact", head: true }).eq("org_id", ctx.orgId),
    admin.from("team_invitations").select("id", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("status", "pending").gt("expires_at", new Date().toISOString()),
    getEntitlements(ctx.orgId),
    admin.from("profiles").select("id, organisation_members!inner(org_id)").eq("email", body.email).eq("organisation_members.org_id", ctx.orgId).maybeSingle(),
  ]);
  if (existingMember) throw new ApiError(409, "That person is already a member of this workspace.");
  if ((members ?? 0) + (pending ?? 0) >= ent.seats) throw new ApiError(402, `Your plan includes ${ent.seats} ${ent.seats === 1 ? "seat" : "seats"}. Upgrade to invite more people.`);

  await admin.from("team_invitations").update({ status: "revoked" }).eq("org_id", ctx.orgId).eq("email", body.email).eq("status", "pending");
  const { token, hash } = newToken();
  const { error } = await admin.from("team_invitations").insert({ org_id: ctx.orgId, email: body.email, role: body.role, token_hash: hash, invited_by: ctx.userId });
  if (error) throw new ApiError(500, error.message);
  const link = `${siteUrl()}/invite/${token}`;

  // Existing LinguaDub users get an in app notification; new users get a Supabase invitation email.
  let delivered: "notification" | "email" | "link" = "link";
  const { data: existingUser } = await admin.from("profiles").select("id").eq("email", body.email).maybeSingle();
  if (existingUser) {
    await notify({ userIds: [existingUser.id], title: `${ctx.fullName} invited you to ${ctx.orgName}`, body: `Role: ${ROLE_LABELS[body.role]}`, link: `/invite/${token}` });
    delivered = "notification";
  } else {
    const { error: invErr } = await admin.auth.admin.inviteUserByEmail(body.email, {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(`/invite/${token}`)}`,
      data: { invited_to: ctx.orgName },
    });
    if (!invErr) delivered = "email";
  }
  if (delivered !== "email") {
    const sent = await sendEmail({
      to: body.email,
      subject: `Join ${ctx.orgName} on LinguaDub`,
      html: `<p>${escapeHtml(ctx.fullName)} invited you to join ${escapeHtml(ctx.orgName)} on LinguaDub as ${ROLE_LABELS[body.role]}.</p><p><a href="${link}">Accept the invitation</a></p>`,
    });
    if (sent) delivered = "email";
  }
  await logActivity({ orgId: ctx.orgId, userId: ctx.userId, action: "team.invited", details: { email: body.email, role: ROLE_LABELS[body.role] } });
  return json({ link, delivered }, 201);
});
