"use client";
import { useEffect, useState } from "react";
import { Check, Film, Languages, AudioLines, Download, Play, Pause } from "lucide-react";
import { Waveform } from "@/components/ui/Waveform";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "original", label: "Original video", icon: Film },
  { key: "language", label: "Language selection", icon: Languages },
  { key: "voice", label: "Voice generation", icon: AudioLines },
  { key: "dubbed", label: "Dubbed video", icon: Download },
] as const;

const SOURCE = "Today we are launching something built for every audience, in every language.";
const LINES: Record<string, { name: string; text: string; voice: string }> = {
  es: { name: "Spanish", text: "Hoy lanzamos algo creado para cada audiencia, en cada idioma.", voice: "Lucía" },
  fr: { name: "French", text: "Aujourd'hui, nous lançons quelque chose conçu pour chaque public, dans chaque langue.", voice: "Camille" },
  de: { name: "German", text: "Heute starten wir etwas, das für jedes Publikum in jeder Sprache gemacht ist.", voice: "Jonas" },
  pt: { name: "Portuguese", text: "Hoje lançamos algo criado para todo público, em todos os idiomas.", voice: "Beatriz" },
  ja: { name: "Japanese", text: "本日、あらゆる視聴者のために、あらゆる言語で作られたものを発表します。", voice: "Haruto" },
  hi: { name: "Hindi", text: "आज हम हर दर्शक के लिए, हर भाषा में बनाई गई चीज़ लॉन्च कर रहे हैं।", voice: "Aarav" },
};

export function ProductDemo() {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("es");
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 3800);
    return () => clearInterval(t);
  }, [auto]);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => (v + 1) % 100), 90);
    return () => clearInterval(t);
  }, []);

  const line = LINES[lang];
  const progress = tick / 100;
  const caption = step === 3 ? line.text : SOURCE;

  return (
    <div className="card overflow-hidden shadow-[var(--shadow-float)]">
      {/* window chrome */}
      <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E4E7F2]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E4E7F2]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E4E7F2]" />
        </div>
        <p className="text-xs font-medium text-muted">Product launch keynote.mp4</p>
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-navy"
          aria-label={auto ? "Pause walkthrough" : "Play walkthrough"}
        >
          {auto ? <Pause size={12} /> : <Play size={12} />} {auto ? "Pause" : "Play"}
        </button>
      </div>

      {/* stepper */}
      <ol className="grid grid-cols-4 border-b border-line bg-canvas/60">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const state = i < step ? "done" : i === step ? "active" : "todo";
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => {
                  setStep(i);
                  setAuto(false);
                }}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 px-1 py-3 text-[11px] font-semibold transition-colors sm:flex-row sm:justify-center sm:text-xs",
                  state === "active" ? "bg-white text-navy" : "text-muted hover:text-navy",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full",
                    state === "done" && "bg-blue text-white",
                    state === "active" && "bg-navy text-white",
                    state === "todo" && "bg-white text-muted ring-1 ring-line",
                  )}
                >
                  {state === "done" ? <Check size={13} /> : <Icon size={13} />}
                </span>
                <span className="text-center leading-tight">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-0 md:grid-cols-[1.35fr_1fr]">
        {/* video stage */}
        <div className="relative bg-navy p-4 sm:p-5">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-[#18244F]">
            <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_30%_30%,#2B3A78_0%,#18244F_70%)]" />
            {/* presenter silhouette */}
            <div className="absolute bottom-0 left-1/2 h-[78%] w-[42%] -translate-x-1/2">
              <div className="mx-auto h-[38%] w-[46%] rounded-full bg-[#33447F]" />
              <div className="mx-auto mt-[4%] h-[62%] w-full rounded-t-[48%] bg-[#2C3B73]" />
            </div>
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="chip bg-white/10 text-white backdrop-blur">
                {step === 3 ? `${line.name} dub` : "Original: English"}
              </span>
            </div>
            <div className="absolute right-3 top-3 font-mono text-[11px] text-white/70">00:0{1 + Math.floor(progress * 8)}:{String(10 + Math.floor(progress * 40)).padStart(2, "0")}</div>
            <div className="absolute inset-x-3 bottom-3 sm:inset-x-6">
              <p key={caption} className="ld-fade-up mx-auto w-fit max-w-full rounded-md bg-black/55 px-3 py-1.5 text-center text-[12px] leading-snug text-white sm:text-[13px]">
                {caption}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Waveform bars={72} seed={step === 3 ? 21 : 7} progress={progress} color="#2E3B6E" activeColor={step === 3 ? "#9B7FFF" : "#5B8CFF"} height={40} />
          </div>
        </div>

        {/* control panel */}
        <div className="flex min-h-[300px] flex-col gap-4 p-5">
          {step === 0 && (
            <div className="ld-fade-up space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Upload</p>
              <div className="rounded-xl border border-line p-4">
                <p className="font-display text-sm font-bold text-navy">Product launch keynote.mp4</p>
                <p className="mt-1 text-xs text-muted">1920 × 1080 · 4:12 · English detected</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas"><div className="h-full w-full rounded-full bg-blue" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-canvas p-3"><p className="text-muted">Speakers</p><p className="mt-0.5 font-semibold text-navy">2 detected</p></div>
                <div className="rounded-lg bg-canvas p-3"><p className="text-muted">Segments</p><p className="mt-0.5 font-semibold text-navy">64 lines</p></div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="ld-fade-up space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Target language</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LINES).map(([code, l]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setLang(code);
                      setAuto(false);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      lang === code ? "border-blue bg-blue-50 text-navy" : "border-line text-body hover:border-line-strong",
                    )}
                  >
                    {l.name}
                    {lang === code && <Check size={14} className="text-blue" />}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="ld-fade-up space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Voice</p>
              <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className="flex h-10 w-10 items-end justify-center gap-[3px] rounded-full bg-lavender pb-3">
                  {[0, 1, 2, 3].map((b) => (
                    <span key={b} className="ld-bar block w-[3px] rounded-full bg-purple" style={{ height: 14, animationDelay: `${b * 0.15}s` }} />
                  ))}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-navy">{line.voice}</p>
                  <p className="text-xs text-muted">{line.name} · Warm · Professional</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Friendly", "Excited", "Calm", "Professional"].map((e, i) => (
                  <span key={e} className={cn("chip", i === 0 ? "bg-navy text-white" : "bg-canvas text-body")}>{e}</span>
                ))}
              </div>
              <div className="space-y-1.5 pt-1">
                {[0.92, 0.64, 0.38].map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-14 font-mono text-muted">0:0{i * 3 + 1}.2</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full bg-purple transition-[width] duration-700" style={{ width: `${Math.min(100, (progress * 1.6 + w - 0.4) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="ld-fade-up space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Export</p>
              {[
                ["MP4 video", `Product launch keynote_${lang}.mp4`],
                ["Subtitles", `${lang}.srt · ${lang}.vtt`],
                ["Dub track", "MP3 · WAV"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy">{k}</p>
                    <p className="truncate text-xs text-muted">{v}</p>
                  </div>
                  <Download size={16} className="shrink-0 text-blue" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
            <span>Step {step + 1} of 4</span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setStep((s) => (s + 1) % 4);
                setAuto(false);
              }}
            >
              {step === 3 ? "Start again" : "Next step"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
