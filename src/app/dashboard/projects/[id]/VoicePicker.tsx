"use client";
import { useEffect, useMemo, useState } from "react";
import { Play, Pause, Star, Search, Loader2, Check, Fingerprint } from "lucide-react";
import { Modal } from "@/components/app/Modal";
import { api } from "@/lib/client-api";
import { VOICE_STYLES } from "@/config/languages";
import { cn } from "@/lib/utils";

export interface Voice {
  provider: string;
  voiceId: string;
  name: string;
  accent: string | null;
  gender: string | null;
  age: string | null;
  style: string | null;
  description: string | null;
  languages: string[];
  previewUrl: string | null;
  category: string | null;
}
export interface VoicesResponse {
  provider: { id: string; name: string; emotionMode: string; accentByInstruction: boolean } | null;
  voices: Voice[];
  cloned: Voice[];
  favourites: string[];
  error: string | null;
}

let voicesPromise: Promise<VoicesResponse> | null = null;
export function loadVoices(force = false) {
  if (!voicesPromise || force) voicesPromise = api<VoicesResponse>("/api/voices").catch((e) => { voicesPromise = null; throw e; });
  return voicesPromise;
}

const SAMPLE: Record<string, string> = {
  en: "Hello, this is a preview of my voice.",
  es: "Hola, esta es una muestra de mi voz.",
  fr: "Bonjour, voici un aperçu de ma voix.",
  de: "Hallo, das ist eine Hörprobe meiner Stimme.",
  pt: "Olá, esta é uma amostra da minha voz.",
  it: "Ciao, questa è un'anteprima della mia voce.",
  nl: "Hallo, dit is een voorbeeld van mijn stem.",
  ja: "こんにちは、これは私の声のサンプルです。",
  ko: "안녕하세요, 제 목소리 미리 듣기입니다.",
  zh: "你好，这是我的声音试听。",
  hi: "नमस्ते, यह मेरी आवाज़ का नमूना है।",
  ar: "مرحبا، هذه معاينة لصوتي.",
  tr: "Merhaba, bu sesimin bir önizlemesi.",
  pl: "Cześć, to jest próbka mojego głosu.",
  ru: "Здравствуйте, это образец моего голоса.",
  id: "Halo, ini adalah contoh suara saya.",
  sw: "Habari, huu ni mfano wa sauti yangu.",
};
export const sampleText = (lang: string) => SAMPLE[lang] ?? SAMPLE.en;

export function useVoicePreview() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [audio] = useState(() => (typeof Audio !== "undefined" ? new Audio() : null));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!audio) return;
    const end = () => setPlaying(null);
    audio.addEventListener("ended", end);
    return () => { audio.pause(); audio.removeEventListener("ended", end); };
  }, [audio]);
  async function toggle(v: Voice, language: string, text?: string, emotion?: string, accent?: string | null) {
    if (!audio) return;
    const key = `${v.provider}:${v.voiceId}:${text ?? ""}`;
    setError(null);
    if (playing === key) { audio.pause(); setPlaying(null); return; }
    try {
      setLoading(key);
      let url = !text && v.previewUrl ? v.previewUrl : null;
      if (!url) {
        const r = await api<{ url: string }>("/api/voices/preview", { body: { provider: v.provider, voiceId: v.voiceId, language, text: (text ?? sampleText(language)).slice(0, 240), emotion, accent } });
        url = r.url;
      }
      audio.src = url;
      await audio.play();
      setPlaying(key);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }
  return { playing, loading, toggle, error };
}

export function VoicePicker({
  open, onClose, language, onSelect, selectedId,
}: { open: boolean; onClose: () => void; language: string | null; onSelect?: (v: Voice) => void; selectedId?: string | null }) {
  const [data, setData] = useState<VoicesResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (open) loadVoices().then(setData).catch((e) => setErr(e.message));
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Choose a voice">
      {err && <p className="text-sm text-danger">{err}</p>}
      {!data && !err && <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="ld-spin" /> Loading voices</p>}
      {data && <VoiceBrowser data={data} language={language} onSelect={(v) => { onSelect?.(v); onClose(); }} selectedId={selectedId} compact />}
    </Modal>
  );
}

