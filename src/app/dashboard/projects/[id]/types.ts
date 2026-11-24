export interface WsSpeaker {
  id: string;
  label: string;
  display_name: string;
  color: string | null;
  voice_provider: string | null;
  voice_id: string | null;
  voice_name: string | null;
  accent: string | null;
  emotion: string;
}
export interface WsSegment {
  id: string;
  idx: number;
  start_ms: number;
  end_ms: number;
  source_text: string;
  speaker_id: string | null;
}
export interface WsTranslation {
  id: string;
  segment_id: string;
  target_language: string;
  text: string;
  start_ms: number;
  end_ms: number;
  speed: number;
  pause_ms: number;
  offset_ms: number;
  emotion: string | null;
  status: string;
  provider: string | null;
}
export interface WsJob {
  id: string;
  type: string;
  target_language: string | null;
  status: string;
  attempts: number;
  max_attempts: number;
  error: string | null;
  result: Record<string, unknown> | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  run_after: string;
}
export interface WorkspaceData {
  project: {
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    status: string;
    statusDetail: string | null;
    sourceLanguage: string | null;
    targetLanguages: string[];
    mediaKind: string | null;
    durationSeconds: number | null;
    originalAudioVolume: number;
    approvalStatus: string;
  };
  media: { id: string; kind: string; bucket: string; storage_path: string; file_name: string; mime_type: string; size_bytes: number; duration_seconds: number | null; width: number | null; height: number | null }[];
  speakers: WsSpeaker[];
  segments: WsSegment[];
  translations: WsTranslation[];
  jobs: WsJob[];
  generated: { id: string; translation_segment_id: string | null; target_language: string; kind: string; storage_path: string; duration_ms: number | null }[];
  subtitles: { id: string; language: string; is_source: boolean; format: string; storage_path: string; timing_offset_ms: number }[];
  exports: { id: string; target_language: string; kind: string; format: string; storage_path: string; size_bytes: number; created_at: string }[];
  transcription: { language: string | null; provider: string; word_count: number | null; created_at: string } | null;
  caps: {
    sttProvider: string | null;
    diarization: boolean;
    translationProvider: string | null;
    ttsProvider: string | null;
    targetLanguages: string[];
    accentByInstruction: boolean;
  };
  permissions: { edit: boolean; run: boolean; translate: boolean; approve: boolean; upload: boolean };
  limits: { targetLanguagesPerProject: number; minutesRemaining: number; minutesIncluded: number };
}
