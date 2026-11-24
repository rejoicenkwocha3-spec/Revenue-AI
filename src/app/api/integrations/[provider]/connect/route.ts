import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProvider, providerConfigured, type ProviderKey } from "@/lib/integrations/providers";
import { authorizeUrl } from "@/lib/integrations/oauth";
import { assertIntegrationCapacity } from "@/lib/billing";

/** Starts the OAuth flow. The state value ties the callback to this user and organisation. */
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const back = (msg: string) => NextResponse.redirect(new URL(`/dashboard/integrations?error=${encodeURIComponent(msg)}`, req.url));
  const ctx = await getAppContext();
  if (!ctx) return NextResponse.redirect(new URL("/login", req.url));
  if (!can(ctx.role, "integration.manage")) return back("Your role does not allow connecting integrations.");
  const p = getProvider(provider);
  if (!p || p.auth !== "oauth") return back("Unknown integration.");
  if (!providerConfigured(p.key)) return back(`${p.name} is not configured on this server. Add ${p.envId} and ${p.envSecret} to the environment.`);
  try { await assertIntegrationCapacity(ctx.orgId); } catch (e) { return back((e as Error).message); }
  const state = crypto.randomBytes(24).toString("base64url");
  const admin = createAdminClient();
  await admin.from("oauth_states").delete().lt("created_at", new Date(Date.now() - 3600_000).toISOString());
  await admin.from("oauth_states").insert({ state, org_id: ctx.orgId, user_id: ctx.userId, provider: p.key });
  return NextResponse.redirect(authorizeUrl(p.key as ProviderKey, state));
}
