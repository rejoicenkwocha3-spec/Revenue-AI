export const ACCEPTED_MEDIA: Record<string, "video" | "audio"> = {
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
  "video/x-matroska": "video",
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/wave": "audio",
  "audio/mp4": "audio",
  "audio/x-m4a": "audio",
  "audio/aac": "audio",
  "audio/ogg": "audio",
  "audio/flac": "audio",
  "audio/x-flac": "audio",
};

export const ACCEPT_ATTR = "video/mp4,video/quicktime,video/webm,video/x-matroska,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/flac,.mkv,.m4a,.flac";

/** Supabase Storage's default per file limit is 50 MB on the free tier; raise it in the dashboard for larger media. */
export const MAX_UPLOAD_BYTES = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? "2048") * 1024 * 1024;

export const SAMPLE_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/ogg", "audio/flac"];
