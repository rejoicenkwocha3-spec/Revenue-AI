"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, CheckCheck, Undo2, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/client-api";
import { languageName } from "@/config/languages";
import { cn } from "@/lib/utils";
import { StatusBadge, Notice } from "@/components/app/ui";
import { Player, Timeline, type PlayerHandle } from "./Media";
import { LeftPanel, Inspector, DialogueList, History } from "./Panels";
import type { WorkspaceData, WsTranslation } from "./types";

const ACTIVE = ["queued", "running"];

export function Workspace({ data }: { data: WorkspaceData }) {
  const router = useRouter();
  const playerRef = useRef<PlayerHandle>(null);
  const { project } = data;
  const [lang, setLang] = useState<string | null>(project.targetLanguages[0] ?? null);
  const [selected, setSelected] = useState<string | null>(null);
  const [currentMs, setCurrentMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, WsTranslation>>({});
  const [bottom, setBottom] = useState<"timeline" | "dialogue">("timeline");
  const [approving, setApproving] = useState(false);

  useEffect(() => setOverrides({}), [data.translations]);
  useEffect(() => {
    if (lang && !project.targetLanguages.includes(lang)) setLang(project.targetLanguages[0] ?? null);
    if (!lang && project.targetLanguages.length) setLang(project.targetLanguages[0]);
  }, [project.targetLanguages, lang]);

  const refresh = useCallback(() => router.refresh(), [router]);
  const active = data.jobs.some((j) => ACTIVE.includes(j.status));

  // Live status: realtime changes on jobs and the project, with polling as a fallback.
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    try {
      const sb = createClient();
      channel = sb
        .channel(`project-${project.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "processing_jobs", filter: `project_id=eq.${project.id}` }, () => refresh())
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${project.id}` }, () => refresh())
        .subscribe();
    } catch {
      /* realtime unavailable: polling below keeps the view current */
    }
    return () => {
      if (channel) createClient().removeChannel(channel);
    };
  }, [project.id, refresh]);

  useEffect(() => {
    if (!active) return;
    const poll = setInterval(refresh, 6000);
    // Resume queued work if no worker picked it up (for example after a retry delay).
    const kick = setInterval(() => fetch("/api/jobs/kick", { method: "POST" }).catch(() => undefined), 45000);
    return () => { clearInterval(poll); clearInterval(kick); };
  }, [active, refresh]);

  const translations = useMemo(() => {
    const m = new Map<string, WsTranslation>();
    for (const t of data.translations) if (t.target_language === lang) m.set(t.segment_id, overrides[t.id] ?? t);
    return m;
  }, [data.translations, lang, overrides]);

  const original = data.media.find((m) => m.kind === "video" || m.kind === "audio") ?? null;
  const extracted = data.media.find((m) => m.kind === "extracted_audio") ?? null;
  const track = data.generated.find((g) => g.kind === "track" && g.target_language === lang)?.storage_path ?? null;
  const segment = data.segments.find((s) => s.id === selected) ?? null;
  const translation = segment ? translations.get(segment.id) ?? null : null;
  const segAudio = translation ? data.generated.find((g) => g.kind === "segment" && g.translation_segment_id === translation.id)?.storage_path ?? null : null;
  const durationMs = Math.round((project.durationSeconds ?? original?.duration_seconds ?? 0) * 1000);
  const sourceMemo = useMemo(() => (original ? { bucket: original.bucket, path: original.storage_path, kind: original.kind } : null), [original?.bucket, original?.storage_path, original?.kind]); // eslint-disable-line react-hooks/exhaustive-deps
  const waveMemo = useMemo(() => (extracted ? { bucket: extracted.bucket, path: extracted.storage_path } : null), [extracted?.bucket, extracted?.storage_path]); // eslint-disable-line react-hooks/exhaustive-deps
  const failed = data.jobs.find((j) => j.status === "failed");

  async function approval(action: "submit" | "approve" | "request_changes") {
    setApproving(true);
    setError(null);
    try {
      await api(`/api/projects/${project.id}/approval`, { body: { action } });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* HEADER */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-sm text-muted hover:text-navy"><ArrowLeft size={14} /> Projects</Link>
          <h1 className="mt-1 truncate text-2xl font-extrabold">{project.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={project.status} />
            {project.statusDetail && <span className="text-muted">{project.statusDetail}</span>}
            {project.approvalStatus !== "not_submitted" && (
              <span className={cn("chip", project.approvalStatus === "approved" ? "bg-[#F0FDF4] text-success" : project.approvalStatus === "in_review" ? "bg-[#FFF7ED] text-warning" : "bg-[#FEF2F2] text-danger")}>
                {project.approvalStatus === "approved" ? "Approved" : project.approvalStatus === "in_review" ? "Awaiting approval" : "Changes requested"}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project.targetLanguages.length > 1 && (
            <div className="flex rounded-lg border border-line bg-white p-0.5">
              {project.targetLanguages.map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)} className={cn("rounded-md px-2.5 py-1 text-sm font-medium", lang === l ? "bg-navy text-white" : "text-body hover:text-navy")}>{languageName(l)}</button>
              ))}
            </div>
          )}
          {data.permissions.translate && project.approvalStatus !== "in_review" && data.translations.length > 0 && (
            <button type="button" className="btn btn-outline btn-sm" disabled={approving} onClick={() => approval("submit")}><Send size={14} /> Submit for review</button>
          )}
          {data.permissions.approve && project.approvalStatus === "in_review" && (
            <>
              <button type="button" className="btn btn-outline btn-sm" disabled={approving} onClick={() => approval("request_changes")}><Undo2 size={14} /> Request changes</button>
              <button type="button" className="btn btn-dark btn-sm" disabled={approving} onClick={() => approval("approve")}><CheckCheck size={14} /> Approve dub</button>
            </>
          )}
          {approving && <Loader2 size={16} className="ld-spin text-muted" />}
        </div>
      </div>

      {error && (
        <Notice tone="error" className="mb-4 flex items-start justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss"><X size={16} /></button>
        </Notice>
      )}
      {failed && project.status === "failed" && (
        <Notice tone="error" className="mb-4">A processing step failed: {failed.error}. See the processing history below to retry.</Notice>
      )}
      {active && (
        <Notice tone="info" className="mb-4 flex items-center gap-2"><Loader2 size={15} className="ld-spin" /> Processing in the background. This page updates automatically.</Notice>
      )}

      {/* EDITOR GRID */}
      <div className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)_330px]">
        <aside className="card order-2 self-start overflow-hidden xl:order-1">
          <LeftPanel data={data} lang={lang} setLang={setLang} onError={setError} refresh={refresh} />
        </aside>

        <div className="order-1 min-w-0 space-y-4 xl:order-2">
          <Player
            ref={playerRef}
            source={sourceMemo}
            dubTrack={track}
            segments={data.segments}
            translations={translations}
            onTime={setCurrentMs}
            languageLabel={lang ? languageName(lang) : "Dub"}
          />
          {segment && (
            <div className="card flex flex-wrap items-center gap-2 p-3 text-sm">
              <span className="font-semibold text-navy">Line {segment.idx + 1}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { const i = data.segments.findIndex((s) => s.id === segment.id); const p = data.segments[i - 1]; if (p) { setSelected(p.id); playerRef.current?.seek(p.start_ms); } }}>Previous</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { playerRef.current?.seek(segment.start_ms); playerRef.current?.play(); }}>Play line</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { const i = data.segments.findIndex((s) => s.id === segment.id); const n = data.segments[i + 1]; if (n) { setSelected(n.id); playerRef.current?.seek(n.start_ms); } }}>Next</button>
              <span className="ml-auto truncate text-muted">{translation?.text ?? segment.source_text}</span>
            </div>
          )}
        </div>

        <aside className="card order-3 self-start overflow-hidden">
          <Inspector
            data={data}
            lang={lang}
            segment={segment}
            translation={translation}
            currentAudioPath={segAudio}
            onSaved={(t) => setOverrides((o) => ({ ...o, [t.id]: t }))}
            onError={setError}
            refresh={refresh}
          />
        </aside>
      </div>

      {/* BOTTOM PANEL */}
      <section className="card mt-4 p-4">
        <div className="mb-3 flex items-center gap-1">
          {(["timeline", "dialogue"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setBottom(t)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", bottom === t ? "bg-navy text-white" : "text-body hover:bg-canvas")}>
              {t === "timeline" ? "Timeline" : `Dialogue (${data.segments.length})`}
            </button>
          ))}
        </div>
        {bottom === "timeline" ? (
          data.segments.length || extracted ? (
            <Timeline
              durationMs={durationMs}
              waveformSource={waveMemo}
              segments={data.segments}
              speakers={data.speakers}
              translations={translations}
              currentMs={currentMs}
              selectedId={selected}
              onSelect={setSelected}
              onSeek={(ms) => playerRef.current?.seek(ms)}
              languageLabel={lang ? languageName(lang) : "Dub"}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted">The timeline appears once audio is extracted and transcribed.</p>
          )
        ) : (
          <DialogueList segments={data.segments} speakers={data.speakers} translations={translations} selectedId={selected} onSelect={(s) => { setSelected(s.id); playerRef.current?.seek(s.start_ms); }} />
        )}
      </section>

      <div className="mt-4">
        <History data={data} onError={setError} refresh={refresh} />
      </div>
    </div>
  );
}
