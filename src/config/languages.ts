/**
 * The LinguaDub language catalogue. A language is only offered for a capability
 * when the configured provider for that capability supports it (see
 * src/lib/providers). Add languages here; provider adapters declare support.
 */
export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
  { code: "ha", name: "Hausa", nativeName: "Hausa" },
  { code: "ig", name: "Igbo", nativeName: "Igbo" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
];

export function languageName(code: string | null | undefined): string {
  if (!code) return "Unknown";
  return LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase();
}

export const EMOTIONS = [
  "neutral",
  "excited",
  "calm",
  "sad",
  "serious",
  "friendly",
  "dramatic",
  "professional",
  "enthusiastic",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const VOICE_STYLES = [
  "Professional",
  "Conversational",
  "Energetic",
  "Calm",
  "Documentary",
  "Educational",
  "Dramatic",
] as const;
