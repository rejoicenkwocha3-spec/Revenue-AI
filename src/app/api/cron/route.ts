import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runSync } from "@/lib/integrations/sync";
import { runAgent } from "@/lib/agents/run";
import { secretMatches } from "@/lib/selar";
import type { AgentKey } from "@/config/plans";

export const maxDuration = 300;

/**
 * Scheduled work: automatic integration syncs that are due and a daily run of every active agent.
 * Call with `Authorization: Bearer CRON_SECRET` (Vercel Cron sends this automatically).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || !secretMatches(provided, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const results: Record<string, unknown>[] = [];
  const { data: integrations } = await admin.from("integrations").select("id, provider, last_synced_at, sync_interval_hours").eq("status", "connected").eq("auto_sync", true);
  for (const i of integrations ?? []) {
    const due = !i.last_synced_at || Date.now() - new Date(i.last_synced_at).getTime() >= i.sync_interval_hours * 3600_000;
    if (!due || i.provider === "bi") continue;
    results.push({ integration: i.id, ...(await runSync(i.id, "automatic", null).catch((e) => ({ error: (e as Error).message }))) });
  }
  const { data: agents } = await admin.from("ai_agent_configs").select("org_id, agent_key, last_run_at").eq("enabled", true);
  for (const a of agents ?? []) {
    if (a.last_run_at && Date.now() - new Date(a.last_run_at).getTime() < 20 * 3600_000) continue;
    results.push({ agent: a.agent_key, org: a.org_id, ...(await runAgent({ orgId: a.org_id, agent: a.agent_key as AgentKey, reader: admin, userId: null, trigger: "scheduled" }).catch((e) => ({ error: (e as Error).message }))) });
  }
  return NextResponse.json({ ok: true, results });
}
