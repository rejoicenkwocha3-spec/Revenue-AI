"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";

/** Saves the manager's forecast call and snapshots the computed numbers. */
export function ForecastForm({ periodType, periodStart, expected }: { periodType: string; periodStart: string; expected: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(Math.round(expected)));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save(submit: boolean) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) return setMsg({ ok: false, text: "Enter a forecast amount of 0 or more." });
    setBusy(submit ? "submit" : "save"); setMsg(null);
    try {
      await api("/api/forecasts", { body: { period_type: periodType, period_start: periodStart, submitted_amount: n, notes, submit } });
      setMsg({ ok: true, text: submit ? "Forecast submitted and snapshot saved." : "Draft saved and snapshot recorded." });
      router.refresh();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); }
  }
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="fc-amount" className="label">Your forecast call</label>
        <input id="fc-amount" type="number" min={0} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <p className="mt-1 text-xs text-muted">Prefilled with the expected case. Adjust it to your judgement.</p>
      </div>
      <div>
        <label htmlFor="fc-notes" className="label">Notes and assumptions</label>
        <textarea id="fc-notes" rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key deals, risks and what would change the call" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => save(true)}>{busy === "submit" && <Loader2 size={14} className="ra-spin" />}Submit forecast</button>
        <button type="button" className="btn btn-outline btn-sm" disabled={!!busy} onClick={() => save(false)}>{busy === "save" && <Loader2 size={14} className="ra-spin" />}Save draft</button>
      </div>
      {msg && <p className={`text-xs ${msg.ok ? "text-success" : "text-danger"}`} role="status">{msg.text}</p>}
    </div>
  );
}
