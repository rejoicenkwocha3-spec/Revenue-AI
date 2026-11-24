import { notFound } from "next/navigation";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { capabilities } from "@/lib/providers";
import { can } from "@/lib/permissions";
import { getEntitlements } from "@/lib/billing";
import { Workspace } from "./Workspace";
import type { WorkspaceData } from "./types";

export const metadata = { title: "Dubbing workspace" };

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!project) notFound();
  const role = ctx.memberships.find((m) => m.orgId === project.org_id)?.role ?? ctx.role;

  const [media, speakers, segments, translations, jobs, generated, subtitles, exports, transcription, ent] = await Promise.all([
    supabase.from("media_files").select("id, kind, bucket, storage_path, file_name, mime_type, size_bytes, duration_seconds, width, height").eq("project_id", id),
    supabase.from("speakers").select("*").eq("project_id", id).order("display_name"),
    supabase.from("transcript_segments").select("id, idx, start_ms, end_ms, source_text, speaker_id").eq("project_id", id).order("idx"),
    supabase.from("translation_segments").select("id, segment_id, target_language, text, start_ms, end_ms, speed, pause_ms, offset_ms, emotion, status, provider").eq("project_id", id),
    supabase.from("processing_jobs").select("id, type, target_language, status, attempts, max_attempts, error, result, created_at, started_at, finished_at, run_after").eq("project_id", id).order("created_at", { ascending: false }).limit(60),
    supabase.from("generated_audio").select("id, translation_segment_id, target_language, kind, storage_path, duration_ms").eq("project_id", id),
    supabase.from("subtitles").select("id, language, is_source, format, storage_path, timing_offset_ms").eq("project_id", id),
    supabase.from("export_records").select("id, target_language, kind, format, storage_path, size_bytes, created_at").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("transcriptions").select("language, provider, word_count, created_at").eq("project_id", id).maybeSingle(),
    getEntitlements(project.org_id),
  ]);

  const caps = capabilities();
  const data: WorkspaceData = {
    project: {
      id: project.id,
      orgId: project.org_id,
      name: project.name,
      description: project.description,
      status: project.status,
      statusDetail: project.status_detail,
      sourceLanguage: project.source_language,
      targetLanguages: project.target_languages ?? [],
      mediaKind: project.media_kind,
      durationSeconds: project.duration_seconds ? Number(project.duration_seconds) : null,
      originalAudioVolume: Number(project.original_audio_volume ?? 0),
      approvalStatus: project.approval_status,
    },
    media: (media.data ?? []).map((m) => ({ ...m, size_bytes: Number(m.size_bytes), duration_seconds: m.duration_seconds ? Number(m.duration_seconds) : null })),
    speakers: speakers.data ?? [],
    segments: segments.data ?? [],
    translations: (translations.data ?? []).map((t) => ({ ...t, speed: Number(t.speed) })),
    jobs: jobs.data ?? [],
    generated: generated.data ?? [],
    subtitles: subtitles.data ?? [],
    exports: (exports.data ?? []).map((e) => ({ ...e, size_bytes: Number(e.size_bytes ?? 0) })),
    transcription: transcription.data ?? null,
    caps: {
      sttProvider: caps.stt?.name ?? null,
      diarization: caps.stt?.diarization ?? false,
      translationProvider: caps.translation?.name ?? null,
      ttsProvider: caps.tts?.name ?? null,
      targetLanguages: caps.targetLanguages,
      accentByInstruction: caps.tts?.accentByInstruction ?? false,
    },
    permissions: {
      edit: can(role, "project.edit"),
      run: can(role, "pipeline.run"),
      translate: can(role, "translation.edit"),
      approve: can(role, "dub.approve"),
      upload: can(role, "media.upload"),
    },
    limits: { targetLanguagesPerProject: ent.targetLanguagesPerProject, minutesRemaining: ent.minutesRemaining, minutesIncluded: ent.minutesIncluded },
  };
  return <Workspace data={data} />;
}
