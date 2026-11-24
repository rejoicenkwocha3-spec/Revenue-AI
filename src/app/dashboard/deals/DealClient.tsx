"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { api } from "@/lib/client-api";

export function CommentForm({ oppId }: { oppId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form className="mt-3 space-y-2" onSubmit={async (e) => {
      e.preventDefault();
      if (!body.trim()) return setError("Write a comment first.");
      setBusy(true); setError(null);
      try { await api(`/api/opportunities/${oppId}/comments`, { body: { body } }); setBody(""); router.refresh(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
    }}>
      <label htmlFor="comment" className="sr-only">Comment</label>
      <textarea id="comment" className="input" rows={3} placeholder="Add a review note for the deal owner" value={body} onChange={(e) => setBody(e.target.value)} />
      {error && <p className="text-xs text-danger">{error}</p>}
      <button className="btn btn-primary btn-sm" disabled={busy}>{busy && <Loader2 size={14} className="ra-spin" />}Post comment</button>
    </form>
  );
}

export function StakeholderAdd({ oppId, contacts }: { oppId: string; contacts: { value: string; label: string }[] }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!contacts.length) return <p className="mt-3 text-xs text-muted">Add contacts to this deal&apos;s account to link them as stakeholders.</p>;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <label htmlFor="stakeholder" className="sr-only">Contact</label>
      <select id="stakeholder" className="input w-auto min-w-[180px] flex-1" value={id} onChange={(e) => setId(e.target.value)}>
        <option value="">Link a contact</option>
        {contacts.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <button type="button" className="btn btn-outline btn-sm" disabled={!id || busy} onClick={async () => {
        setBusy(true); setError(null);
        try { await api(`/api/opportunities/${oppId}/contacts`, { body: { contact_id: id } }); setId(""); router.refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
      }}>Add</button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </div>
  );
}

export function TaskCheck({ id, done }: { id: string; done: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" aria-label={done ? "Reopen task" : "Mark task done"} disabled={busy}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${done ? "border-success bg-success text-white" : "border-line-strong bg-white hover:border-blue"}`}
      onClick={async () => { setBusy(true); try { await api(`/api/tasks/${id}`, { method: "PATCH", body: { status: done ? "open" : "done" } }); router.refresh(); } finally { setBusy(false); } }}>
      {busy ? <Loader2 size={11} className="ra-spin" /> : done && <Check size={12} />}
    </button>
  );
}
