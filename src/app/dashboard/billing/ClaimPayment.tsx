"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";

export function ClaimPayment() {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <section className="card mt-5 p-6">
      <h2 className="text-lg font-bold">Paid before creating your account?</h2>
      <p className="mt-1 text-sm text-muted">Enter the Selar order reference from your receipt. It links only when the payment email matches your account and Selar has confirmed the payment.</p>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setMsg(null);
        try { await api("/api/billing/claim", { body: { reference: ref } }); setMsg({ ok: true, text: "Payment linked. Your plan is active." }); router.refresh(); }
        catch (err) { setMsg({ ok: false, text: (err as Error).message }); } finally { setBusy(false); }
      }}>
        <label htmlFor="ref" className="sr-only">Order reference</label>
        <input id="ref" className="input max-w-sm" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Order reference" required />
        <button type="submit" className="btn btn-outline" disabled={busy}>Link payment</button>
      </form>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
    </section>
  );
}
