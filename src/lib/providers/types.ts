import type { Emotion } from "@/config/languages";

export interface TranscriptSegment {
  startMs: number;
  endMs: number;
  text: string;
  /** Provider speaker label, e.g. "speaker_0". Null when diarisation is unavailable. */
  speaker: string | null;
}

export interface TranscriptResult {
  language: string | null;
  text: string;
  segments: TranscriptSegment[];
}

export interface SpeechToTextProvider {
  id: string;
  name: string;
  languages: string[];
  diarization: boolean;
  transcribe(input: { audio: Buffer; fileName: string; mimeType: string; language?: string | null }): Promise<TranscriptResult>;
}

export interface TranslationProvider {
  id: string;
  name: string;
  sourceLanguages: string[];
  targetLanguages: string[];
  translate(input: { texts: string[]; source: string | null; target: string; context?: string }): Promise<string[]>;
}

export interface VoiceInfo {
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

export interface SynthesisInput {
  text: string;
  voiceId: string;
  language: string;
  emotion?: Emotion | string | null;
  accent?: string | null;
  speed?: number;
}

export interface TextToSpeechProvider {
  id: string;
  name: string;
  languages: string[];
  /** How emotion is applied: "settings" (delivery parameters), "instructions" (natural language direction). */
  emotionMode: "settings" | "instructions";
  /** Whether an accent can be requested independently of the voice. */
  accentByInstruction: boolean;
  listVoices(): Promise<VoiceInfo[]>;
  synthesize(input: SynthesisInput): Promise<Buffer>;
}

export interface VoiceCloningProvider {
  id: string;
  name: string;
  cloneVoice(input: {
    name: string;
    description?: string;
    files: { data: Buffer; fileName: string; mimeType: string }[];
    labels?: Record<string, string>;
  }): Promise<{ voiceId: string }>;
  deleteVoice(voiceId: string): Promise<void>;
}

export class ProviderError extends Error {
  constructor(public provider: string, message: string, public retryable = false, public status?: number) {
    super(`${provider}: ${message}`);
  }
}

export class ProviderNotConfiguredError extends Error {
  constructor(capability: string) {
    super(`No ${capability} provider is configured. Add the provider API key to the server environment.`);
  }
}
