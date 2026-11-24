"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, Copy, Loader2, Trash2, Play, Pause, UploadCloud, Fingerprint, Link2, X } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { uploadToSignedUrl } from "@/lib/upload";
import { Modal } from "@/components/app/Modal";
import { Notice } from "@/components/app/ui";
import { formatDate, cn } from "@/lib/utils";
import { useVoicePreview } from "../projects/[id]/VoicePicker";
import { SAMPLE_AUDIO_TYPES } from "@/config/media";
import { VOICE_STYLES } from "@/config/languages";

interface Consent { id: string; voice_owner_name: string; voice_owner_email: string; is_self: boolean; commercial_use: boolean; status: string; verified_at: string | null; created_at: string }
interface Voice { id: string; name: string; provider: string; provider_voice_id: string; accent: string | null; gender: string | null; style: string | null; consent_id: string | null; created_at: string; sample_count: number }

export function VoiceCloningClient({ consents, voices, canClone, limit, selfEmail, selfName }: { consents: Consent[]; voices: Voice[]; canClone: boolean; limit: number; selfEmail: string; selfName: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ ownerName: selfName, ownerEmail: selfEmail, commercialUse: true });
  const [link, setLink] = useState<{ link: string; emailed: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cloneFor, setCloneFor] = useState<Consent | null>(null);
  const [del, setDel] = useState<Voice | null>(null);
  const [revoke, setRevoke] = useState<Consent | null>(null);
  const preview = useVoicePreview();

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key); setError(null);
    try { await fn(); router.refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }
  const usedConsents = new Set(voices.map((v) => v.consent_id));

  return (
    <div className="space-y-5">
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <section className="card p-6">
          <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-purple" /><h2 className="text-lg font-bold">Request consent</h2></div>
          <p className="mt-1.5 text-sm text-muted">The voice owner verifies their email, records the consent statement and signs. Cloning unlocks only after that.</p>
          <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); run("consent", async () => { const r = await api<{ link: string; emailed: boolean }>("/api/voice-cloning/consents", { body: form }); setLink(r); }); }}>
            <div>
              <label htmlFor="on" className="label">Voice owner full name</label>
              <input id="on" className="input" required minLength={2} value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </div>
            <div>
              <label htmlFor="oe" className="label">Voice owner email</label>
              <input id="oe" type="email" className="input" required value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
              <p className="mt-1 text-xs text-muted">Use your own email to clone your own voice.</p>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.commercialUse} onChange={(e) => setForm({ ...form, commercialUse: e.target.checked })} /> Request permission for commercial use</label>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!canClone || busy === "consent"}>{busy === "consent" && <Loader2 size={14} className="ld-spin" />} Create consent request</button>
          </form>
          {link && (
            <div className="mt-4 rounded-xl bg-lavender p-4 text-sm text-navy">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{link.emailed ? "We emailed the voice owner. You can also share this link:" : "Send this private link to the voice owner:"}</p>
                <button type="button" onClick={() => setLink(null)} aria-label="Dismiss"><X size={15} /></button>
              </div>
              <div className="mt-2 flex gap-2">
                <input readOnly aria-label="Consent link" className="input py-1.5 text-xs" value={link.link} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(link.link).catch(() => undefined)}><Copy size={13} /> Copy</button>
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="border-b border-line px-6 py-4 text-lg font-bold">Consent records</h2>
          {!consents.length ? <p className="px-6 py-6 text-sm text-muted">No consent requests yet.</p> : (
            <ul className="divide-y divide-line">
              {consents.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">{c.voice_owner_name}{c.is_self ? " (you)" : ""}</p>
                    <p className="text-xs text-muted">{c.voice_owner_email} · {c.commercial_use ? "Commercial use" : "Non commercial"} · {c.status === "verified" ? `verified ${formatDate(c.verified_at)}` : `requested ${formatDate(c.created_at)}`}</p>
                  </div>
                  <span className={cn("chip", c.status === "verified" ? "bg-[#F0FDF4] text-success" : c.status === "pending" ? "bg-[#FFF7ED] text-warning" : "bg-canvas text-muted")}>{c.status === "verified" ? "Verified" : c.status === "pending" ? "Awaiting owner" : "Revoked"}</span>
                  {c.status === "pending" && canClone && (
                    <button type="button" className="btn btn-ghost btn-sm" disabled={busy === c.id} onClick={() => run(c.id, async () => setLink({ ...(await api<{ link: string }>(`/api/voice-cloning/consents/${c.id}/link`, { method: "POST" })), emailed: false }))}><Link2 size={13} /> New link</button>
                  )}
                  {c.status === "verified" && canClone && !usedConsents.has(c.id) && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setCloneFor(c)}><Fingerprint size={13} /> Create voice</button>
                  )}
                  {c.status !== "revoked" && canClone && <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => setRevoke(c)}>Revoke</button>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-bold">Cloned voices</h2>
          <span className="text-sm text-muted tabular-nums">{voices.length} of {limit} on your plan</span>
        </div>
        {!voices.length ? <p className="px-6 py-6 text-sm text-muted">Cloned voices appear here and in the voice picker of every project.</p> : (
          <ul className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            {voices.map((v) => {
              const key = `${v.provider}:${v.provider_voice_id}:`;
              return (
                <li key={v.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral" aria-label={`Preview ${v.name}`}
                    onClick={() => preview.toggle({ provider: v.provider, voiceId: v.provider_voice_id, name: v.name, accent: v.accent, gender: v.gender, age: null, style: v.style, description: null, languages: [], previewUrl: null, category: "cloned" }, "en")}>
                    {preview.loading === key ? <Loader2 size={16} className="ld-spin" /> : preview.playing === key ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy">{v.name}</p>
                    <p className="truncate text-xs text-muted">{[v.accent, v.gender, v.style].filter(Boolean).join(" · ") || "Cloned voice"} · {v.sample_count} samples</p>
                  </div>
                  {canClone && <button type="button" className="rounded-lg p-2 text-muted hover:bg-[#FEF2F2] hover:text-danger" aria-label={`Delete ${v.name}`} onClick={() => setDel(v)}><Trash2 size={15} /></button>}
                </li>
              );
            })}
          </ul>
        )}
        {preview.error && <p className="px-6 pb-4 text-sm text-danger">{preview.error}</p>}
      </section>

      {cloneFor && <CloneModal consent={cloneFor} onClose={() => setCloneFor(null)} onDone={() => { setCloneFor(null); router.refresh(); }} />}

      <Modal open={!!del} onClose={() => setDel(null)} title="Delete voice" footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDel(null)}>Cancel</button>
          <button type="button" className="btn btn-sm bg-danger text-white" disabled={!!busy} onClick={() => run("del", async () => { await api(`/api/voice-cloning/voices/${del!.id}`, { method: "DELETE" }); setDel(null); })}>Delete voice</button>
        </>
      }>
        <p>Delete <span className="font-semibold text-navy">{del?.name}</span>? The replica is removed from the voice provider, its samples are deleted and speakers using it need a new voice.</p>
      </Modal>
      <Modal open={!!revoke} onClose={() => setRevoke(null)} title="Revoke consent" footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setRevoke(null)}>Cancel</button>
          <button type="button" className="btn btn-sm bg-danger text-white" disabled={!!busy} onClick={() => run("rev", async () => { await api(`/api/voice-cloning/consents/${revoke!.id}/revoke`, { method: "POST" }); setRevoke(null); })}>Revoke and delete voices</button>
        </>
      }>
        <p>Revoking consent for <span className="font-semibold text-navy">{revoke?.voice_owner_name}</span> deletes every voice created from it.</p>
      </Modal>
    </div>
  );
}

