import { z } from "zod";
import { handle, json, ApiError } from "@/lib/api";
import { consentByToken } from "@/lib/consent-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logActivity, notify } from "@/lib/activity";

const schema = z.object({
  signatureName: z.string().trim().min(2).max(120),
  recordingPath: z.string().min(5),
  confirmOwner: z.literal(true),
  confirmUse: z.literal(true),
  decision: z.enum(["accept", "decline"]).default("accept"),
});

/** The voice owner signs the consent. Requires their verified email session and a spoken consent recording. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;
  const c = await consentByToken(token);
  if (c.status !== "pending") throw new ApiError(409, "This request has already been answered.");
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user || user.email?.toLowerCase() !== c.voice_owner_email.toLowerCase()) throw new ApiError(401, "Verify your email address first.");
  const raw = await req.json().catch(() => ({}));
  const admin = createAdminClient();
  if (raw?.decision === "decline") {
    await admin.from("voice_consents").update({ status: "revoked", revoked_at: new Date().toISOString(), token_hash: null }).eq("id", c.id);
    if (c.created_by) await notify({ userIds: [c.created_by], orgId: c.org_id, title: `${c.voice_owner_name} declined the voice consent request`, link: "/dashboard/voice-cloning" });
    return json({ ok: true, status: "declined" });
  }
  const body = schema.parse(raw);
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  if (norm(body.signatureName) !== norm(c.voice_owner_name)) throw new ApiError(400, `Type your full name exactly as shown: ${c.voice_owner_name}.`);
  if (!body.recordingPath.startsWith(`${c.org_id}/consents/${c.id}.`)) throw new ApiError(400, "Record the consent statement first.");
  const folder = `${c.org_id}/consents`;
  const { data: listed } = await admin.storage.from("voice-samples").list(folder, { search: c.id });
  if (!listed?.some((o) => `${folder}/${o.name}` === body.recordingPath)) throw new ApiError(400, "The consent recording did not upload. Record it again.");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await admin
    .from("voice_consents")
    .update({ status: "verified", signature_name: body.signatureName, consent_recording_path: body.recordingPath, verified_user_id: user.id, verified_at: new Date().toISOString(), verified_ip: ip })
    .eq("id", c.id);
  await logActivity({ orgId: c.org_id, userId: null, action: "consent.verified", details: { owner: c.voice_owner_name } });
  if (c.created_by) await notify({ userIds: [c.created_by], orgId: c.org_id, title: `${c.voice_owner_name} verified voice consent`, body: "You can now upload samples and create the voice.", link: "/dashboard/voice-cloning" });
  return json({ ok: true, status: "verified" });
});
