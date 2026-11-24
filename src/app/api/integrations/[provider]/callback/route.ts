import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProvider, type ProviderKey } from "@/lib/integrations/providers";
import { exchangeCode, storeTokens } from "@/lib/integrations/oauth";
import { runSync } from "@/lib/integrations/sync";
import { audit } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(req.url);
  const back = (q: string) => NextResponse.redirect(new URL(`/dashboard/integrations?${q}`, req.url));
  const p = getProvider(provider);
  if (!p) return back("error=Unknown%20integration");
  if (url.searchParams.get("error")) return back(`error=${encodeURIComponent(`${p.name}: ${url.searchParams.get("error_description") ?? url.searchParams.get("error")}`)}`);
  const ctx = await getAppContext();
  const admin = createAdminClient();
  const state = url.searchParams.get("state") ?? "";
  const { data: st } = await admin.from("oauth_states").select("*").eq("state", state).maybeSingle();
  await admin.from("oauth_states").delete().eq("state", state);
  if (!st || !ctx || st.user_id !== ctx.userId || st.provider !== p.key || Date.now() - new Date(st.created_at).getTime() > 15 * 60_000) {
    return back("error=The%20connection%20request%20expired%20or%20did%20not%20match.%20Try%20again.");
  }
  try {
    const tokens = await exchangeCode(p.key as ProviderKey, url.searchParams.get("code") ?? "");
    const label = tokens.incoming_webhook?.channel ? `${tokens.team?.name ?? "Slack"} ${tokens.incoming_webhook.channel}` : tokens.instance_url ?? tokens.api_domain ?? null;
    const { data: integ, error } = await admin.from("integrations").upsert({ org_id: st.org_id, provider: p.key, status: "connected", account_label: label, connected_by: ctx.userId, connected_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }, { onConflict: "org_id,provider" }).select("id").single();
    if (error) throw new Error(error.message);
    await storeTokens(integ.id, st.org_id, tokens);
    await audit({ orgId: st.org_id, userId: ctx.userId, action: "integration.connected", entityType: "integrations", entityId: integ.id, details: { provider: p.key } });
    await runSync(integ.id, "manual", ctx.userId).catch(() => null);
    return back(`connected=${p.key}`);
  } catch (err) {
    return back(`error=${encodeURIComponent(`${p.name}: ${(err as Error).message}`)}`);
  }
}
