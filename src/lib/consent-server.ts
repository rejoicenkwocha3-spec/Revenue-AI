import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/tokens";
import { ApiError } from "@/lib/api";

export async function consentByToken(token: string) {
  if (!token || token.length < 20) throw new ApiError(404, "This consent link is invalid.");
  const admin = createAdminClient();
  const { data } = await admin.from("voice_consents").select("*, organisations(name)").eq("token_hash", hashToken(token)).maybeSingle();
  if (!data) throw new ApiError(404, "This consent link is invalid or has been withdrawn.");
  return data;
}