function CloneModal({ consent, onClose, onDone }: { consent: Consent; onClose: () => void; onDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [meta, setMeta] = useState({ name: `${consent.voice_owner_name}`, accent: "", gender: "", style: "", description: "" });
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    if (!files.length) return setError("Add at least one clear recording. One to three minutes of clean speech works best.");
    try {
      const paths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setStage(`Uploading sample ${i + 1} of ${files.length}`);
        const f = files[i];
        const r = await api<{ path: string; signedUrl: string }>("/api/voice-cloning/samples", { body: { consentId: consent.id, fileName: f.name, mimeType: f.type || "audio/mpeg", sizeBytes: f.size } });
        await uploadToSignedUrl(r.signedUrl, f, () => undefined);
        paths.push(r.path);
      }
      setStage("Creating the voice");
      await api("/api/voice-cloning/clone", { body: { consentId: consent.id, samplePaths: paths, name: meta.name, accent: meta.accent || undefined, gender: meta.gender || undefined, style: meta.style || undefined, description: meta.description || undefined } });
      onDone();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : (e as Error).message);
      setStage(null);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Create voice for ${consent.voice_owner_name}`} footer={
      <>
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={!!stage}>Cancel</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={create} disabled={!!stage}>{stage && <Loader2 size={14} className="ld-spin" />}{stage ?? "Create voice"}</button>
      </>
    }>
      <div className="space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        <div>
          <label htmlFor="vn" className="label">Voice name</label>
          <input id="vn" className="input" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label htmlFor="va" className="label">Accent</label><input id="va" className="input" value={meta.accent} onChange={(e) => setMeta({ ...meta, accent: e.target.value })} placeholder="British" /></div>
          <div><label htmlFor="vg" className="label">Gender</label><input id="vg" className="input" value={meta.gender} onChange={(e) => setMeta({ ...meta, gender: e.target.value })} placeholder="female" /></div>
          <div><label htmlFor="vs" className="label">Style</label>
            <select id="vs" className="input" value={meta.style} onChange={(e) => setMeta({ ...meta, style: e.target.value })}>
              <option value="">None</option>{VOICE_STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p className="label">Voice samples</p>
          <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-line-strong bg-canvas p-5 text-center text-sm text-muted">
            <UploadCloud size={22} className="text-blue" />
            <span className="mt-2">Add MP3, WAV, M4A, OGG or FLAC recordings of {consent.voice_owner_name} speaking</span>
            <input type="file" multiple accept={SAMPLE_AUDIO_TYPES.join(",")} className="hidden" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])].slice(0, 10))} />
          </label>
          <ul className="mt-2 space-y-1 text-sm">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-canvas px-3 py-1.5"><span className="truncate">{f.name}</span><button type="button" aria-label="Remove sample" onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={14} /></button></li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
