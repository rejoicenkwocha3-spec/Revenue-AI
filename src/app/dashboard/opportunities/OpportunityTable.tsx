"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { money } from "@/lib/format";
import { HealthBadge, StatusBadge } from "@/components/app/ui";
import { cn } from "@/lib/utils";

export interface OppRow { id: string; name: string; account: string; owner: string; stage: string; status: string; amount: number; probability: number; closeDate: string | null; category: string; health: string | null; score: number | null; lastActivity: string | null; overdue: boolean }
type Key = "name" | "amount" | "closeDate" | "probability" | "score" | "stage" | "owner";

/** Searchable, filterable and sortable opportunity table. */
export function OpportunityTable({ rows, currency, stages, owners, initialHealth = "" }: { rows: OppRow[]; currency: string; stages: string[]; owners: string[]; initialHealth?: string }) {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("open");
  const [health, setHealth] = useState(initialHealth);
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "amount", dir: -1 });
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows
      .filter((r) => (!s || r.name.toLowerCase().includes(s) || r.account.toLowerCase().includes(s)) && (!stage || r.stage === stage) && (!owner || r.owner === owner) && (!status || r.status === status) && (!health || r.health === health))
      .sort((a, b) => {
        const av = a[sort.key] ?? "", bv = b[sort.key] ?? "";
        return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
      });
  }, [rows, q, stage, owner, status, health, sort]);
  const total = filtered.reduce((a, r) => a + r.amount, 0);
  const th = (key: Key, label: string, right = false) => (
    <th className={right ? "text-right" : ""} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" className="inline-flex items-center gap-1 uppercase" onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))}>
        {label}{sort.key === key && (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </button>
    </th>
  );
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        <label className="relative min-w-[200px] flex-1">
          <span className="sr-only">Search opportunities</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search by deal or account" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select aria-label="Status" className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option value="open">Open</option><option value="won">Won</option><option value="lost">Lost</option></select>
        <select aria-label="Stage" className="input w-auto" value={stage} onChange={(e) => setStage(e.target.value)}><option value="">All stages</option>{stages.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Owner" className="input w-auto" value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">All owners</option>{owners.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Health" className="input w-auto" value={health} onChange={(e) => setHealth(e.target.value)}><option value="">Any health</option><option value="healthy">Healthy</option><option value="watch">Watch</option><option value="at_risk">At risk</option></select>
      </div>
      <p className="border-b border-line px-4 py-2 text-xs text-muted">{filtered.length} opportunities · <span className="font-semibold text-ink">{money(total, currency)}</span></p>
      <div className="overflow-x-auto">
        <table className="table min-w-[980px]">
          <thead><tr>{th("name", "Opportunity")}{th("stage", "Stage")}{th("owner", "Owner")}{th("amount", "Amount", true)}{th("probability", "Prob.", true)}{th("closeDate", "Close date")}<th>Category</th>{th("score", "Health")}<th>Last activity</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="max-w-[260px]"><Link href={`/dashboard/deals/${r.id}`} className="block truncate font-semibold text-ink hover:text-blue">{r.name}</Link><span className="block truncate text-xs text-muted">{r.account}</span></td>
                <td>{r.status === "open" ? r.stage : <StatusBadge status={r.status} />}</td>
                <td className="whitespace-nowrap">{r.owner}</td>
                <td className="num text-right font-semibold text-ink">{money(r.amount, currency)}</td>
                <td className="num text-right">{r.probability}%</td>
                <td className={cn("whitespace-nowrap", r.overdue && "font-semibold text-danger")}>{r.closeDate ?? "Not set"}</td>
                <td className="whitespace-nowrap capitalize">{r.category.replace("_", " ")}</td>
                <td><HealthBadge health={r.health} score={r.score} /></td>
                <td className="whitespace-nowrap text-muted">{r.lastActivity ?? "None"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-muted">No opportunities match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
