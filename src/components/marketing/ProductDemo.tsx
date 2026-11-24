"use client";
import { useState } from "react";
import { AlertTriangle, BadgeDollarSign, CircleCheck, Layers, Sparkles, TrendingUp } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const TABS = ["Overview", "Pipeline", "Deal inspection", "Forecast"] as const;
type Tab = (typeof TABS)[number];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const ACTUAL = [310, 335, 360, 352, 398, 421, 446, null, null];
const PROJ = [null, null, null, null, null, null, 446, 482, 514];

function Kpi({ icon: Icon, label, value, note, projection }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string; note: string; projection?: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-white p-3", projection ? "border-dashed border-purple/50" : "border-line")}>
      <div className="flex items-center justify-between text-[11px] text-muted">{label}<Icon size={13} /></div>
      <p className="mt-1 font-display text-lg font-extrabold text-navy">{value}</p>
      <p className={cn("text-[10.5px]", projection ? "text-purple" : "text-muted")}>{note}</p>
    </div>
  );
}

function Overview() {
  const max = 540;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={BadgeDollarSign} label="Total revenue" value="$1.42M" note="Actual, quarter to date" />
        <Kpi icon={TrendingUp} label="Forecasted revenue" value="$1.74M" note="Projection: $1.61M to $1.88M" projection />
        <Kpi icon={Layers} label="Pipeline value" value="$4.86M" note="128 open deals" />
        <Kpi icon={CircleCheck} label="Closed won" value="37 deals" note="$1.31M booked" />
        <Kpi icon={AlertTriangle} label="Deals at risk" value="9" note="$612K exposed" />
        <Kpi icon={Sparkles} label="Win rate" value="31%" note="Up 4 points" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between"><p className="text-xs font-bold text-ink">Revenue performance</p><p className="flex gap-3 text-[10.5px] text-muted"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue" />Actual</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-purple" />Projected</span></p></div>
          <div className="mt-3 flex h-36 items-end gap-2" role="img" aria-label="Illustrative monthly revenue rising from 310 thousand to a projected 514 thousand">
            {MONTHS.map((m, i) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t" style={{ height: `${((ACTUAL[i] ?? PROJ[i] ?? 0) / max) * 100}%`, background: ACTUAL[i] != null ? "#315BDB" : "repeating-linear-gradient(135deg,#7865E9 0 4px,#9A8CF0 4px 8px)" }} />
                </div>
                <span className="text-[10px] text-muted">{m}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-white p-3">
          <p className="text-xs font-bold text-ink">AI insights</p>
          <ul className="mt-2 space-y-2 text-[11.5px]">
            <li className="rounded-lg bg-warning-50 p-2 text-[#6B3F00]"><span className="font-semibold">3 commit deals have gone quiet.</span> No activity for 18 days on $410K of commit.</li>
            <li className="rounded-lg bg-lavender p-2 text-navy"><span className="font-semibold">Projection:</span> expected case is 6% below target. Two best case deals could close the gap.</li>
            <li className="rounded-lg bg-success-50 p-2 text-[#0D5E41]"><span className="font-semibold">EMEA leads the quarter</span> with 42% of bookings.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Pipeline() {
  const cols = [
    { n: "Qualification", v: "$920K", d: [["Northwind rollout", "$84K", "ok"], ["Kestrel licences", "$41K", "watch"]] },
    { n: "Discovery", v: "$1.4M", d: [["Sable forecasting", "$145K", "ok"], ["Harbor pilot", "$18K", "risk"]] },
    { n: "Proposal", v: "$1.6M", d: [["Lumen analytics", "$210K", "risk"], ["Vantage suite", "$178K", "ok"]] },
    { n: "Negotiation", v: "$940K", d: [["Bluepeak expansion", "$126K", "ok"], ["Orbit assurance", "$92K", "watch"]] },
  ];
  const tone = { ok: "bg-success-50 text-success", watch: "bg-warning-50 text-warning", risk: "bg-danger-50 text-danger" } as const;
  const label = { ok: "Healthy", watch: "Watch", risk: "At risk" } as const;
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {cols.map((c) => (
        <div key={c.n} className="rounded-xl bg-[#EEF1F8] p-2">
          <p className="px-1 text-xs font-bold text-ink">{c.n}</p>
          <p className="px-1 text-[10.5px] text-muted">{c.v}</p>
          <div className="mt-2 space-y-2">
            {c.d.map(([name, val, h]) => (
              <div key={name} className="rounded-lg border border-line bg-white p-2">
                <p className="truncate text-[11.5px] font-semibold text-ink">{name}</p>
                <div className="mt-1 flex items-center justify-between"><span className="text-[11px] font-bold text-navy">{val}</span><span className={cn("rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold", tone[h as keyof typeof tone])}>{label[h as keyof typeof label]}</span></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Deal() {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-xl border border-line bg-white p-3">
        <div className="flex items-center justify-between"><p className="text-sm font-bold text-ink">Lumen store analytics</p><span className="rounded-full bg-danger-50 px-2 py-0.5 text-[10.5px] font-semibold text-danger">At risk · 38</span></div>
        <p className="text-[11px] text-muted">$210K · Proposal · closes in 9 days · Owner: Dana Cole</p>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">Risk factors</p>
        <ul className="mt-1 space-y-1.5 text-[11.5px]">
          <li><span className="font-semibold text-ink">Deal has gone quiet:</span> last activity 34 days ago.</li>
          <li><span className="font-semibold text-ink">Close date pushed twice:</span> moved later on two occasions.</li>
          <li><span className="font-semibold text-ink">Open objection:</span> &quot;Budget frozen until next fiscal year&quot;.</li>
        </ul>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">Missing information</p>
        <p className="text-[11.5px]">Decision maker not identified. Budget not discussed.</p>
      </div>
      <div className="rounded-xl border border-line bg-white p-3">
        <p className="text-xs font-bold text-ink">Recommended next actions</p>
        <ol className="mt-2 space-y-2 text-[11.5px]">
          <li>1. Re engage the champion with a dated next step.</li>
          <li>2. Meet the economic buyer before proposal review.</li>
          <li>3. Move from Commit to Best Case until resolved.</li>
        </ol>
        <div className="mt-3 rounded-lg bg-canvas p-2 text-[11px]"><span className="font-semibold text-ink">Deal Inspection Agent</span> proposes a follow up task. <span className="font-semibold text-blue">Awaiting manager approval.</span></div>
      </div>
    </div>
  );
}

function Forecast() {
  const rows = [["Closed won", "$1.42M", "Actual"], ["Commit", "$380K", "Open deals"], ["Best case", "$520K", "Open deals"], ["Expected case", "$1.74M", "Projection"]];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-xl border border-line bg-white p-3">
        <p className="text-xs font-bold text-ink">Q3 forecast</p>
        <dl className="mt-2 divide-y divide-line text-[12px]">{rows.map(([k, v, t]) => <div key={k} className="flex justify-between py-1.5"><dt className="text-muted">{k}</dt><dd className="font-semibold text-ink">{v} <span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[9.5px]", t === "Projection" ? "bg-lavender text-purple" : t === "Actual" ? "bg-success-50 text-success" : "bg-canvas text-muted")}>{t}</span></dd></div>)}</dl>
      </div>
      <div className="rounded-xl border border-line bg-white p-3">
        <p className="text-xs font-bold text-ink">Scenarios against the $1.85M target</p>
        <div className="mt-3 space-y-2 text-[11px]">
          {[["Worst case", 1.61], ["Expected case", 1.74], ["Best case", 1.88]].map(([k, v]) => <div key={k as string}><div className="flex justify-between"><span>{k}</span><span className="font-semibold">${v}M</span></div><div className="mt-1 h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-purple" style={{ width: `${((v as number) / 2) * 100}%` }} /></div></div>)}
        </div>
        <p className="mt-3 text-[10.5px] text-muted">Assumption: win probability from your historical stage conversion. At risk deals count at half weight.</p>
      </div>
    </div>
  );
}

/** Interactive product walkthrough with illustrative figures. */
export function ProductDemo() {
  const [tab, setTab] = useState<Tab>("Overview");
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-canvas shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2.5">
        <div className="flex items-center gap-2"><LogoMark size={20} /><span className="text-xs font-bold text-navy">Revenue AI</span></div>
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Product views">
          {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("whitespace-nowrap rounded-md px-2.5 py-1 text-[11.5px] font-semibold", tab === t ? "bg-navy text-white" : "text-muted hover:text-ink")}>{t}</button>)}
        </div>
      </div>
      <div className="p-3 sm:p-4">{tab === "Overview" ? <Overview /> : tab === "Pipeline" ? <Pipeline /> : tab === "Deal inspection" ? <Deal /> : <Forecast />}</div>
      <p className="border-t border-line bg-white px-4 py-2 text-[10.5px] text-muted">Product preview with illustrative figures. Your workspace shows only your own data.</p>
    </div>
  );
}