export function VoiceBrowser({
  data, language, onSelect, selectedId, compact = false,
}: { data: VoicesResponse; language: string | null; onSelect?: (v: Voice) => void; selectedId?: string | null; compact?: boolean }) {
  const [q, setQ] = useState("");
  const [accent, setAccent] = useState("");
  const [gender, setGender] = useState("");
  const [style, setStyle] = useState("");
  const [lang, setLang] = useState(language ?? "");
  const [favOnly, setFavOnly] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(new Set(data.favourites));
  const preview = useVoicePreview();

  const all = useMemo(() => [...data.cloned, ...data.voices], [data]);
  const accents = useMemo(() => Array.from(new Set(all.map((v) => v.accent).filter(Boolean) as string[])).sort(), [all]);
  const genders = useMemo(() => Array.from(new Set(all.map((v) => v.gender).filter(Boolean) as string[])).sort(), [all]);
  const languages = useMemo(() => Array.from(new Set(all.flatMap((v) => v.languages))).sort(), [all]);
  const filtered = all.filter((v) => {
    if (q && !`${v.name} ${v.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (accent && v.accent !== accent) return false;
    if (gender && v.gender !== gender) return false;
    if (style && !(v.style ?? "").toLowerCase().includes(style.toLowerCase()) && !(v.description ?? "").toLowerCase().includes(style.toLowerCase())) return false;
    if (lang && !v.languages.includes(lang)) return false;
    if (favOnly && !favs.has(`${v.provider}:${v.voiceId}`)) return false;
    return true;
  });

  async function toggleFav(v: Voice) {
    const key = `${v.provider}:${v.voiceId}`;
    const on = !favs.has(key);
    setFavs((s) => { const n = new Set(s); if (on) n.add(key); else n.delete(key); return n; });
    try {
      await api("/api/voices/favourites", { body: { provider: v.provider, voiceId: v.voiceId, name: v.name, favourite: on } });
    } catch {
      setFavs((s) => { const n = new Set(s); if (on) n.delete(key); else n.add(key); return n; });
    }
  }

  if (!data.provider) return <p className="text-sm text-muted">No voice provider is configured. Add ELEVENLABS_API_KEY or OPENAI_API_KEY on the server to load voices.</p>;
  const previewLang = lang || language || "en";

  return (
    <div>
      {data.error && <p className="mb-3 rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-danger">Could not load provider voices: {data.error}</p>}
      {preview.error && <p className="mb-3 rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-danger">{preview.error}</p>}
      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-6")}>
        <label className={cn("relative", compact ? "col-span-2" : "col-span-2 md:col-span-3 xl:col-span-2")}>
          <span className="sr-only">Search voices</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9 text-sm" placeholder="Search voices" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select aria-label="Language" className="input text-sm" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="">Any language</option>
          {languages.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
        <select aria-label="Accent" className="input text-sm" value={accent} onChange={(e) => setAccent(e.target.value)}>
          <option value="">Any accent</option>
          {accents.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select aria-label="Gender presentation" className="input text-sm" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Any gender presentation</option>
          {genders.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select aria-label="Speaking style" className="input text-sm" value={style} onChange={(e) => setStyle(e.target.value)}>
          <option value="">Any style</option>
          {VOICE_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-sm text-body">
        <input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} /> Favourites only
      </label>
      <p className="mt-2 text-xs text-muted">{filtered.length} voices from {data.provider.name}</p>
      <ul className={cn("mt-3 grid gap-2", !compact && "md:grid-cols-2 xl:grid-cols-3")}>
        {filtered.map((v) => {
          const key = `${v.provider}:${v.voiceId}`;
          const pkey = `${key}:`;
          const selected = selectedId === v.voiceId;
          return (
            <li key={key} className={cn("flex items-center gap-3 rounded-xl border p-3", selected ? "border-blue bg-blue-50" : "border-line bg-white")}>
              <button type="button" onClick={() => preview.toggle(v, previewLang)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender text-purple hover:bg-purple hover:text-white" aria-label={`Preview ${v.name}`}>
                {preview.loading === pkey ? <Loader2 size={16} className="ld-spin" /> : preview.playing === pkey ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-semibold text-navy">
                  {v.category === "cloned" && <Fingerprint size={14} className="shrink-0 text-coral" />}
                  {v.name}
                </p>
                <p className="truncate text-xs text-muted">{[v.accent, v.gender, v.style, v.age].filter(Boolean).join(" · ") || v.description || "Multilingual"}</p>
              </div>
              <button type="button" onClick={() => toggleFav(v)} aria-label={favs.has(key) ? "Remove favourite" : "Save as favourite"} className="rounded-lg p-1.5 text-muted hover:bg-canvas">
                <Star size={16} className={favs.has(key) ? "fill-coral text-coral" : ""} />
              </button>
              {onSelect && (
                <button type="button" onClick={() => onSelect(v)} className={cn("btn btn-sm", selected ? "btn-dark" : "btn-outline")}>
                  {selected ? <><Check size={14} /> Selected</> : "Select"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {!filtered.length && <p className="py-6 text-center text-sm text-muted">No voices match these filters.</p>}
    </div>
  );
}
