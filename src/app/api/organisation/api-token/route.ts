import { handle, json, requireUser } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { newToken } from "@/lib/tokens";
import { audit } from "@/lib/audit";
import { siteUrl } from "@/lib/env";

/** Issues a read only metrics token for BI tools. Only its hash is stored; the token is shown once. */
export const POST = handle(async () => {
  const ctx = await requireUser("integration.manage");
  const { token, hash } = newToken();
  const admin = createAdminClient();
  await admin.from("organisations").update({ api_token_hash: hash }).eq("id", ctx.orgId);
  await admin.from("integrations").upsert({ org_id: ctx.orgId, provider: "bi", status: "connected", account_label: "Metrics API token", connected_by: ctx.userId, connected_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "org_id,provider" });
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "integration.bi_token_issued" });
  return json({ token: `rai_${token}`, endpoint: `${siteUrl()}/api/bi/metrics` }, 201);
});
