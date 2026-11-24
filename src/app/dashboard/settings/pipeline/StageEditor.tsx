"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";

type S = { id?: string; name: string; probability: number; kind: "open" | "won" | "lost"; expected_days: number; deals?: number };

export function StageEditor({ initial, canEdit }: { initial: S[]; canEdit: boolean }) {
  const router = useRouter();
  const [stages, setStages] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (i: number, patch: Partial<S>) => setStages((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => setStages((s) => { const n = [...s]; const t = n[i + d]; if (!t) return s; n[i + d] = n[i]; n[i] = t; return n; });
  return (
    <div className="card p-5">
      <div className="overflow-x-auto">
        <table className="table min-w-[720px]">
          <thead><tr><th>Order</th><th>Stage name</th><th>Type</th><th>Probability %</th><th>Expected days</th><th>Deals</th><th /></tr></thead>
          <tbody>{stages.map((s, i) => (
            <tr key={s.id ?? `new-${i}`}>
              <td><div className="flex gap-1"><button type="button" aria-label="Move up" className="btn btn-ghost btn-xs" disabled={!canEdit || i === 0} onClick={() => move(i, -1)}><ArrowUp size={12} /></button><button type="button" aria-label="Move down" className="btn btn-ghost btn-xs" disabled={!canEdit || i === stages.length - 1} onClick={() => move(i, 1)}><ArrowDown size={12} /></button></div></td>
              <td><input aria-label="Stage name" className="input" value={s.name} disabled={!canEdit} onChange={(e) => set(i, { name: e.target.value })} /></td>
              <td><select aria-label="Stage type" className="input" value={s.kind} disabled={!canEdit} onChange={(e) => set(i, { kind: e.target.value as S["kind"] })}><option value="open">Open</option><option value="won">Won</option><option value="lost">Lost</option></select></td>
              <td><input aria-label="Probability" type="number" min={0} max={100} className="input w-24" value={s.probability} disabled={!canEdit} onChange={(e) => set(i, { probability: Number(e.target.value) })} /></td>
              <td><input aria-label="Expected days" type="number" min={1} className="input w-24" value={s.expected_days} disabled={!canEdit} onChange={(e) => set(i, { expected_days: Number(e.target.value) })} /></td>
              <td className="num">{s.deals ?? 0}</td>
              <td>{canEdit && <button type="button" aria-label="Remove stage" className="btn btn-ghost btn-xs" disabled={(s.deals ?? 0) > 0} title={(s.deals ?? 0) > 0 ? "Move its deals first" : "Remove"} onClick={() => setStages((x) => x.filter((_, j) => j !== i))}><Trash2 size={13} /></button>}</td>
            </tr>))}</tbody>
        </table>
      </div>
      {canEdit && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setStages((s) => { const idx = s.findIndex((x) => x.kind !== "open"); const n = [...s]; n.splice(idx < 0 ? n.length : idx, 0, { name: "New stage", probability: 50, kind: "open", expected_days: 14 }); return n; })}><Plus size={14} />Add stage</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={async () => {
            setBusy(true); setMsg(null);
            try { await api("/api/stages", { method: "PUT", body: { stages: stages.map(({ id, name, probability, kind, expected_days }) => ({ id, name, probability, kind, expected_days })) } }); setMsg({ ok: true, text: "Pipeline stages saved." }); router.refresh(); }
            catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
          }}>{busy && <Loader2 size={14} className="ra-spin" />}Save stages</button>
          {msg && <span className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</span>}
        </div>
      )}
    </div>
  );
}
