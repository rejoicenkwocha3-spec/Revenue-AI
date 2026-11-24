"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { UploadCloud, Film, AudioLines, X, Loader2, Check } from "lucide-react";
import { api } from "@/lib/client-api";
import { uploadProjectMedia, normaliseMime } from "@/lib/upload";
import { ACCEPT_ATTR, ACCEPTED_MEDIA } from "@/config/media";
import { Notice } from "@/components/app/ui";
import { formatBytes, cn } from "@/lib/utils";
import type { Language } from "@/config/languages";

export function NewProjectForm({
  sourceLanguages, targetLanguages, maxTargets, hasPlan, providersReady, maxUploadBytes,
}: {
  sourceLanguages: Language[];
  targetLanguages: Language[];
  maxTargets: number;
  hasPlan: boolean;
  providersReady: { stt: boolean; translation: boolean; tts: boolean };
  maxUploadBytes: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [targets, setTargets] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [stage, setStage] = useState<"idle" | "creating" | "uploading" | "starting">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function pick(f: File | undefined | null) {
    setError(null);
    if (!f) return;
    if (!ACCEPTED_MEDIA[normaliseMime(f)]) return setError("Choose an MP4, MOV, WEBM or MKV video, or an MP3, WAV, M4A, AAC, OGG or FLAC audio file.");
    if (f.size > maxUploadBytes) return setError(`This file is ${formatBytes(f.size)}. The upload limit is ${formatBytes(maxUploadBytes)}.`);
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").slice(0, 160));
  }

  function toggleTarget(code: string) {
    setTargets((t) => (t.includes(code) ? t.filter((x) => x !== code) : t.length >= maxTargets ? t : [...t, code]));
  }

  async function submit(startProcessing: boolean) {
    setError(null);
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name the project.";
    if (startProcessing && !file) errs.file = "Upload a video or audio file to start processing.";
    if (startProcessing && targets.length === 0) errs.targets = "Choose at least one target language.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    let projectId: string | null = null;
    try {
      setStage("creating");
      const res = await api<{ id: string }>("/api/projects", {
        body: { name: name.trim(), description: description.trim() || null, sourceLanguage: source || null, targetLanguages: targets },
      });
      projectId = res.id;
      if (file) {
        setStage("uploading");
        await uploadProjectMedia(res.id, file, setProgress);
      }
      if (startProcessing) {
        setStage("starting");
        await api(`/api/projects/${res.id}/process`, { method: "POST" });
      }
      router.push(`/dashboard/projects/${res.id}`);
    } catch (e) {
      setStage("idle");
      setError(projectId ? `${(e as Error).message} The project was saved as a draft and you can continue from its workspace.` : (e as Error).message);
      if (projectId) setTimeout(() => router.push(`/dashboard/projects/${projectId}`), 3500);
    }
  }

  const busy = stage !== "idle";
  const missingProviders = !providersReady.stt || !providersReady.translation || !providersReady.tts;

  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(true); }} noValidate>
      {missingProviders && (
        <Notice tone="warning">
          Some AI providers are not configured on the server
          {[!providersReady.stt && "speech recognition", !providersReady.translation && "translation", !providersReady.tts && "voice generation"].filter(Boolean).map((x, i, a) => `${i === 0 ? ": " : i === a.length - 1 ? " and " : ", "}${x}`).join("")}.
          You can create the project and upload media, but processing will not start until they are connected.
        </Notice>
      )}
      {!hasPlan && (
        <Notice tone="warning">
          Processing needs an active plan. You can prepare the project now. <Link href="/dashboard/billing" className="font-semibold underline">View plans</Link>
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <section className="card p-6">
        <h2 className="text-lg font-bold">Media</h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
          className={cn("mt-4 rounded-2xl border-2 border-dashed p-8 text-center transition-colors", drag ? "border-blue bg-blue-50" : "border-line-strong bg-canvas/60", fieldErrors.file && "border-danger")}
        >
          {file ? (
            <div className="flex items-center justify-between gap-4 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lavender text-purple">
                  {ACCEPTED_MEDIA[normaliseMime(file)] === "video" ? <Film size={20} /> : <AudioLines size={20} />}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">{file.name}</p>
                  <p className="text-sm text-muted">{formatBytes(file.size)}</p>
                </div>
              </div>
              {!busy && <button type="button" onClick={() => setFile(null)} className="rounded-lg p-2 text-muted hover:bg-white" aria-label="Remove file"><X size={18} /></button>}
            </div>
          ) : (
            <>
              <UploadCloud size={30} className="mx-auto text-blue" />
              <p className="mt-3 font-semibold text-navy">Drag a video or audio file here</p>
              <p className="mt-1 text-sm text-muted">MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, OGG or FLAC up to {formatBytes(maxUploadBytes)}</p>
              <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => inputRef.current?.click()}>Browse files</button>
            </>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>
        {fieldErrors.file && <p className="mt-2 text-xs text-danger">{fieldErrors.file}</p>}
        {stage === "uploading" && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted"><span>Uploading securely</span><span className="tabular-nums">{progress}%</span></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-blue transition-[width]" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-bold">Project details</h2>
        <div>
          <label htmlFor="name" className="label">Project name</label>
          <input id="name" className={cn("input", fieldErrors.name && "border-danger")} value={name} maxLength={160} onChange={(e) => setName(e.target.value)} placeholder="Product launch keynote" />
          {fieldErrors.name && <p className="mt-1.5 text-xs text-danger">{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="description" className="label">Context for translators (optional)</label>
          <textarea id="description" className="input min-h-[84px]" value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} placeholder="Names, product terms and tone to keep consistent" />
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="text-lg font-bold">Languages</h2>
        <div>
          <label htmlFor="source" className="label">Source language</label>
          <select id="source" className="input" value={source} onChange={(e) => { setSource(e.target.value); setTargets((t) => t.filter((x) => x !== e.target.value)); }}>
            <option value="">Detect automatically</option>
            {sourceLanguages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="label">Target languages</p>
            <p className="text-xs text-muted tabular-nums">{targets.length} of {maxTargets} on your plan</p>
          </div>
          {targetLanguages.length === 0 ? (
            <p className="rounded-xl bg-canvas p-4 text-sm text-muted">No target languages are available until translation and voice providers are connected.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {targetLanguages.filter((l) => l.code !== source).map((l) => {
                const on = targets.includes(l.code);
                const disabled = !on && targets.length >= maxTargets;
                return (
                  <button key={l.code} type="button" disabled={disabled} onClick={() => toggleTarget(l.code)} aria-pressed={on}
                    className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors", on ? "border-blue bg-blue-50 font-semibold text-navy" : "border-line text-body hover:border-line-strong", disabled && "cursor-not-allowed opacity-40")}>
                    <span className="truncate">{l.name}</span>
                    {on && <Check size={14} className="shrink-0 text-blue" />}
                  </button>
                );
              })}
            </div>
          )}
          {fieldErrors.targets && <p className="mt-2 text-xs text-danger">{fieldErrors.targets}</p>}
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn btn-outline" disabled={busy} onClick={() => submit(false)}>Save draft</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy && <Loader2 size={16} className="ld-spin" />}
          {stage === "creating" ? "Creating project" : stage === "uploading" ? "Uploading" : stage === "starting" ? "Starting" : "Upload and start processing"}
        </button>
      </div>
    </form>
  );
}
