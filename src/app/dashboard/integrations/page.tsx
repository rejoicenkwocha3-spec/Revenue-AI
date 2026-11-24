import { pageData } from "@/lib/page";
import { PROVIDERS, providerConfigured } from "@/lib/integrations/providers";
import { callbackUrl } from "@/lib/integrations/oauth";
import { can } from "@/lib/permissions";
import { getEntitlements } from "@/lib/billing";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, Card, StatusBadge, Notice, Badge } from "@/components/app/ui";
import { ActionButton } from "@/components/app/forms";
import { SyncButton, AutoSyncToggle, StageMapping, BiToken } from "./IntegrationClient";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ error?: string; connected?: string }> }) {
  const sp = await searchParams;
  const { ctx, data, supabase } = await pageData();
  const manage = can(ctx.role, "integration.manage");
  const ent = await getEntitlements(ctx.orgId);
  const [{ data: integrations }, { data: runs }] = await Promise.all([
    supabase.from("integrations").select("*").eq("org_id", ctx.orgId),
    supabase.from("integration_sync_runs").select("*").eq("org_id", ctx.orgId).order("started_at", { ascending: false }).limit(60),
  ]);
  const connectedCount = (integrations ?? []).filter((i) => i.status === "connected").length;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Integrations" description="Connect your CRM, calendar, messaging and BI tools. Connections use OAuth, tokens are encrypted on the server, and an integration only shows as connected once authorised." />
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.connected && <Notice tone="success">Connected. The first sync has run; see sync history below.</Notice>}
      <p className="text-sm text-muted">{connectedCount} connected · {ent.maxIntegrations == null ? "unlimited" : ent.maxIntegrations} allowed on the {ent.planName} plan</p>
      <div className="grid gap-5 lg:grid-cols-2">
        {PROVIDERS.map((p) => {
          const integ = (integrations ?? []).find((i) => i.provider === p.key);
          const status = integ?.status ?? "disconnected";
          const configured = providerConfigured(p.key);
          const history = (runs ?? []).filter((r) => r.integration_id === integ?.id).slice(0, 5);
          const unmapped = history.flatMap((r) => ((r.errors ?? []) as string[]).filter((e) => e.startsWith("Stages without a mapping")).flatMap((e) => e.split(": ")[1]?.split(". ")[0]?.split(", ") ?? []));
          return (
            <Card key={p.key} title={p.name} description={`${p.category} · ${p.syncs.join(", ")}`} actions={<StatusBadge status={configured || status === "connected" ? status : "disconnected"} label={!configured && status !== "connected" ? "Not configured" : undefined} />}>
              <p className="text-sm text-body">{p.description}</p>
              {integ?.account_label && status !== "disconnected" && <p className="mt-2 text-xs text-muted">Account: {integ.account_label}</p>}
              {integ?.last_synced_at && <p className="text-xs text-muted">Last sync {formatDateTime(integ.last_synced_at)}</p>}
              {integ?.last_error && status !== "disconnected" && <p className="mt-2 rounded-lg bg-danger-50 px-3 py-2 text-xs text-[#8A1C26]">{integ.last_error}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {p.key === "bi" ? (manage ? <BiToken /> : null) : status === "connected" || status === "error" ? (
                  manage && <><SyncButton provider={p.key} /><ActionButton endpoint={`/api/integrations/${p.key}`} method="DELETE" label="Disconnect" confirm="Disconnect and delete stored tokens?" className="btn btn-ghost btn-sm" /></>
                ) : configured ? (
                  manage ? <a href={`/api/integrations/${p.key}/connect`} className="btn btn-primary btn-sm">Connect {p.name}</a> : <span className="text-xs text-muted">An administrator or revenue operations member can connect this.</span>
                ) : (
                  <div className="text-xs text-muted"><p>{p.docs}</p><p className="mt-1">Set <code className="rounded bg-canvas px-1">{p.envId}</code> and <code className="rounded bg-canvas px-1">{p.envSecret}</code> on the server. Callback URL: <code className="break-all rounded bg-canvas px-1">{callbackUrl(p.key)}</code></p></div>
                )}
                {p.key === "bi" && status === "connected" && manage && <ActionButton endpoint="/api/integrations/bi" method="DELETE" label="Revoke token" confirm="Revoke the BI token?" className="btn btn-ghost btn-sm" />}
              </div>
              {status === "connected" && manage && ["salesforce", "hubspot", "pipedrive", "google", "microsoft"].includes(p.key) && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <AutoSyncToggle provider={p.key} value={integ!.auto_sync} hours={integ!.sync_interval_hours} />
                  {["salesforce", "hubspot", "pipedrive"].includes(p.key) && <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Data mapping: stages</p><StageMapping provider={p.key} unmapped={[...new Set(unmapped)]} stages={data.stages.filter((s) => s.kind === "open").map((s) => ({ id: s.id, name: s.name }))} current={(integ!.field_mapping?.stages ?? {}) as Record<string, string>} /></div>}
                </div>
              )}
              {history.length > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Sync history</p>
                  <ul className="space-y-1.5 text-xs">{history.map((r) => <li key={r.id}><span className="flex flex-wrap items-center gap-2"><Badge tone={r.status === "succeeded" ? "opportunity" : r.status === "failed" ? "high" : "warning"}>{r.status}</Badge><span className="text-muted">{formatDateTime(r.started_at)} · {r.trigger} · {r.records_created} created, {r.records_updated} updated</span></span>{(r.errors as string[]).length > 0 && <span className="mt-0.5 block text-danger">{(r.errors as string[]).join(" ")}</span>}</li>)}</ul>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
