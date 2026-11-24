import { handle, json, ApiError } from "@/lib/api";
import { orgAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { newToken } from "@/lib/tokens";
import { siteUrl } from "@/lib/env";

/** Issues a fresh consent link for a pending request (the previous link stops working). */
export const POST = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: c } = await admin.from("voice_consents").select("id, org_id, status").eq("id", id).maybeSingle();
  if (!c) throw new ApiError(404, "Consent not found.");
  await orgAccess(c.org_id, "voice.clone");
  if (c.status !== "pending") throw new ApiError(409, "Only pending requests need a link.");
  const { token, hash } = newToken();
  await admin.from("voice_consents").update({ token_hash: hash }).eq("id", id);
  return json({ link: `${siteUrl()}/consent/${token}` });
});
