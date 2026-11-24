import { providerFetch, normaliseLanguage } from "./http";
import type { SpeechToTextProvider, TextToSpeechProvider, TranslationProvider, VoiceInfo, SynthesisInput } from "./types";
import { LANGUAGES, languageName } from "@/config/languages";

const BASE = "https://api.openai.com/v1";
const ID = "openai";
const auth = () => ({ authorization: `Bearer ${process.env.OPENAI_API_KEY}` });

// Languages OpenAI documents for its speech models, intersected with the catalogue.
const SPEECH_LANGS = ["en","es","fr","de","pt","ar","hi","zh","ja","ko","it","nl","tr","sw","pl","ru","id"];
// Large language model translation covers the full catalogue.
const TRANSLATION_LANGS = LANGUAGES.map((l) => l.code);

export const openAiStt: SpeechToTextProvider = {
  id: ID,
  name: "OpenAI Whisper",
  languages: SPEECH_LANGS,
  diarization: false,
  async transcribe({ audio, fileName, mimeType, language }) {
    if (audio.length > 25 * 1024 * 1024) {
      throw new Error("OpenAI transcription accepts audio up to 25 MB. Use ElevenLabs for longer media.");
    }
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), fileName);
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");
    if (language) form.append("language", language);
    const res = await providerFetch(ID, `${BASE}/audio/transcriptions`, { method: "POST", headers: auth(), body: form }, { timeoutMs: 600_000 });
    const data = (await res.json()) as { language?: string; text?: string; segments?: { start: number; end: number; text: string }[] };
    return {
      language: normaliseLanguage(data.language) ?? language ?? null,
      text: data.text ?? "",
      segments: (data.segments ?? [])
        .map((s) => ({ startMs: Math.round(s.start * 1000), endMs: Math.round(s.end * 1000), text: s.text.trim(), speaker: null }))
        .filter((s) => s.text),
    };
  },
};

export const openAiTranslation: TranslationProvider = {
  id: ID,
  name: "OpenAI",
  sourceLanguages: TRANSLATION_LANGS,
  targetLanguages: TRANSLATION_LANGS,
  async translate({ texts, source, target, context }) {
    if (texts.length === 0) return [];
    const system =
      `You are a professional dubbing translator. Translate each line from ${source ? languageName(source) : "the detected language"} ` +
      `into ${languageName(target)}. Keep meaning, tone and register. Keep each line short enough to be spoken in roughly the same time as the original. ` +
      `Return JSON {"lines": string[]} with exactly ${texts.length} items in the same order. Do not merge or split lines.` +
      (context ? ` Context about the content: ${context}` : "");
    const res = await providerFetch(ID, `${BASE}/chat/completions`, {
      method: "POST",
      headers: { ...auth(), "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATION_MODEL || "gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify({ lines: texts }) },
        ],
      }),
    });
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0]?.message?.content ?? "{}") as { lines?: unknown };
    if (!Array.isArray(parsed.lines) || parsed.lines.length !== texts.length) {
      throw new Error("Translation response did not preserve the line count. The job will retry.");
    }
    return parsed.lines.map((l) => String(l));
  },
};

const OPENAI_VOICES: { id: string; gender: string; style: string; description: string }[] = [
  { id: "alloy", gender: "neutral", style: "Conversational", description: "Balanced and clear" },
  { id: "ash", gender: "male", style: "Professional", description: "Warm and direct" },
  { id: "ballad", gender: "male", style: "Dramatic", description: "Expressive storyteller" },
  { id: "coral", gender: "female", style: "Conversational", description: "Bright and friendly" },
  { id: "echo", gender: "male", style: "Calm", description: "Even and measured" },
  { id: "fable", gender: "neutral", style: "Documentary", description: "Narrative and articulate" },
  { id: "onyx", gender: "male", style: "Documentary", description: "Deep and authoritative" },
  { id: "nova", gender: "female", style: "Energetic", description: "Lively and upbeat" },
  { id: "sage", gender: "female", style: "Educational", description: "Clear and patient" },
  { id: "shimmer", gender: "female", style: "Calm", description: "Soft and reassuring" },
  { id: "verse", gender: "male", style: "Energetic", description: "Dynamic and versatile" },
];

const EMOTION_DIRECTION: Record<string, string> = {
  neutral: "Speak naturally.",
  excited: "Speak with excitement and high energy.",
  calm: "Speak calmly and slowly with a relaxed tone.",
  sad: "Speak with a subdued, sad tone.",
  serious: "Speak in a serious, focused tone.",
  friendly: "Speak in a warm, friendly tone.",
  dramatic: "Speak dramatically with strong emphasis and pauses.",
  professional: "Speak in a polished, professional tone.",
  enthusiastic: "Speak enthusiastically and positively.",
};

export const openAiTts: TextToSpeechProvider = {
  id: ID,
  name: "OpenAI",
  languages: SPEECH_LANGS,
  emotionMode: "instructions",
  accentByInstruction: true,
  async listVoices(): Promise<VoiceInfo[]> {
    return OPENAI_VOICES.map((v) => ({
      provider: ID,
      voiceId: v.id,
      name: v.id.charAt(0).toUpperCase() + v.id.slice(1),
      accent: null,
      gender: v.gender,
      age: null,
      style: v.style,
      description: v.description,
      languages: SPEECH_LANGS,
      previewUrl: null,
      category: "premade",
    }));
  },
  async synthesize(input: SynthesisInput) {
    const instructions = [
      EMOTION_DIRECTION[input.emotion ?? "neutral"] ?? EMOTION_DIRECTION.neutral,
      `Speak in ${languageName(input.language)}.`,
      input.accent ? `Use a ${input.accent} accent.` : "",
    ].join(" ");
    const res = await providerFetch(ID, `${BASE}/audio/speech`, {
      method: "POST",
      headers: { ...auth(), "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: input.voiceId,
        input: input.text,
        instructions,
        response_format: "mp3",
      }),
    });
    return Buffer.from(await res.arrayBuffer());
  },
};
