import { providerFetch, normaliseLanguage } from "./http";
import type {
  SpeechToTextProvider, TextToSpeechProvider, VoiceCloningProvider, VoiceInfo, TranscriptSegment, SynthesisInput,
} from "./types";

const BASE = "https://api.elevenlabs.io/v1";
const ID = "elevenlabs";

function key() {
  return process.env.ELEVENLABS_API_KEY as string;
}

// Scribe speech to text covers every language in the LinguaDub catalogue.
const STT_LANGS = ["en","es","fr","de","pt","ar","hi","zh","ja","ko","it","nl","tr","yo","ha","ig","sw","pl","ru","id"];
// Languages supported by Eleven Multilingual v2, intersected with the catalogue.
const TTS_LANGS = ["en","es","fr","de","pt","ar","hi","zh","ja","ko","it","nl","tr","pl","ru","id"];

/** Delivery presets: lower stability and higher style produce more expressive reads. */
const EMOTION_SETTINGS: Record<string, { stability: number; style: number }> = {
  neutral: { stability: 0.5, style: 0.0 },
  calm: { stability: 0.8, style: 0.05 },
  professional: { stability: 0.7, style: 0.1 },
  serious: { stability: 0.75, style: 0.15 },
  friendly: { stability: 0.45, style: 0.35 },
  sad: { stability: 0.6, style: 0.45 },
  excited: { stability: 0.3, style: 0.65 },
  enthusiastic: { stability: 0.3, style: 0.7 },
  dramatic: { stability: 0.25, style: 0.8 },
};

interface ScribeWord { text: string; start: number; end: number; type: string; speaker_id?: string }

/** Groups word level output into dialogue segments on speaker change, long pauses and sentence ends. */
export function groupWords(words: ScribeWord[]): TranscriptSegment[] {
  const out: TranscriptSegment[] = [];
  let cur: { start: number; end: number; text: string; speaker: string | null } | null = null;
  for (const w of words) {
    if (w.type === "audio_event") continue;
    if (w.type === "spacing") {
      if (cur) cur.text += w.text;
      continue;
    }
    const speaker = w.speaker_id ?? null;
    const gap = cur ? w.start - cur.end : 0;
    const len = cur ? cur.end - cur.start : 0;
    const sentenceEnd = cur ? /[.!?。！？]\s*$/.test(cur.text) : false;
    if (!cur || speaker !== cur.speaker || gap > 0.9 || (sentenceEnd && len > 4) || len > 14) {
      if (cur) out.push({ startMs: Math.round(cur.start * 1000), endMs: Math.round(cur.end * 1000), text: cur.text.trim(), speaker: cur.speaker });
      cur = { start: w.start, end: w.end, text: w.text, speaker };
    } else {
      cur.text += w.text;
      cur.end = w.end;
    }
  }
  if (cur) out.push({ startMs: Math.round(cur.start * 1000), endMs: Math.round(cur.end * 1000), text: cur.text.trim(), speaker: cur.speaker });
  return out.filter((s) => s.text.length > 0);
}

export const elevenLabsStt: SpeechToTextProvider = {
  id: ID,
  name: "ElevenLabs Scribe",
  languages: STT_LANGS,
  diarization: true,
  async transcribe({ audio, fileName, mimeType, language }) {
    const form = new FormData();
    form.append("model_id", process.env.ELEVENLABS_STT_MODEL || "scribe_v1");
    form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), fileName);
    form.append("diarize", "true");
    form.append("timestamps_granularity", "word");
    form.append("tag_audio_events", "false");
    if (language) form.append("language_code", language);
    const res = await providerFetch(ID, `${BASE}/speech-to-text`, { method: "POST", headers: { "xi-api-key": key() }, body: form }, { timeoutMs: 600_000 });
    const data = (await res.json()) as { language_code?: string; text?: string; words?: ScribeWord[] };
    return {
      language: normaliseLanguage(data.language_code) ?? language ?? null,
      text: data.text ?? "",
      segments: groupWords(data.words ?? []),
    };
  },
};

interface ElevenVoice {
  voice_id: string; name: string; category?: string; preview_url?: string | null; description?: string | null;
  labels?: Record<string, string>; verified_languages?: { language: string; accent?: string }[];
}

export const elevenLabsTts: TextToSpeechProvider = {
  id: ID,
  name: "ElevenLabs",
  languages: TTS_LANGS,
  emotionMode: "settings",
  accentByInstruction: false,
  async listVoices(): Promise<VoiceInfo[]> {
    const res = await providerFetch(ID, `${BASE}/voices`, { headers: { "xi-api-key": key() } }, { retries: 2, timeoutMs: 30_000 });
    const data = (await res.json()) as { voices: ElevenVoice[] };
    return data.voices.map((v) => {
      const verified = (v.verified_languages ?? []).map((l) => normaliseLanguage(l.language)).filter(Boolean) as string[];
      return {
        provider: ID,
        voiceId: v.voice_id,
        name: v.name,
        accent: v.labels?.accent ?? v.verified_languages?.[0]?.accent ?? null,
        gender: v.labels?.gender ?? null,
        age: v.labels?.age ?? null,
        style: v.labels?.use_case ?? v.labels?.description ?? null,
        description: v.description ?? v.labels?.description ?? null,
        // Multilingual models let every voice speak every supported language.
        languages: verified.length ? Array.from(new Set([...verified, ...TTS_LANGS])) : TTS_LANGS,
        previewUrl: v.preview_url ?? null,
        category: v.category ?? null,
      };
    });
  },
  async synthesize(input: SynthesisInput) {
    const preset = EMOTION_SETTINGS[input.emotion ?? "neutral"] ?? EMOTION_SETTINGS.neutral;
    const speed = Math.min(1.2, Math.max(0.7, input.speed ?? 1));
    const res = await providerFetch(
      ID,
      `${BASE}/text-to-speech/${encodeURIComponent(input.voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key(), "content-type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({
          text: input.text,
          model_id: process.env.ELEVENLABS_TTS_MODEL || "eleven_multilingual_v2",
          voice_settings: { stability: preset.stability, similarity_boost: 0.8, style: preset.style, use_speaker_boost: true, speed },
        }),
      },
      { timeoutMs: 120_000 },
    );
    return Buffer.from(await res.arrayBuffer());
  },
};

export const elevenLabsCloning: VoiceCloningProvider = {
  id: ID,
  name: "ElevenLabs Instant Voice Cloning",
  async cloneVoice({ name, description, files, labels }) {
    const form = new FormData();
    form.append("name", name);
    if (description) form.append("description", description);
    if (labels) form.append("labels", JSON.stringify(labels));
    form.append("remove_background_noise", "true");
    for (const f of files) form.append("files", new Blob([new Uint8Array(f.data)], { type: f.mimeType }), f.fileName);
    const res = await providerFetch(ID, `${BASE}/voices/add`, { method: "POST", headers: { "xi-api-key": key() }, body: form }, { retries: 1, timeoutMs: 300_000 });
    const data = (await res.json()) as { voice_id: string };
    return { voiceId: data.voice_id };
  },
  async deleteVoice(voiceId) {
    await providerFetch(ID, `${BASE}/voices/${encodeURIComponent(voiceId)}`, { method: "DELETE", headers: { "xi-api-key": key() } }, { retries: 1 });
  },
};
