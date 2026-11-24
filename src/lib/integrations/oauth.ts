import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env";
import { decrypt, encrypt } from "./crypto";
import { getProvider, type ProviderKey } from "./providers";

export function callbackUrl(key: ProviderKey) {
  return `${siteUrl()}/api/integrations/${key}/callback`;
}

export function authorizeUrl(key: ProviderKey, state: string): string {
  const p = getProvider(key)!;
  const u = new URL(p.authorizeUrl!);
  u.searchParams.set("client_id", process.env[p.envId!]!);
  u.searchParams.set("redirect_uri", callbackUrl(key));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("state", state);
  if (p.scopes) u.searchParams.set(key === "slack" ? "scope" : "scope", p.scopes);
  if (key === "google") { u.searchParams.set("access_type", "offline"); u.searchParams.set("prompt", "consent"); }
  return u.toString();
}

interface TokenResponse { access_token?: string; refresh_token?: string; expires_in?: number; instance_url?: string; api_domain?: string; incoming_webhook?: { url: string; channel: string }; team?: { name: string }; ok?: boolean; error?: string; error_description?: string }

async function tokenRequest(key: ProviderKey, params: Record<string, string>): Promise<TokenResponse> {
  const p = getProvider(key)!;
  const id = process.env[p.envId!]!;
  const secret = process.env[p.envSecret!]!;
  const body = new URLSearchParams(params);
  const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded", accept: "application/json" };
  if (key === "pipedrive") headers.authorization = `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
  else { body.set("client_id", id); body.set("client_secret", secret); }
  const res = await fetch(p.tokenUrl!, { method: "POST", headers, body });
  const data = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || data.error || data.ok === false) throw new Error(data.error_description || data.error || `Token request failed (${res.status})`);
  return data;
}

export async function exchangeCode(key: ProviderKey, code: string) {
  return tokenRequest(key, { grant_type: "authorization_code", code, redirect_uri: callbackUrl(key) });
}

export async function storeTokens(integrationId: string, orgId: string, t: TokenResponse) {
  const admin = createAdminClient();
  await admin.from("integration_credentials").upsert({
    integration_id: integrationId, org_id: orgId,
    access_token_enc: encrypt(t.access_token ?? null),
    refresh_token_enc: t.refresh_token ? encrypt(t.refresh_token) : undefined,
    expires_at: t.expires_in ? new Date(Date.now() + (t.expires_in - 60) * 1000).toISOString() : null,
    instance_url: t.instance_url ?? t.api_domain ?? null,
    extra: t.incoming_webhook ? { webhook_enc: encrypt(t.incoming_webhook.url), channel: t.incoming_webhook.channel } : {},
    updated_at: new Date().toISOString(),
  }, { onConflict: "integration_id" });
}

/** Returns a valid access token, refreshing it when it has expired. */
export async function accessToken(integrationId: string, key: ProviderKey): Promise<{ token: string; instanceUrl: string | null; extra: Record<string, unknown> }> {
  const admin = createAdminClient();
  const { data: cred } = await admin.from("integration_credentials").select("*").eq("integration_id", integrationId).maybeSingle();
  if (!cred) throw new Error("No stored credentials. Reconnect the integration.");
  let token = decrypt(cred.access_token_enc);
  if (cred.expires_at && new Date(cred.expires_at) < new Date()) {
    const refresh = decrypt(cred.refresh_token_enc);
    if (!refresh) throw new Error("The access token expired and no refresh token is stored. Reconnect the integration.");
    const t = await tokenRequest(key, { grant_type: "refresh_token", refresh_token: refresh });
    await storeTokens(integrationId, cred.org_id, { ...t, instance_url: t.instance_url ?? cred.instance_url ?? undefined });
    token = t.access_token ?? null;
  }
  if (!token && key !== "slack") throw new Error("No access token stored. Reconnect the integration.");
  return { token: token ?? "", instanceUrl: cred.instance_url, extra: cred.extra ?? {} };
}
