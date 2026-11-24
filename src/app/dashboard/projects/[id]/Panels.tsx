"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Film, AudioLines, Languages, Loader2, Play, Pause, Pencil, Check, RefreshCcw, Wand2, Download, AlertTriangle, CircleCheck, Clock3, UploadCloud,
} from "lucide-react";
import { api, openSigned } from "@/lib/client-api";
import { EMOTIONS, languageName } from "@/config/languages";
import { formatBytes, formatDuration, formatMs, formatDateTime, cn } from "@/lib/utils";
import { StatusBadge, Notice } from "@/components/app/ui";
import { VoicePicker, useVoicePreview, type Voice } from "./VoicePicker";
import { uploadProjectMedia } from "@/lib/upload";
import { ACCEPT_ATTR } from "@/config/media";
import type { WorkspaceData, WsSpeaker, WsTranslation, WsSegment } from "./types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-4 last:border-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/* LEFT PANEL */
export function LeftPanel({
  data, lang, setLang, onError, refresh,
}: { data: WorkspaceData; lang: string | null; setLang: (l: string) => void; onError: (m: string | null) => void; refresh: () => void }) {
  const { project, permissions: perm } = data;
  const original = data.media.find((m) => m.kind === "video" || m.kind === "audio");
  const [busy, setBusy] = useState<string | null>(null);
  const [addLang, setAddLang] = useState("");
  const [vol, setVol] = useState(project.originalAudioVolume);
  const [upload, setUpload] = useState<number | null>(null);
  const hasTranscript = data.segments.length > 0;
  const activeJobs = data.jobs.some((j) => j.status === "queued" || j.status === "running");

  async function act(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    onError(null);
    try {
      await fn();
      refresh();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const statsFor = (l: string) => {
    const tr = data.translations.filter((t) => t.target_language === l);
    const approved = tr.filter((t) => t.status === "approved").length;
    const track = data.generated.some((g) => g.kind === "track" && g.target_language === l);
    const exported = data.exports.some((e) => e.target_language === l);
    return { count: tr.length, approved, track, exported };
  };
  const available = data.caps.targetLanguages.filter((l) => l !== project.sourceLanguage && !project.targetLanguages.includes(l));

  return (
    <div>
      <Section title="Original media">
        {original ? (
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lavender text-purple">{original.kind === "video" ? <Film size={18} /> : <AudioLines size={18} />}</span>
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold text-navy" title={original.file_name}>{original.file_name}</p>
              <p className="text-xs text-muted">
                {[formatBytes(original.size_bytes), original.width && original.height ? `${original.width} × ${original.height}` : null, original.duration_seconds ? formatDuration(original.duration_seconds) : null].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No media uploaded.</p>
        )}
        {perm.upload && !activeJobs && (
          <label className="btn btn-outline btn-sm mt-3 w-full cursor-pointer">
            <UploadCloud size={14} /> {original ? "Replace media" : "Upload media"}
            <input type="file" accept={ACCEPT_ATTR} className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              act("upload", async () => { setUpload(0); await uploadProjectMedia(project.id, f, setUpload); setUpload(null); });
            }} />
          </label>
        )}
        {upload !== null && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas"><div className="h-full bg-blue" style={{ width: `${upload}%` }} /></div>}
        {perm.run && original && !hasTranscript && !activeJobs && (
          <button type="button" className="btn btn-primary btn-sm mt-3 w-full" disabled={busy === "process"} onClick={() => act("process", () => api(`/api/projects/${project.id}/process`, { method: "POST" }))}>
            {busy === "process" ? <Loader2 size={14} className="ld-spin" /> : <Wand2 size={14} />} Start processing
          </button>
        )}
        {perm.run && original && hasTranscript && !activeJobs && (
          <button type="button" className="btn btn-ghost btn-sm mt-2 w-full" disabled={busy === "process"} onClick={() => act("process", () => api(`/api/projects/${project.id}/process`, { method: "POST" }))}>
            <RefreshCcw size={14} /> Transcribe again
          </button>
        )}
      </Section>

      <Section title="Languages">
        <dl className="text-sm">
          <div className="flex justify-between gap-2"><dt className="text-muted">Source</dt><dd className="font-semibold text-navy">{project.sourceLanguage ? languageName(project.sourceLanguage) : "Detect automatically"}</dd></div>
          {data.transcription && <div className="mt-1 flex justify-between gap-2"><dt className="text-muted">Transcribed by</dt><dd className="text-body">{data.transcription.provider}</dd></div>}
        </dl>
        <ul className="mt-3 space-y-1.5">
          {project.targetLanguages.map((l) => {
            const s = statsFor(l);
            return (
              <li key={l}>
                <button type="button" onClick={() => setLang(l)} className={cn("flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm", lang === l ? "border-blue bg-blue-50" : "border-line hover:border-line-strong")}>
                  <Languages size={14} className={lang === l ? "text-blue" : "text-muted"} />
                  <span className="flex-1 font-medium text-navy">{languageName(l)}</span>
                  <span className="text-[11px] text-muted tabular-nums">{s.count ? `${s.approved}/${s.count}` : "pending"}</span>
                  {s.exported ? <CircleCheck size={14} className="text-success" /> : s.track ? <AudioLines size={14} className="text-purple" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
        {perm.edit && available.length > 0 && project.targetLanguages.length < data.limits.targetLanguagesPerProject && (
          <div className="mt-3 flex gap-2">
            <select aria-label="Add target language" className="input py-1.5 text-sm" value={addLang} onChange={(e) => setAddLang(e.target.value)}>
              <option value="">Add a language</option>
              {available.map((l) => <option key={l} value={l}>{languageName(l)}</option>)}
            </select>
            <button type="button" className="btn btn-outline btn-sm" disabled={!addLang || busy === "add"} onClick={() => act("add", async () => {
              await api(`/api/projects/${project.id}`, { method: "PATCH", body: { targetLanguages: [...project.targetLanguages, addLang] } });
              if (hasTranscript) await api(`/api/projects/${project.id}/translate`, { body: { language: addLang } });
              setLang(addLang);
              setAddLang("");
            })}>Add</button>
          </div>
        )}
        {perm.run && lang && hasTranscript && !activeJobs && (
          <button type="button" className="btn btn-ghost btn-sm mt-2 w-full" disabled={busy === "tr"} onClick={() => act("tr", () => api(`/api/projects/${project.id}/translate`, { body: { language: lang } }))}>
            <RefreshCcw size={14} /> {statsFor(lang).count ? `Retranslate draft ${languageName(lang)} lines` : `Translate to ${languageName(lang)}`}
          </button>
        )}
      </Section>

      <SpeakersSection data={data} lang={lang} onError={onError} refresh={refresh} />

      {perm.edit && (
        <Section title="Mix">
          <label htmlFor="bed" className="flex justify-between text-sm text-body"><span>Original audio underneath</span><span className="tabular-nums text-muted">{Math.round(vol * 100)}%</span></label>
          <input id="bed" type="range" min={0} max={0.5} step={0.01} value={vol} className="mt-2 w-full accent-[#2463EB]" onChange={(e) => setVol(Number(e.target.value))}
            onMouseUp={() => act("vol", () => api(`/api/projects/${project.id}`, { method: "PATCH", body: { originalAudioVolume: vol } }))}
            onTouchEnd={() => act("vol", () => api(`/api/projects/${project.id}`, { method: "PATCH", body: { originalAudioVolume: vol } }))}
            onKeyUp={() => act("vol", () => api(`/api/projects/${project.id}`, { method: "PATCH", body: { originalAudioVolume: vol } }))} />
          <p className="mt-1 text-xs text-muted">Keeps music and ambience under the dub. Set to 0% for a clean voice track. Applies on the next generation.</p>
        </Section>
      )}
    </div>
  );
}

function SpeakersSection({ data, lang, onError, refresh }: { data: WorkspaceData; lang: string | null; onError: (m: string | null) => void; refresh: () => void }) {
  const [picking, setPicking] = useState<WsSpeaker | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const preview = useVoicePreview();
  const can = data.permissions.translate;

  async function patch(id: string, body: Record<string, unknown>) {
    onError(null);
    try {
      await api(`/api/speakers/${id}`, { method: "PATCH", body });
      refresh();
    } catch (e) {
      onError((e as Error).message);
    }
  }
  const lineFor = (sp: WsSpeaker) => {
    const seg = data.segments.find((s) => s.speaker_id === sp.id);
    if (!seg || !lang) return undefined;
    return data.translations.find((t) => t.segment_id === seg.id && t.target_language === lang)?.text;
  };

  return (
    <Section title={`Speakers${data.speakers.length ? ` (${data.speakers.length})` : ""}`}>
      {!data.speakers.length ? (
        <p className="text-sm text-muted">Speakers are detected during transcription.</p>
      ) : (
        <ul className="space-y-2.5">
          {data.speakers.map((sp) => (
            <li key={sp.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: sp.color ?? "#2463EB" }} />
                {editing === sp.id ? (
                  <form className="flex flex-1 gap-1" onSubmit={(e) => { e.preventDefault(); setEditing(null); patch(sp.id, { displayName: name }); }}>
                    <input aria-label="Speaker name" autoFocus className="input py-1 text-sm" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
                    <button type="submit" className="rounded-lg p-1.5 text-blue hover:bg-canvas" aria-label="Save name"><Check size={15} /></button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm font-semibold text-navy">{sp.display_name}</span>
                    {can && <button type="button" onClick={() => { setEditing(sp.id); setName(sp.display_name); }} className="rounded p-1 text-muted hover:text-navy" aria-label={`Rename ${sp.display_name}`}><Pencil size={13} /></button>}
                  </>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button type="button" disabled={!can} onClick={() => setPicking(sp)} className={cn("flex min-w-0 flex-1 items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs", sp.voice_id ? "border-line text-navy" : "border-coral/50 bg-coral-50 text-[#B42318]")}>
                  <span className="truncate">{sp.voice_name ?? "Assign a voice"}</span>
                  <Pencil size={12} className="shrink-0 opacity-60" />
                </button>
                {sp.voice_id && lang && (
                  <button type="button" aria-label="Preview speaker voice" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lavender text-purple"
                    onClick={() => preview.toggle({ provider: sp.voice_provider ?? "", voiceId: sp.voice_id!, name: sp.voice_name ?? "", accent: null, gender: null, age: null, style: null, description: null, languages: [], previewUrl: null, category: null }, lang, lineFor(sp), sp.emotion, sp.accent)}>
                    {preview.loading?.startsWith(`${sp.voice_provider}:${sp.voice_id}`) ? <Loader2 size={13} className="ld-spin" /> : preview.playing?.startsWith(`${sp.voice_provider}:${sp.voice_id}`) ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select aria-label="Emotion" disabled={!can} className="input py-1 text-xs" value={sp.emotion} onChange={(e) => patch(sp.id, { emotion: e.target.value })}>
                  {EMOTIONS.map((e) => <option key={e} value={e}>{cap(e)}</option>)}
                </select>
                {data.caps.accentByInstruction ? (
                  <input aria-label="Accent" disabled={!can} className="input py-1 text-xs" placeholder="Accent" defaultValue={sp.accent ?? ""} onBlur={(e) => e.target.value !== (sp.accent ?? "") && patch(sp.id, { accent: e.target.value || null })} />
                ) : (
                  <span className="flex items-center truncate rounded-lg bg-canvas px-2 text-[11px] text-muted" title="Accent comes from the selected voice">{sp.accent ?? "Accent set by voice"}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {preview.error && <p className="mt-2 text-xs text-danger">{preview.error}</p>}
      {!data.caps.diarization && data.speakers.length > 0 && <p className="mt-2 text-xs text-muted">The connected speech provider does not separate speakers, so all lines use one speaker.</p>}
      <VoicePicker open={!!picking} onClose={() => setPicking(null)} language={lang} selectedId={picking?.voice_id}
        onSelect={(v: Voice) => picking && patch(picking.id, { voiceProvider: v.provider, voiceId: v.voiceId, voiceName: v.name, accent: data.caps.accentByInstruction ? picking.accent : v.accent })} />
    </Section>
  );
}

/* RIGHT PANEL: line editor and generation */
export function Inspector({
  data, lang, segment, translation, onSaved, onError, refresh, currentAudioPath,
}: {
  data: WorkspaceData;
  lang: string | null;
  segment: WsSegment | null;
  translation: WsTranslation | null;
  onSaved: (t: WsTranslation) => void;
  onError: (m: string | null) => void;
  refresh: () => void;
  currentAudioPath: string | null;
}) {
  const [gen, setGen] = useState(false);
  const [embed, setEmbed] = useState(true);
  const langJobs = data.jobs.filter((j) => j.target_language === lang);
  const running = data.jobs.some((j) => j.status === "queued" || j.status === "running");
  const trCount = data.translations.filter((t) => t.target_language === lang).length;
  const unassigned = data.speakers.filter((s) => !s.voice_id);
  const minutes = Math.ceil(((data.project.durationSeconds ?? 0) / 60) * 10) / 10;
  const lastGen = langJobs.find((j) => j.type === "generate_voice");
  // Remount the editor whenever the line or its saved values change, so drafts start from the latest data.
  const editorKey = translation
    ? [translation.id, translation.text, translation.status, translation.start_ms, translation.end_ms, translation.speed, translation.pause_ms, translation.offset_ms, translation.emotion, segment?.source_text].join("|")
    : `seg:${segment?.id ?? "none"}:${segment?.source_text ?? ""}`;

  return (
    <div>
      <Section title={lang ? `Generate ${languageName(lang)} dub` : "Generate dub"}>
        {!lang ? <p className="text-sm text-muted">Add a target language to generate a dub.</p> : (
          <>
            <ul className="space-y-1 text-sm">
              <Check1 ok={trCount > 0} label={trCount ? `${trCount} translated lines` : "Translation not ready"} />
              <Check1 ok={data.speakers.length > 0 && unassigned.length === 0} label={unassigned.length ? `${unassigned.length} speaker${unassigned.length > 1 ? "s" : ""} without a voice` : "Every speaker has a voice"} />
              <Check1 ok={!!data.caps.ttsProvider} label={data.caps.ttsProvider ? `Voices by ${data.caps.ttsProvider}` : "No voice provider configured"} />
              <Check1 ok={minutes <= data.limits.minutesRemaining} label={`Uses up to ${minutes} min of ${data.limits.minutesRemaining.toFixed(1)} remaining`} />
            </ul>
            {data.project.mediaKind === "video" && (
              <label className="mt-3 flex items-center gap-2 text-sm text-body"><input type="checkbox" checked={embed} onChange={(e) => setEmbed(e.target.checked)} /> Embed subtitles in the MP4</label>
            )}
            {data.permissions.run && (
              <button type="button" className="btn btn-primary btn-sm mt-3 w-full" disabled={gen || running || !trCount || unassigned.length > 0 || !data.caps.ttsProvider}
                onClick={async () => {
                  setGen(true);
                  onError(null);
                  try { await api(`/api/projects/${data.project.id}/generate`, { body: { language: lang, embedSubtitles: embed } }); refresh(); }
                  catch (e) { onError((e as Error).message); }
                  finally { setGen(false); }
                }}>
                {gen ? <Loader2 size={14} className="ld-spin" /> : <Wand2 size={14} />}
                {lastGen?.status === "completed" ? "Regenerate dub" : "Generate dub"}
              </button>
            )}
            {minutes > data.limits.minutesRemaining && <p className="mt-2 text-xs text-danger">Not enough minutes left. <Link href="/dashboard/billing" className="underline">Upgrade your plan</Link>.</p>}
            <p className="mt-2 text-xs text-muted">Unchanged lines reuse their audio and are not billed again, so regenerating after edits only voices what changed.</p>
          </>
        )}
      </Section>

      <Section title={segment ? `Line ${segment.idx + 1}` : "Line editor"}>
        {!segment ? <p className="text-sm text-muted">Select a line on the timeline or in the dialogue list.</p> : (
          <LineEditor key={editorKey} data={data} lang={lang} segment={segment} translation={translation} onSaved={onSaved} onError={onError} currentAudioPath={currentAudioPath} />
        )}
      </Section>
    </div>
  );
}

function LineEditor({
  data, lang, segment, translation, onSaved, onError, currentAudioPath,
}: {
  data: WorkspaceData;
  lang: string | null;
  segment: WsSegment;
  translation: WsTranslation | null;
  onSaved: (t: WsTranslation) => void;
  onError: (m: string | null) => void;
  currentAudioPath: string | null;
}) {
  const [text, setText] = useState(translation?.text ?? "");
  const [source, setSource] = useState(segment.source_text);
  const [emotion, setEmotion] = useState<string>(translation?.emotion ?? "");
  const [timing, setTiming] = useState(() =>
    translation
      ? { start: translation.start_ms, end: translation.end_ms, speed: translation.speed, pause: translation.pause_ms, offset: translation.offset_ms }
      : { start: segment.start_ms, end: segment.end_ms, speed: 1, pause: 0, offset: 0 },
  );
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const can = data.permissions.translate;
  const speaker = data.speakers.find((s) => s.id === segment.speaker_id);
  const dirty =
    !!translation &&
    (text !== translation.text || source !== segment.source_text || emotion !== (translation.emotion ?? "") || timing.start !== translation.start_ms || timing.end !== translation.end_ms ||
      timing.speed !== translation.speed || timing.pause !== translation.pause_ms || timing.offset !== translation.offset_ms);

  async function save(status?: "approved" | "edited") {
    if (!translation) return;
    setSaving(true);
    onError(null);
    try {
      if (source !== segment.source_text) await api(`/api/transcript-segments/${segment.id}`, { method: "PATCH", body: { text: source } });
      const r = await api<{ segment: WsTranslation }>(`/api/segments/${translation.id}`, {
        method: "PATCH",
        body: { text, emotion: emotion || null, startMs: timing.start, endMs: timing.end, speed: timing.speed, pauseMs: timing.pause, offsetMs: timing.offset, ...(status ? { status } : {}) },
      });
      onSaved({ ...r.segment, speed: Number(r.segment.speed) });
    } catch (e) {
      onError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="chip" style={{ background: `${speaker?.color ?? "#2463EB"}1F`, color: speaker?.color ?? "#2463EB" }}>{speaker?.display_name ?? "Speaker"}</span>
        <span className="font-mono text-muted">{formatMs(segment.start_ms)} · {formatMs(segment.end_ms)}</span>
      </div>
      <div>
        <label htmlFor="src" className="label text-xs">Original</label>
        <textarea id="src" disabled={!can} className="input min-h-[64px] text-sm" value={source} onChange={(e) => setSource(e.target.value)} />
      </div>
      {!translation ? <p className="text-sm text-muted">No {lang ? languageName(lang) : ""} translation for this line yet.</p> : (
        <>
          <div>
            <label htmlFor="tr" className="label text-xs flex justify-between"><span>{languageName(lang)}</span><span className={cn("font-normal", translation.status === "approved" ? "text-success" : "text-muted")}>{cap(translation.status)}</span></label>
            <textarea id="tr" disabled={!can} className="input min-h-[84px] text-sm" value={text} onChange={(e) => setText(e.target.value)} />
            <p className="mt-1 text-[11px] text-muted tabular-nums">{text.length} characters · original {segment.source_text.length}</p>
          </div>
          <div>
            <label htmlFor="emo" className="label text-xs">Emotion</label>
            <select id="emo" disabled={!can} className="input py-1.5 text-sm" value={emotion} onChange={(e) => setEmotion(e.target.value)}>
              <option value="">Use speaker setting ({cap(speaker?.emotion ?? "neutral")})</option>
              {EMOTIONS.map((e) => <option key={e} value={e}>{cap(e)}</option>)}
            </select>
          </div>
          <fieldset className="grid grid-cols-2 gap-2" disabled={!can}>
            <legend className="label text-xs">Timing</legend>
            <NumField id="st" label="Start (s)" value={timing.start / 1000} step={0.01} onChange={(v) => setTiming((t) => ({ ...t, start: Math.round(v * 1000) }))} />
            <NumField id="en" label="End (s)" value={timing.end / 1000} step={0.01} onChange={(v) => setTiming((t) => ({ ...t, end: Math.round(v * 1000) }))} />
            <NumField id="pa" label="Pause (ms)" value={timing.pause} step={50} onChange={(v) => setTiming((t) => ({ ...t, pause: Math.round(v) }))} />
            <NumField id="of" label="Offset (ms)" value={timing.offset} step={50} onChange={(v) => setTiming((t) => ({ ...t, offset: Math.round(v) }))} />
            <div className="col-span-2">
              <label htmlFor="sp" className="flex justify-between text-xs text-muted"><span>Speed</span><span className="tabular-nums">{timing.speed.toFixed(2)}x</span></label>
              <input id="sp" type="range" min={0.5} max={2} step={0.05} value={timing.speed} className="w-full accent-[#7047EB]" onChange={(e) => setTiming((t) => ({ ...t, speed: Number(e.target.value) }))} />
            </div>
            <p className="col-span-2 text-[11px] text-muted tabular-nums">Segment duration {((timing.end - timing.start) / 1000).toFixed(2)} s</p>
          </fieldset>
          {can && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-outline btn-sm flex-1" disabled={saving || !dirty} onClick={() => save()}>{saving ? <Loader2 size={14} className="ld-spin" /> : null} Save</button>
              <button type="button" className="btn btn-dark btn-sm flex-1" disabled={saving || (translation.status === "approved" && !dirty)} onClick={() => save("approved")}><Check size={14} /> Approve line</button>
            </div>
          )}
          {currentAudioPath && (
            <button type="button" className="btn btn-ghost btn-sm w-full" onClick={async () => {
              try {
                const url = await openSigned("generated", currentAudioPath);
                if (!audioRef.current) audioRef.current = new Audio();
                audioRef.current.src = url;
                await audioRef.current.play();
              } catch (e) { onError((e as Error).message); }
            }}>
              <Play size={14} /> Play generated line
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Check1({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn("flex items-center gap-2", ok ? "text-body" : "text-[#B42318]")}>
      {ok ? <CircleCheck size={15} className="shrink-0 text-success" /> : <AlertTriangle size={15} className="shrink-0" />}
      {label}
    </li>
  );
}

function NumField({ id, label, value, step, onChange }: { id: string; label: string; value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted">{label}</label>
      <input id={id} type="number" className="input mt-0.5 py-1.5 text-sm tabular-nums" value={Number.isFinite(value) ? Number(value.toFixed(3)) : 0} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/* DIALOGUE LIST */
export function DialogueList({
  segments, speakers, translations, selectedId, onSelect,
}: { segments: WsSegment[]; speakers: WsSpeaker[]; translations: Map<string, WsTranslation>; selectedId: string | null; onSelect: (s: WsSegment) => void }) {
  const [q, setQ] = useState("");
  const sp = useMemo(() => new Map(speakers.map((s) => [s.id, s])), [speakers]);
  const rows = segments.filter((s) => !q || s.source_text.toLowerCase().includes(q.toLowerCase()) || (translations.get(s.id)?.text ?? "").toLowerCase().includes(q.toLowerCase()));
  if (!segments.length) return <p className="py-8 text-center text-sm text-muted">Dialogue appears here after transcription.</p>;
  return (
    <div>
      <input aria-label="Search dialogue" className="input mb-3 py-1.5 text-sm" placeholder="Search dialogue" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-line">
            {rows.map((s) => {
              const tr = translations.get(s.id);
              const speaker = s.speaker_id ? sp.get(s.speaker_id) : null;
              return (
                <tr key={s.id} onClick={() => onSelect(s)} className={cn("cursor-pointer align-top", selectedId === s.id ? "bg-blue-50" : "hover:bg-canvas/70")}>
                  <td className="w-24 px-3 py-2.5 font-mono text-[11px] text-muted">{formatMs(s.start_ms)}</td>
                  <td className="w-28 px-2 py-2.5"><span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: speaker?.color ?? "#2463EB" }}><span className="h-2 w-2 rounded-full" style={{ background: speaker?.color ?? "#2463EB" }} />{speaker?.display_name ?? ""}</span></td>
                  <td className="px-2 py-2.5 text-muted">{s.source_text}</td>
                  <td className="px-2 py-2.5 text-navy">{tr?.text ?? <span className="text-muted">Not translated</span>}</td>
                  <td className="w-8 px-2 py-2.5">{tr?.status === "approved" && <CircleCheck size={15} className="text-success" />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* HISTORY, EXPORTS, SUBTITLES */
const JOB_LABEL: Record<string, string> = {
  extract_audio: "Extract audio", transcribe: "Transcribe and detect speakers", translate: "Translate", generate_voice: "Generate voice",
  synchronise: "Synchronise audio", subtitles: "Generate subtitles", render: "Render and export",
};

export function History({ data, onError, refresh }: { data: WorkspaceData; onError: (m: string | null) => void; refresh: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<string, number>>(() => Object.fromEntries(data.subtitles.map((s) => [s.language, s.timing_offset_ms])));
  async function download(bucket: string, path: string) {
    try { window.location.assign(await openSigned(bucket, path, true)); } catch (e) { onError((e as Error).message); }
  }
  const subtitleLangs = Array.from(new Set(data.subtitles.map((s) => s.language)));
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <section className="card xl:col-span-2">
        <h2 className="border-b border-line px-5 py-3.5 text-base font-bold">Processing history</h2>
        {!data.jobs.length ? <p className="px-5 py-6 text-sm text-muted">No processing has run yet.</p> : (
          <ul className="divide-y divide-line">
            {data.jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-start gap-3 px-5 py-3 text-sm">
                <span className="mt-0.5">{j.status === "completed" ? <CircleCheck size={16} className="text-success" /> : j.status === "failed" ? <AlertTriangle size={16} className="text-danger" /> : j.status === "running" ? <Loader2 size={16} className="ld-spin text-blue" /> : <Clock3 size={16} className="text-muted" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{JOB_LABEL[j.type] ?? j.type}{j.target_language ? `: ${languageName(j.target_language)}` : ""}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(j.created_at)}
                    {j.finished_at && j.started_at ? ` · took ${Math.max(1, Math.round((new Date(j.finished_at).getTime() - new Date(j.started_at).getTime()) / 1000))} s` : ""}
                    {j.attempts > 1 ? ` · attempt ${j.attempts} of ${j.max_attempts}` : ""}
                    {j.status === "queued" && new Date(j.run_after) > new Date() ? ` · retrying at ${formatDateTime(j.run_after)}` : ""}
                  </p>
                  {j.error && <p className="mt-1 break-words text-xs text-danger">{j.error}</p>}
                  {j.result && j.status === "completed" && <p className="mt-1 text-xs text-muted">{summarise(j.type, j.result)}</p>}
                </div>
                <StatusBadge status={j.status} />
                {j.status === "failed" && data.permissions.run && (
                  <button type="button" className="btn btn-outline btn-sm" disabled={busy === j.id} onClick={async () => {
                    setBusy(j.id); onError(null);
                    try { await api(`/api/projects/${data.project.id}/retry`, { body: { jobId: j.id } }); refresh(); } catch (e) { onError((e as Error).message); } finally { setBusy(null); }
                  }}><RefreshCcw size={13} /> Retry</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="space-y-5">
        <section className="card">
          <h2 className="border-b border-line px-5 py-3.5 text-base font-bold">Exports</h2>
          {!data.exports.length ? <p className="px-5 py-6 text-sm text-muted">Finished dubs appear here as MP4, audio and subtitle files.</p> : (
            <ul className="divide-y divide-line">
              {data.exports.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="w-12 rounded bg-canvas py-0.5 text-center text-[11px] font-bold uppercase text-navy">{e.format}</span>
                  <span className="min-w-0 flex-1 truncate text-body">{languageName(e.target_language)} · {formatBytes(e.size_bytes)}</span>
                  <button type="button" onClick={() => download("exports", e.storage_path)} className="rounded-lg p-1.5 text-blue hover:bg-blue-50" aria-label={`Download ${e.format}`}><Download size={16} /></button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2 className="border-b border-line px-5 py-3.5 text-base font-bold">Subtitles</h2>
          {!subtitleLangs.length ? <p className="px-5 py-6 text-sm text-muted">Subtitles are generated with each dub.</p> : (
            <ul className="divide-y divide-line">
              {subtitleLangs.map((l) => (
                <li key={l} className="px-5 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-navy">{languageName(l)}{data.subtitles.find((s) => s.language === l)?.is_source ? " (original)" : ""}</span>
                    <span className="flex gap-1">
                      {data.subtitles.filter((s) => s.language === l).map((s) => (
                        <button key={s.id} type="button" className="btn btn-outline btn-sm py-1" onClick={() => download("generated", s.storage_path)}>{s.format.toUpperCase()}</button>
                      ))}
                    </span>
                  </div>
                  {data.permissions.translate && (
                    <div className="mt-2 flex items-center gap-2">
                      <label htmlFor={`off-${l}`} className="text-xs text-muted">Timing offset (ms)</label>
                      <input id={`off-${l}`} type="number" step={100} className="input w-24 py-1 text-xs" value={offsets[l] ?? 0} onChange={(e) => setOffsets((o) => ({ ...o, [l]: Number(e.target.value) }))} />
                      <button type="button" className="btn btn-ghost btn-sm py-1" disabled={busy === `sub-${l}`} onClick={async () => {
                        setBusy(`sub-${l}`); onError(null);
                        try { await api(`/api/projects/${data.project.id}/subtitles`, { body: { language: l, offsetMs: offsets[l] ?? 0 } }); refresh(); } catch (e) { onError((e as Error).message); } finally { setBusy(null); }
                      }}>Update</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Updating rewrites the files with your latest edits. Render again to embed changes in the MP4.</p>
        </section>
      </div>
    </div>
  );
}

function summarise(type: string, r: Record<string, unknown>): string {
  switch (type) {
    case "extract_audio": return r.durationSeconds ? `${formatDuration(Number(r.durationSeconds))} of ${r.hasVideo ? "video" : "audio"}` : "";
    case "transcribe": return `${r.segments} lines, ${r.speakers} speaker${r.speakers === 1 ? "" : "s"}${r.language ? `, ${languageName(String(r.language))}` : ""}`;
    case "translate": return `${r.translated} lines translated${r.kept ? `, ${r.kept} reviewed lines kept` : ""}`;
    case "generate_voice": return `${r.generated} lines voiced, ${r.skipped} reused, ${r.minutes} min`;
    case "synchronise": return `${r.segments} lines placed${r.compressed ? `, ${r.compressed} tightened` : ""}${r.overflow ? `, ${r.overflow} still run long` : ""}`;
    case "subtitles": return `${r.targetCount} cues`;
    case "render": return `${r.exports} files exported`;
    default: return "";
  }
}

export { StatusBadge, Notice };
