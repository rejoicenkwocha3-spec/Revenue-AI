"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, GripVertical } from "lucide-react";
import { api } from "@/lib/client-api";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HealthBadge } from "@/components/app/ui";

export interface BoardDeal { id: string; name: string; account: string; owner: string; ownerId: string | null; amount: number; closeDate: string | null; stageId: string | null; health: string | null; score: number | null; probability: number; overdue: boolean; canEdit: boolean }
export interface BoardStage { id: string; name: string; kind: string; probability: number }

/** Kanban pipeline. Drag a card, or use its stage menu, to move a deal. Changes are saved immediately. */
export function Board({ stages, deals: initial, currency }: { stages: BoardStage[]; deals: BoardDeal[]; currency: string }) {
  const router = useRouter();
  const [deals, setDeals] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const byStage = useMemo(() => new Map(stages.map((s) => [s.id, deals.filter((d) => d.stageId === s.id)])), [stages, deals]);

  async function move(id: string, stageId: string) {
    const prev = deals;
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stageId === stageId) return;
    if (!deal.canEdit) { setError("You can only move deals you own."); return; }
    setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, stageId } : d)));
    setError(null);
    try {
      await api(`/api/opportunities/${id}`, { method: "PATCH", body: { stage_id: stageId } });
      router.refresh();
    } catch (e) {
      setDeals(prev);
      setError((e as Error).message);
    }
  }

  return (
    <div>
      {error && <p role="alert" className="mb-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-[#8A1C26]">{error}</p>}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-3">
          {stages.map((s) => {
            const list = byStage.get(s.id) ?? [];
            const total = list.reduce((a, d) => a + d.amount, 0);
            return (
              <section key={s.id} aria-label={s.name}
                onDragOver={(e) => { e.preventDefault(); setOver(s.id); }}
                onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
                onDrop={(e) => { e.preventDefault(); setOver(null); if (dragging) move(dragging, s.id); setDragging(null); }}
                className={cn("flex w-[272px] flex-col rounded-xl border bg-[#EEF1F8] transition-colors", over === s.id ? "border-blue bg-blue-50" : "border-transparent")}>
                <header className="px-3 pb-2 pt-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold">{s.name}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted">{list.length}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted"><span className="font-semibold tabular-nums text-ink">{money(total, currency, true)}</span> · {s.probability}% probability</p>
                </header>
                <ul className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-3">
                  {list.map((d) => (
                    <li key={d.id} draggable={d.canEdit} onDragStart={() => setDragging(d.id)} onDragEnd={() => setDragging(null)}
                      className={cn("rounded-lg border border-line bg-white p-3 shadow-[var(--shadow-card)]", d.canEdit && "cursor-grab active:cursor-grabbing", dragging === d.id && "opacity-50")}>
                      <div className="flex items-start gap-1.5">
                        {d.canEdit && <GripVertical size={14} className="mt-0.5 shrink-0 text-[#B7BED3]" aria-hidden />}
                        <div className="min-w-0 flex-1">
                          <Link href={`/dashboard/deals/${d.id}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-blue">{d.name}</Link>
                          <p className="truncate text-xs text-muted">{d.account}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-display text-sm font-extrabold tabular-nums text-navy">{money(d.amount, currency)}</span>
                        {d.health && <HealthBadge health={d.health} score={d.score} />}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
                        <span className={cn("inline-flex items-center gap-1", d.overdue && "font-semibold text-danger")}><CalendarDays size={12} />{d.closeDate ?? "No close date"}</span>
                        <span className="truncate">{d.owner}</span>
                      </div>
                      {d.canEdit && (
                        <label className="mt-2 block">
                          <span className="sr-only">Move {d.name} to stage</span>
                          <select className="w-full rounded-md border border-line bg-canvas px-2 py-1 text-xs" value={d.stageId ?? ""} onChange={(e) => move(d.id, e.target.value)}>
                            {stages.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </select>
                        </label>
                      )}
                    </li>
                  ))}
                  {list.length === 0 && <li className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-xs text-muted">Drop deals here</li>}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
