import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { newToken } from "@/lib/tokens";
import { consentStatement } from "@/lib/consent";
import { siteUrl } from "@/lib/env";
import { sendEmail, escapeHtml } from "@/lib/email";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  ownerName: z.string().trim().min(2).max(120),
  ownerEmail: z.string().trim().toLowerCase().email(),
  commercialUse: z.boolean(),
});

/** Creates a consent request. The voice owner must verify their email and sign before any clone is made. */
export const POST = handle(async (req: Request) => {
  const ctx = await requireUser("voice.clone");
  const body = await parseBody(req, schema);
  const isSelf = body.ownerEmail === ctx.email.toLowerCase();
  const { token, hash } = newToken();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("voice_consents")
    .insert({
      org_id: ctx.orgId,
      voice_owner_name: body.ownerName,
      voice_owner_email: body.ownerEmail,
      is_self: isSelf,
      commercial_use: body.commercialUse,
      consent_statement: consentStatement({ ownerName: body.ownerName, orgName: ctx.orgName, commercialUse: body.commercialUse }),
      token_hash: hash,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) throw new ApiError(500, error.message);
  const link = `${siteUrl()}/consent/${token}`;
  let emailed = false;
  if (!isSelf) {
    emailed = await sendEmail({
      to: body.ownerEmail,
      subject: `${ctx.orgName} is asking for permission to use your voice`,
      html: `<p>Hello ${escapeHtml(body.ownerName)},</p><p>${escapeHtml(ctx.fullName)} at ${escapeHtml(ctx.orgName)} would like to create an AI replica of your voice on LinguaDub. Nothing happens unless you agree.</p><p><a href="${link}">Review the request</a></p><p>If you did not expect this, ignore this email.</p>`,
    });
  }
  await logActivity({ orgId: ctx.orgId, userId: ctx.userId, action: "consent.requested", details: { owner: body.ownerName } });
  return json({ id: data.id, link, emailed, isSelf }, 201);
});
