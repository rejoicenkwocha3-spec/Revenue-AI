"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, RotateCw, Captions, Loader2, ZoomIn, ZoomOut, AudioLines } from "lucide-react";
import { openSigned } from "@/lib/client-api";
import { formatMs, cn } from "@/lib/utils";
import type { WsSegment, WsSpeaker, WsTranslation } from "./types";

export interface PlayerHandle {
  seek: (ms: number) => void;
  play: () => void;
}

interface PlayerProps {
  source: { bucket: string; path: string; kind: string } | null;
  dubTrack: string | null;
  segments: WsSegment[];
  translations: Map<string, WsTranslation>;
  onTime: (ms: number) => void;
  languageLabel: string;
}

/** Video or audio preview with optional dubbed track playback and subtitle overlay. */
export const Player = forwardRef<PlayerHandle, PlayerProps>(function Player({ source, dubTrack, segments, translations, onTime, languageLabel }, ref) {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const dubRef = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [dubSrc, setDubSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"original" | "dub">("original");
  const [subs, setSubs] = useState<"off" | "source" | "target">("target");
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    if (!source) return;
    let alive = true;
    openSigned(source.bucket, source.path).then((u) => alive && setSrc(u)).catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [source]);
  useEffect(() => {
    setDubSrc(null);
    if (!dubTrack) { setMode("original"); return; }
    let alive = true;
    openSigned("generated", dubTrack).then((u) => alive && setDubSrc(u)).catch(() => undefined);
    return () => { alive = false; };
  }, [dubTrack]);

  const sync = useCallback(() => {
    const v = mediaRef.current;
    const a = dubRef.current;
    if (!v || !a || mode !== "dub") return;
    if (Math.abs(a.currentTime - v.currentTime) > 0.25) a.currentTime = v.currentTime;
    if (v.paused && !a.paused) a.pause();
    if (!v.paused && a.paused) a.play().catch(() => undefined);
  }, [mode]);

  useEffect(() => {
    const v = mediaRef.current;
    const a = dubRef.current;
    if (!v) return;
    v.muted = mode === "dub";
    if (a && mode === "original") a.pause();
    sync();
  }, [mode, sync]);

  useImperativeHandle(ref, () => ({
    seek(ms) {
      const v = mediaRef.current;
      if (!v) return;
      v.currentTime = ms / 1000;
      sync();
    },
    play() { mediaRef.current?.play(); },
  }), [sync]);

  const ms = t * 1000;
  const current = useMemo(() => segments.find((s) => ms >= s.start_ms && ms <= s.end_ms), [segments, ms]);
  const currentTarget = useMemo(() => {
    for (const tr of translations.values()) {
      const s = tr.start_ms + tr.offset_ms + tr.pause_ms;
      const e = tr.end_ms + tr.offset_ms + tr.pause_ms;
      if (ms >= s && ms <= e) return tr;
    }
    return null;
  }, [translations, ms]);
  const caption = subs === "source" ? current?.source_text : subs === "target" ? currentTarget?.text ?? null : null;
  const isVideo = source?.kind === "video";

  const toggle = () => {
    const v = mediaRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-navy">
      <div className={cn("relative bg-black", isVideo ? "aspect-video" : "h-44")}>
        {!source && <div className="absolute inset-0 flex items-center justify-center text-sm text-[#AEB6D6]">No media uploaded yet</div>}
        {error && <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-[#FCA5A5]">{error}</div>}
        {source && !src && !error && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="ld-spin text-white" /></div>}
        {src && (
          <video
            ref={mediaRef}
            src={src}
            playsInline
            preload="metadata"
            className={cn("h-full w-full", isVideo ? "object-contain" : "opacity-0")}
            onTimeUpdate={(e) => { const ct = e.currentTarget.currentTime; setT(ct); onTime(ct * 1000); sync(); }}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
            onPlay={() => { setPlaying(true); sync(); }}
            onPause={() => { setPlaying(false); dubRef.current?.pause(); }}
            onSeeked={sync}
          />
        )}
        {!isVideo && source && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 text-white">
            <AudioLines size={28} className="text-[#9DB8FF]" />
            <span className="font-display text-lg font-bold">{mode === "dub" ? `${languageLabel} dub` : "Original audio"}</span>
          </div>
        )}
        {caption && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center">
            <p className="max-w-[90%] rounded-md bg-black/70 px-3 py-1.5 text-center text-sm leading-snug text-white sm:text-base">{caption}</p>
          </div>
        )}
        {dubSrc && <audio ref={dubRef} src={dubSrc} preload="auto" />}
      </div>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-white">
        <button type="button" onClick={() => { const v = mediaRef.current; if (v) { v.currentTime = Math.max(0, v.currentTime - 5); sync(); } }} className="rounded-lg p-2 hover:bg-white/10" aria-label="Back 5 seconds"><RotateCcw size={16} /></button>
        <button type="button" onClick={toggle} disabled={!src} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy disabled:opacity-40" aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <button type="button" onClick={() => { const v = mediaRef.current; if (v) { v.currentTime = v.currentTime + 5; sync(); } }} className="rounded-lg p-2 hover:bg-white/10" aria-label="Forward 5 seconds"><RotateCw size={16} /></button>
        <span className="font-mono text-xs tabular-nums text-[#C5CCE6]">{formatMs(t * 1000)} / {formatMs(dur * 1000)}</span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-lg bg-white/10 p-0.5 text-xs font-semibold">
            <button type="button" onClick={() => setMode("original")} className={cn("rounded-md px-2.5 py-1", mode === "original" ? "bg-white text-navy" : "text-[#C5CCE6]")}>Original</button>
            <button type="button" disabled={!dubSrc} onClick={() => setMode("dub")} title={dubSrc ? "" : "Generate the dub to preview it"} className={cn("rounded-md px-2.5 py-1 disabled:opacity-40", mode === "dub" ? "bg-white text-navy" : "text-[#C5CCE6]")}>
              {languageLabel} dub
            </button>
          </div>
          <label className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-xs">
            <Captions size={14} />
            <span className="sr-only">Subtitles</span>
            <select value={subs} onChange={(e) => setSubs(e.target.value as typeof subs)} className="bg-transparent text-white outline-none [&>option]:text-navy">
              <option value="target">{languageLabel}</option>
              <option value="source">Original</option>
              <option value="off">Off</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
});

function usePeaks(source: { bucket: string; path: string } | null, buckets = 1600) {
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  useEffect(() => {
    if (!source) return;
    let alive = true;
    (async () => {
      try {
        setState("loading");
        const url = await openSigned(source.bucket, source.path);
        const buf = await (await fetch(url)).arrayBuffer();
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const audio = await ctx.decodeAudioData(buf);
        const data = audio.getChannelData(0);
        const step = Math.max(1, Math.floor(data.length / buckets));
        const out = new Float32Array(buckets);
        for (let i = 0; i < buckets; i++) {
          let max = 0;
          for (let j = i * step; j < Math.min(data.length, (i + 1) * step); j += 4) max = Math.max(max, Math.abs(data[j]));
          out[i] = max;
        }
        ctx.close();
        if (alive) { setPeaks(out); setState("ready"); }
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => { alive = false; };
  }, [source, buckets]);
  return { peaks, state };
}

interface TimelineProps {
  durationMs: number;
  waveformSource: { bucket: string; path: string } | null;
  segments: WsSegment[];
  speakers: WsSpeaker[];
  translations: Map<string, WsTranslation>;
  currentMs: number;
  selectedId: string | null;
  onSelect: (segmentId: string) => void;
  onSeek: (ms: number) => void;
  languageLabel: string;
}

/** Waveform, speaker tracks and dub track on one zoomable time axis. */
export function Timeline({ durationMs, waveformSource, segments, speakers, translations, currentMs, selectedId, onSelect, onSeek, languageLabel }: TimelineProps) {
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { peaks, state } = usePeaks(waveformSource);
  const total = Math.max(durationMs, segments.length ? segments[segments.length - 1].end_ms + 1000 : 1000);
  const width = Math.max(800, Math.round((total / 1000) * 24 * zoom));
  const x = (ms: number) => (ms / total) * width;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !peaks) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr;
    c.height = 64 * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, width, 64);
    const max = Math.max(0.01, ...Array.from(peaks));
    const bar = width / peaks.length;
    for (let i = 0; i < peaks.length; i++) {
      const h = Math.max(1, (peaks[i] / max) * 58);
      g.fillStyle = (i / peaks.length) * total <= currentMs ? "#2463EB" : "#B9C6EA";
      g.fillRect(i * bar, 32 - h / 2, Math.max(1, bar * 0.7), h);
    }
  }, [peaks, width, total, currentMs]);

  const click = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * total);
  };
  const speakerRows = speakers.length ? speakers : [{ id: "none", display_name: "Speaker", color: "#2463EB" } as WsSpeaker];
  const ticks = Math.ceil(total / 1000 / (zoom >= 2 ? 5 : zoom >= 1 ? 10 : 30));
  const tickEvery = zoom >= 2 ? 5000 : zoom >= 1 ? 10000 : 30000;

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-1">
        <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-canvas" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.25, z / 2))}><ZoomOut size={16} /></button>
        <span className="w-10 text-center text-xs tabular-nums text-muted">{zoom}x</span>
        <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-canvas" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(8, z * 2))}><ZoomIn size={16} /></button>
      </div>
      <div className="grid grid-cols-[96px_1fr] overflow-hidden rounded-xl border border-line">
        <div className="divide-y divide-line border-r border-line bg-canvas text-xs font-medium text-body">
          <div className="flex h-6 items-center px-2 text-muted">Time</div>
          <div className="flex h-16 items-center px-2">Waveform</div>
          {speakerRows.map((s) => (
            <div key={s.id} className="flex h-10 items-center gap-1.5 truncate px-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color ?? "#2463EB" }} />{s.display_name}</div>
          ))}
          <div className="flex h-10 items-center truncate px-2 text-purple">{languageLabel} dub</div>
        </div>
        <div className="overflow-x-auto">
          <div className="relative" style={{ width }} onClick={click}>
            <div className="relative h-6 border-b border-line">
              {Array.from({ length: ticks + 1 }, (_, i) => (
                <span key={i} className="absolute top-1 font-mono text-[10px] text-muted" style={{ left: x(i * tickEvery) + 2 }}>{formatMs(i * tickEvery).slice(0, -4)}</span>
              ))}
            </div>
            <div className="relative h-16 border-b border-line bg-white">
              {state === "ready" ? <canvas ref={canvasRef} style={{ width, height: 64 }} className="block" /> : (
                <div className="flex h-full items-center px-3 text-xs text-muted">{state === "loading" ? "Reading audio" : state === "error" ? "Waveform unavailable" : "Waveform appears after audio extraction"}</div>
              )}
            </div>
            {speakerRows.map((s) => (
              <div key={s.id} className="relative h-10 border-b border-line bg-white">
                {segments.filter((g) => (g.speaker_id ?? "none") === s.id || (s.id === "none")).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelect(g.id); onSeek(g.start_ms); }}
                    title={g.source_text}
                    className={cn("absolute top-1.5 bottom-1.5 overflow-hidden rounded-md px-1.5 text-left text-[10px] leading-[26px] text-navy ring-inset", selectedId === g.id && "ring-2 ring-navy")}
                    style={{ left: x(g.start_ms), width: Math.max(4, x(g.end_ms) - x(g.start_ms)), background: `${s.color ?? "#2463EB"}26`, borderLeft: `3px solid ${s.color ?? "#2463EB"}` }}
                  >
                    <span className="block truncate">{g.source_text}</span>
                  </button>
                ))}
              </div>
            ))}
            <div className="relative h-10 bg-white">
              {Array.from(translations.values()).map((tr) => {
                const s = tr.start_ms + tr.offset_ms + tr.pause_ms;
                const e = tr.end_ms + tr.offset_ms + tr.pause_ms;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={(ev) => { ev.stopPropagation(); onSelect(tr.segment_id); onSeek(s); }}
                    title={tr.text}
                    className={cn("absolute top-1.5 bottom-1.5 overflow-hidden rounded-md px-1.5 text-left text-[10px] leading-[26px] text-navy ring-inset", selectedId === tr.segment_id && "ring-2 ring-navy")}
                    style={{ left: x(s), width: Math.max(4, x(e) - x(s)), background: tr.status === "approved" ? "#DCFCE7" : "#7047EB22", borderLeft: `3px solid ${tr.status === "approved" ? "#15803D" : "#7047EB"}` }}
                  >
                    <span className="block truncate">{tr.text}</span>
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-coral" style={{ left: x(currentMs) }} />
          </div>
        </div>
      </div>
    </div>
  );
}
