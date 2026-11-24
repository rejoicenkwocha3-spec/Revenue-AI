"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Play, X } from "lucide-react";
import { api } from "@/lib/client-api";

export function ApprovalButtons({ id, action }: { id: string; action: { type: string } | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function decide(decision: "approve" | "reject") {
    setBusy(decision); setMsg(null);
    try {
      const r = await api<{ result?: string }>(`/api/agents/activities/${id}`, { body: { decision } });
      setMsg({ ok: true, text: decision === "approve" ? r.result ?? "Approved." : "Rejected." });
      router.refresh();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); }
  }
  const label = action?.type === "create_task" ? "Approve and create task" : action?.type === "update_deal" ? "Approve deal update" : action?.type === "draft_email" ? "Approve draft" : "Approve";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-primary btn-xs" disabled={!!busy} onClick={() => decide("approve")}>{busy === "approve" ? <Loader2 size={12} className="ra-spin" /> : <Check size={12} />}{label}</button>
      <button type="button" className="btn btn-outline btn-xs" disabled={!!busy} onClick={() => decide("reject")}>{busy === "reject" ? <Loader2 size={12} className="ra-spin" /> : <X size={12} />}Reject</button>
      {msg && <span className={`text-xs ${msg.ok ? "text-success" : "text-danger"}`} role="status">{msg.text}</span>}
    </div>
  );
}

export function RunAgent({ agentKey, disabled }: { agentKey: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" className="btn btn-primary btn-sm" disabled={busy || disabled} onClick={async () => {
        setBusy(true); setMsg(null);
        try { const r = await api<{ findings: number; pending: number }>(`/api/agents/${agentKey}/run`, { method: "POST" }); setMsg(`${r.findings} findings, ${r.pending} awaiting approval.`); router.refresh(); }
        catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
      }}>{busy ? <Loader2 size={14} className="ra-spin" /> : <Play size={14} />}Run now</button>
      {msg && <span className="text-xs text-muted" role="status">{msg}</span>}
    </span>
  );
}

const PERMS: { key: string; label: string; hint: string }[] = [
  { key: "can_create_tasks", label: "May propose tasks", hint: "Creates follow up tasks after approval" },
  { key: "can_suggest_deal_updates", label: "May propose deal updates", hint: "Changes such as forecast category, after approval" },
  { key: "can_draft_emails", label: "May draft emails", hint: "Drafts only. Emails are never sent automatically" },
  { key: "auto_create_tasks", label: "Create internal tasks without approval", hint: "Only tasks; deal changes always need approval" },
  { key: "use_llm", label: "Use AI to summarise findings", hint: "Requires an Anthropic API key on the server" },
];

export function AgentConfig({ agentKey, config, canConfigure, allowed }: { agentKey: string; config: Record<string, boolean>; canConfigure: boolean; allowed: boolean }) {
  const router = useRouter();
  const [state, setState] = useState(config);
  const [error, setError] = useState<string | null>(null);
  async function update(key: string, value: boolean) {
    const prev = state;
    setState((s) => ({ ...s, [key]: value })); setError(null);
    try { await api(`/api/agents/${agentKey}`, { method: "PATCH", body: { [key]: value } }); router.refresh(); }
    catch (e) { setState(prev); setError((e as Error).message); }
  }
  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2.5">
        <span className="text-sm font-semibold text-ink">{state.enabled ? "Active" : "Inactive"}</span>
        <input type="checkbox" role="switch" aria-label="Activate agent" className="h-5 w-9 accent-[#315BDB]" checked={!!state.enabled} disabled={!canConfigure || (!allowed && !state.enabled)} onChange={(e) => update("enabled", e.target.checked)} />
      </label>
      <fieldset className="space-y-2" disabled={!canConfigure}>
        <legend className="sr-only">Permissions</legend>
        {PERMS.map((p) => (
          <label key={p.key} className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#315BDB]" checked={!!state[p.key]} onChange={(e) => update(p.key, e.target.checked)} />
            <span><span className="text-ink">{p.label}</span><span className="block text-xs text-muted">{p.hint}</span></span>
          </label>
        ))}
      </fieldset>
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}

export function EmailDraft({ to, subject, body }: { to: string | null; subject: string; body: string }) {
  const [copied, setCopied] = useState(false);
  const text = `To: ${to ?? "(add recipient)"}\nSubject: ${subject}\n\n${body}`;
  return (
    <div className="mt-2 rounded-lg border border-line bg-canvas p-3 text-xs">
      <p className="font-semibold text-ink">Draft email (not sent)</p>
      <pre className="mt-1 whitespace-pre-wrap font-sans text-body">{text}</pre>
      <button type="button" className="btn btn-outline btn-xs mt-2" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); } }}><Copy size={12} />{copied ? "Copied" : "Copy draft"}</button>
    </div>
  );
}
