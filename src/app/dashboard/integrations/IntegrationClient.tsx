"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/client-api";

export function SyncButton({ provider }: { provider: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={async () => {
        setBusy(true); setMsg(null);
        try { const r = await api<{ status: string; created: number; updated: number }>(`/api/integrations/${provider}/sync`, { method: "POST" }); setMsg(`Sync ${r.status}: ${r.created} created, ${r.updated} updated.`); router.refresh(); }
        catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
      }}>{busy ? <Loader2 size={14} className="ra-spin" /> : <RefreshCw size={14} />}Sync now</button>
      {msg && <span className="text-xs text-muted" role="status">{msg}</span>}
    </span>
  );
}

export function AutoSyncToggle({ provider, value, hours }: { provider: string; value: boolean; hours: number }) {
  const router = useRouter();
  const [on, setOn] = useState(value);
  const [h, setH] = useState(hours);
  async function save(next: { auto_sync?: boolean; sync_interval_hours?: number }) {
    await api(`/api/integrations/${provider}`, { method: "PATCH", body: next });
    router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="inline-flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[#315BDB]" checked={on} onChange={(e) => { setOn(e.target.checked); save({ auto_sync: e.target.checked }); }} />Automatic sync every</label>
      <select aria-label="Sync interval" className="input w-auto py-1" value={h} onChange={(e) => { setH(Number(e.target.value)); save({ sync_interval_hours: Number(e.target.value) }); }}>{[6, 12, 24, 48, 168].map((x) => <option key={x} value={x}>{x === 168 ? "week" : `${x} hours`}</option>)}</select>
    </div>
  );
}

export function StageMapping({ provider, unmapped, stages, current }: { provider: string; unmapped: string[]; stages: { id: string; name: string }[]; current: Record<string, string> }) {
  const router = useRouter();
  const [map, setMap] = useState(current);
  const [busy, setBusy] = useState(false);
  const names = [...new Set([...Object.keys(current), ...unmapped])];
  if (!names.length) return <p className="text-xs text-muted">Stages are matched by name automatically. Unmatched stage names appear here after a sync so you can map them.</p>;
  return (
    <div className="space-y-2">
      {names.map((n) => <label key={n} className="flex items-center justify-between gap-3 text-sm"><span className="text-ink">{n}</span><select className="input w-48 py-1" value={map[n] ?? ""} onChange={(e) => setMap((m) => ({ ...m, [n]: e.target.value }))}><option value="">First open stage</option>{stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>)}
      <button type="button" className="btn btn-outline btn-xs" disabled={busy} onClick={async () => { setBusy(true); try { await api(`/api/integrations/${provider}`, { method: "PATCH", body: { field_mapping: { stages: Object.fromEntries(Object.entries(map).filter(([, v]) => v)) } } }); router.refresh(); } finally { setBusy(false); } }}>Save mapping</button>
    </div>
  );
}

export function BiToken() {
  const router = useRouter();
  const [res, setRes] = useState<{ token: string; endpoint: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={async () => { setBusy(true); setErr(null); try { setRes(await api("/api/organisation/api-token", { method: "POST" })); router.refresh(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } }}>{busy && <Loader2 size={14} className="ra-spin" />}Generate access token</button>
      {err && <p className="text-xs text-danger">{err}</p>}
      {res && (
        <div className="rounded-lg bg-canvas p-3 text-xs">
          <p className="font-semibold text-ink">Copy this token now. It is shown only once and replaces any previous token.</p>
          <div className="mt-2 flex gap-2"><input readOnly aria-label="Access token" className="input py-1 font-mono text-xs" value={res.token} onFocus={(e) => e.target.select()} /><button type="button" className="btn btn-outline btn-xs" onClick={() => navigator.clipboard.writeText(res.token).catch(() => undefined)}><Copy size={12} />Copy</button></div>
          <p className="mt-2 font-mono text-muted">GET {res.endpoint}<br />Authorization: Bearer {"<token>"}</p>
        </div>
      )}
    </div>
  );
}
