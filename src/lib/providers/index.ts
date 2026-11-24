import "server-only";
import { elevenLabsStt, elevenLabsTts, elevenLabsCloning } from "./elevenlabs";
import { openAiStt, openAiTts, openAiTranslation } from "./openai";
import { deepL } from "./deepl";
import {
  ProviderNotConfiguredError, type SpeechToTextProvider, type TextToSpeechProvider, type TranslationProvider, type VoiceCloningProvider,
} from "./types";

const has = {
  elevenlabs: () => Boolean(process.env.ELEVENLABS_API_KEY),
  openai: () => Boolean(process.env.OPENAI_API_KEY),
  deepl: () => Boolean(process.env.DEEPL_API_KEY),
};

const STT: Record<string, { p: SpeechToTextProvider; ok: () => boolean }> = {
  elevenlabs: { p: elevenLabsStt, ok: has.elevenlabs },
  openai: { p: openAiStt, ok: has.openai },
};
const MT: Record<string, { p: TranslationProvider; ok: () => boolean }> = {
  deepl: { p: deepL, ok: has.deepl },
  openai: { p: openAiTranslation, ok: has.openai },
};
const TTS: Record<string, { p: TextToSpeechProvider; ok: () => boolean }> = {
  elevenlabs: { p: elevenLabsTts, ok: has.elevenlabs },
  openai: { p: openAiTts, ok: has.openai },
};
const CLONE: Record<string, { p: VoiceCloningProvider; ok: () => boolean }> = {
  elevenlabs: { p: elevenLabsCloning, ok: has.elevenlabs },
};

function pick<T>(table: Record<string, { p: T; ok: () => boolean }>, preferred: string | undefined): T | null {
  if (preferred && table[preferred]?.ok()) return table[preferred].p;
  for (const k of Object.keys(table)) if (table[k].ok()) return table[k].p;
  return null;
}

export function sttProvider() { return pick(STT, process.env.STT_PROVIDER); }
export function translationProvider() { return pick(MT, process.env.TRANSLATION_PROVIDER); }
export function ttsProvider() { return pick(TTS, process.env.TTS_PROVIDER); }
export function cloningProvider() { return pick(CLONE, process.env.VOICE_CLONING_PROVIDER); }
export function ttsProviderById(id: string) { return TTS[id]?.ok() ? TTS[id].p : null; }

export function requireStt() { const p = sttProvider(); if (!p) throw new ProviderNotConfiguredError("speech to text"); return p; }
export function requireTranslation() { const p = translationProvider(); if (!p) throw new ProviderNotConfiguredError("translation"); return p; }
export function requireTts() { const p = ttsProvider(); if (!p) throw new ProviderNotConfiguredError("text to speech"); return p; }
export function requireCloning() { const p = cloningProvider(); if (!p) throw new ProviderNotConfiguredError("voice cloning"); return p; }

export interface Capabilities {
  stt: { provider: string; name: string; languages: string[]; diarization: boolean } | null;
  translation: { provider: string; name: string; source: string[]; target: string[] } | null;
  tts: { provider: string; name: string; languages: string[]; emotionMode: string; accentByInstruction: boolean } | null;
  cloning: { provider: string; name: string } | null;
  lipSync: null;
  rendering: boolean;
  /** Languages usable as a source: supported by speech to text and translation. */
  sourceLanguages: string[];
  /** Languages usable as a dubbing target: supported by translation and text to speech. */
  targetLanguages: string[];
}

export function capabilities(): Capabilities {
  const s = sttProvider();
  const t = translationProvider();
  const v = ttsProvider();
  const c = cloningProvider();
  return {
    stt: s ? { provider: s.id, name: s.name, languages: s.languages, diarization: s.diarization } : null,
    translation: t ? { provider: t.id, name: t.name, source: t.sourceLanguages, target: t.targetLanguages } : null,
    tts: v ? { provider: v.id, name: v.name, languages: v.languages, emotionMode: v.emotionMode, accentByInstruction: v.accentByInstruction } : null,
    cloning: c ? { provider: c.id, name: c.name } : null,
    lipSync: null,
    rendering: true,
    sourceLanguages: s && t ? s.languages.filter((l) => t.sourceLanguages.includes(l)) : [],
    targetLanguages: t && v ? t.targetLanguages.filter((l) => v.languages.includes(l)) : [],
  };
}
