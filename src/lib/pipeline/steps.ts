import "server-only";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStt, requireTranslation, requireTts, ttsProviderById } from "@/lib/providers";
import { BUCKETS, downloadToFile, uploadBuffer, uploadFile } from "@/lib/storage";
import { probe, extractAudio, durationMs, changeTempo, buildTrack, muxVideo, transcode } from "@/lib/media/ffmpeg";
import { toSrt, toVtt, applyOffset, type Cue } from "@/lib/subtitles";
import { languageName } from "@/config/languages";
import { safeFileName } from "@/lib/utils";
import type { JobRow, JobType } from "./queue";

export class JobDeferred extends Error {
  constructor(public progress: Record<string, unknown>) {
    super("deferred");
  }
}

export interface StepResult {
  result?: Record<string, unknown>;
  next?: { type: JobType; targetLanguage?: string | null; payload?: Record<string, unknown> }[];
  projectStatus?: string;
  statusDetail?: string | null;
  notifyTitle?: string;
  notifyBody?: string;
}

const SPEAKER_COLORS = ["#2463EB", "#7047EB", "#FF786B", "#0EA5A4", "#D97706", "#DB2777", "#4B5563", "#16A34A"];
const MAX_TEMPO = 1.35;

async function withTmp<T>(jobId: string, fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `linguadub-${jobId.slice(0, 8)}-`));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function must<T>(v: T | null | undefined, msg: string): T {
  if (v == null) throw new Error(msg);
  return v;
}

async function getProject(projectId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("projects").select("*").eq("id", projectId).single();
  if (error || !data) throw new Error("Project no longer exists.");
  return data;
}

async function sourceMedia(projectId: string, kind: "original" | "extracted") {
  const admin = createAdminClient();
  const q = admin.from("media_files").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1);
  const { data } = kind === "extracted" ? await q.eq("kind", "extracted_audio") : await q.in("kind", ["video", "audio"]);
  return data?.[0] ?? null;
}

export async function runJob(job: JobRow, deadline: number): Promise<StepResult> {
  switch (job.type) {
    case "extract_audio":
      return extractStep(job);
    case "transcribe":
      return transcribeStep(job);
    case "translate":
      return translateStep(job);
    case "generate_voice":
      return generateStep(job, deadline);
    case "synchronise":
      return synchroniseStep(job);
    case "subtitles":
      return subtitlesStep(job);
    case "render":
      return renderStep(job);
  }
}

/* STEP 2: extract audio from the uploaded media. */
async function extractStep(job: JobRow): Promise<StepResult> {
  const admin = createAdminClient();
  const media = must(await sourceMedia(job.project_id, "original"), "Upload a video or audio file before processing.");
  return withTmp(job.id, async (dir) => {
    const input = path.join(dir, `input${path.extname(media.file_name) || ".bin"}`);
    await downloadToFile(media.bucket, media.storage_path, input);
    const info = await probe(input);
    if (!info.hasAudio) throw new Error("The uploaded file has no audio track to dub.");
    const out = path.join(dir, "source.mp3");
    await extractAudio(input, out);
    const stat = await fs.stat(out);
    const objectPath = `${job.org_id}/${job.project_id}/source/audio.mp3`;
    await uploadFile(BUCKETS.generated, objectPath, out, "audio/mpeg");

    await admin.from("media_files").delete().eq("project_id", job.project_id).eq("kind", "extracted_audio");
    await admin.from("media_files").insert({
      org_id: job.org_id,
      project_id: job.project_id,
      kind: "extracted_audio",
      bucket: BUCKETS.generated,
      storage_path: objectPath,
      file_name: "audio.mp3",
      mime_type: "audio/mpeg",
      size_bytes: stat.size,
      duration_seconds: info.durationSeconds,
    });
    await admin
      .from("media_files")
      .update({ duration_seconds: info.durationSeconds, width: info.width, height: info.height })
      .eq("id", media.id);
    await admin
      .from("projects")
      .update({ duration_seconds: info.durationSeconds, media_kind: info.hasVideo ? "video" : "audio" })
      .eq("id", job.project_id);
    return { result: { durationSeconds: info.durationSeconds, hasVideo: info.hasVideo }, next: [{ type: "transcribe" }] };
  });
}

/* STEPS 3 and 4: transcribe the original speech and detect speakers. */
async function transcribeStep(job: JobRow): Promise<StepResult> {
  const admin = createAdminClient();
  const project = await getProject(job.project_id);
  const audio = must(await sourceMedia(job.project_id, "extracted"), "Audio has not been extracted yet.");
  const stt = requireStt();
  if (project.source_language && !stt.languages.includes(project.source_language)) {
    throw new Error(`${stt.name} does not support ${languageName(project.source_language)} as a source language.`);
  }
  return withTmp(job.id, async (dir) => {
    const file = path.join(dir, "audio.mp3");
    await downloadToFile(audio.bucket, audio.storage_path, file);
    const result = await stt.transcribe({
      audio: await fs.readFile(file),
      fileName: "audio.mp3",
      mimeType: "audio/mpeg",
      language: project.source_language,
    });
    if (result.segments.length === 0) throw new Error("No speech was detected in this media.");

    // Replace any earlier transcription (re-runs start clean).
    await admin.from("transcriptions").delete().eq("project_id", job.project_id);
    await admin.from("speakers").delete().eq("project_id", job.project_id);

    const { data: tr, error: trErr } = await admin
      .from("transcriptions")
      .insert({
        org_id: job.org_id,
        project_id: job.project_id,
        media_file_id: audio.id,
        language: result.language,
        provider: stt.id,
        full_text: result.text,
        word_count: result.text.split(/\s+/).filter(Boolean).length,
      })
      .select("id")
      .single();
    if (trErr) throw new Error(trErr.message);

    const labels = Array.from(new Set(result.segments.map((s) => s.speaker ?? "speaker_0")));
    const { data: speakers, error: spErr } = await admin
      .from("speakers")
      .insert(
        labels.map((label, i) => ({
          org_id: job.org_id,
          project_id: job.project_id,
          label,
          display_name: `Speaker ${i + 1}`,
          color: SPEAKER_COLORS[i % SPEAKER_COLORS.length],
        })),
      )
      .select("id, label");
    if (spErr) throw new Error(spErr.message);
    const speakerId = new Map((speakers ?? []).map((s) => [s.label as string, s.id as string]));

    const rows = result.segments.map((s, idx) => ({
      org_id: job.org_id,
      project_id: job.project_id,
      transcription_id: tr.id,
      speaker_id: speakerId.get(s.speaker ?? "speaker_0") ?? null,
      idx,
      start_ms: s.startMs,
      end_ms: Math.max(s.endMs, s.startMs + 200),
      source_text: s.text,
    }));
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await admin.from("transcript_segments").insert(rows.slice(i, i + 500));
      if (error) throw new Error(error.message);
    }
    if (!project.source_language && result.language) {
      await admin.from("projects").update({ source_language: result.language }).eq("id", job.project_id);
    }
    const targets = (project.target_languages as string[]).filter((t) => t !== (project.source_language ?? result.language));
    return {
      result: { segments: rows.length, speakers: labels.length, language: result.language, provider: stt.id, diarization: stt.diarization },
      next: targets.map((t) => ({ type: "translate" as const, targetLanguage: t })),
      ...(targets.length === 0 ? { projectStatus: "review", statusDetail: "Transcript ready. Add a target language to translate." } : {}),
    };
  });
}

/* STEP 5: translate the transcript into a target language. */
async function translateStep(job: JobRow): Promise<StepResult> {
  const admin = createAdminClient();
  const target = must(job.target_language, "Translation job has no target language.");
  const project = await getProject(job.project_id);
  const mt = requireTranslation();
  if (!mt.targetLanguages.includes(target)) throw new Error(`${mt.name} does not support ${languageName(target)}.`);

  const { data: segments, error } = await admin
    .from("transcript_segments")
    .select("id, idx, start_ms, end_ms, source_text")
    .eq("project_id", job.project_id)
    .order("idx");
  if (error) throw new Error(error.message);
  if (!segments?.length) throw new Error("Transcript is empty.");

  // Keep translations a reviewer has already edited or approved.
  const { data: existing } = await admin
    .from("translation_segments")
    .select("segment_id, status")
    .eq("project_id", job.project_id)
    .eq("target_language", target);
  const locked = new Set((existing ?? []).filter((e) => e.status !== "draft").map((e) => e.segment_id as string));
  const todo = segments.filter((s) => !locked.has(s.id as string));

  const BATCH = 40;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const out = await mt.translate({
      texts: batch.map((s) => s.source_text as string),
      source: project.source_language,
      target,
      context: project.description ?? undefined,
    });
    const rows = batch.map((s, k) => ({
      org_id: job.org_id,
      project_id: job.project_id,
      segment_id: s.id,
      target_language: target,
      text: out[k] ?? "",
      provider: mt.id,
      start_ms: s.start_ms,
      end_ms: s.end_ms,
      status: "draft",
      updated_at: new Date().toISOString(),
    }));
    const { error: upErr } = await admin.from("translation_segments").upsert(rows, { onConflict: "segment_id,target_language" });
    if (upErr) throw new Error(upErr.message);
  }

  // Project moves to review once every translation job is done.
  const { data: pending } = await admin
    .from("processing_jobs")
    .select("id")
    .eq("project_id", job.project_id)
    .eq("type", "translate")
    .in("status", ["queued", "running"])
    .neq("id", job.id);
  const allDone = !pending?.length;
  return {
    result: { translated: todo.length, kept: locked.size, provider: mt.id },
    ...(allDone
      ? {
          projectStatus: "review",
          statusDetail: "Translations ready for review",
          notifyTitle: `${project.name}: translations ready for review`,
          notifyBody: "Review the translated script, assign voices and generate the dub.",
        }
      : {}),
  };
}

function hash(parts: unknown[]): string {
  return crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);
}

/* STEPS 7 and 8: generate dubbed speech for each translated segment. Resumable. */
async function generateStep(job: JobRow, deadline: number): Promise<StepResult> {
  const admin = createAdminClient();
  const target = must(job.target_language, "Voice job has no target language.");
  const defaultTts = requireTts();
  const [{ data: segs }, { data: speakers }] = await Promise.all([
    admin
      .from("translation_segments")
      .select("id, text, speed, emotion, transcript_segments!inner(idx, speaker_id)")
      .eq("project_id", job.project_id)
      .eq("target_language", target),
    admin.from("speakers").select("id, display_name, voice_provider, voice_id, accent, emotion").eq("project_id", job.project_id),
  ]);
  if (!segs?.length) throw new Error("There are no translated segments to voice.");
  const speakerMap = new Map((speakers ?? []).map((s) => [s.id as string, s]));
  const unassigned = (speakers ?? []).filter((s) => !s.voice_id);
  if (unassigned.length) {
    throw new Error(`Assign a voice to ${unassigned.map((s) => s.display_name).join(", ")} before generating the dub.`);
  }

  const { data: existing } = await admin
    .from("generated_audio")
    .select("translation_segment_id, text_hash")
    .eq("project_id", job.project_id)
    .eq("target_language", target)
    .eq("kind", "segment");
  const done = new Map((existing ?? []).map((e) => [e.translation_segment_id as string, e.text_hash as string]));

  let generated = 0;
  let skipped = 0;
  const ordered = [...segs].sort(
    (a, b) => (a.transcript_segments as unknown as { idx: number }).idx - (b.transcript_segments as unknown as { idx: number }).idx,
  );
  for (const seg of ordered) {
    const text = String(seg.text ?? "").trim();
    if (!text) { skipped++; continue; }
    const ts = seg.transcript_segments as unknown as { speaker_id: string | null };
    const sp = ts.speaker_id ? speakerMap.get(ts.speaker_id) : (speakers ?? [])[0];
    if (!sp?.voice_id) throw new Error("A segment has no speaker voice assigned.");
    const provider = (sp.voice_provider && ttsProviderById(sp.voice_provider)) || defaultTts;
    if (!provider.languages.includes(target)) throw new Error(`${provider.name} cannot speak ${languageName(target)}.`);
    const emotion = (seg.emotion as string | null) ?? (sp.emotion as string) ?? "neutral";
    const h = hash([provider.id, sp.voice_id, text, emotion, sp.accent ?? null, target]);
    if (done.get(seg.id as string) === h) { skipped++; continue; }

    if (Date.now() > deadline - 25_000) {
      throw new JobDeferred({ generated, remaining: ordered.length - generated - skipped });
    }
    const audio = await provider.synthesize({ text, voiceId: sp.voice_id as string, language: target, emotion, accent: sp.accent as string | null });
    const objectPath = `${job.org_id}/${job.project_id}/${target}/segments/${seg.id}.mp3`;
    await uploadBuffer(BUCKETS.generated, objectPath, audio, "audio/mpeg");
    await admin.from("generated_audio").delete().eq("translation_segment_id", seg.id).eq("kind", "segment");
    await admin.from("generated_audio").insert({
      org_id: job.org_id,
      project_id: job.project_id,
      translation_segment_id: seg.id,
      target_language: target,
      kind: "segment",
      storage_path: objectPath,
      provider: provider.id,
      voice_id: sp.voice_id,
      emotion,
      text_hash: h,
    });
    generated++;
  }

  // Bill the dubbed minutes once per completed generation run.
  const project = await getProject(job.project_id);
  const minutes = Math.ceil(((Number(project.duration_seconds) || 0) / 60) * 10) / 10;
  const { data: billed } = await admin.from("usage_records").select("id").eq("job_id", job.id).limit(1);
  if (!billed?.length) {
    await admin.from("usage_records").insert({ org_id: job.org_id, project_id: job.project_id, job_id: job.id, kind: "dub_minutes", quantity: minutes });
  }
  return { result: { generated, skipped, minutes }, next: [{ type: "synchronise", targetLanguage: target }] };
}

/* STEP 9: align generated speech with the original timing. */
async function synchroniseStep(job: JobRow): Promise<StepResult> {
  const admin = createAdminClient();
  const target = must(job.target_language, "Sync job has no target language.");
  const project = await getProject(job.project_id);
  const totalMs = Math.round((Number(project.duration_seconds) || 0) * 1000);
  const { data: segs } = await admin
    .from("translation_segments")
    .select("id, start_ms, end_ms, speed, pause_ms, offset_ms, generated_audio(storage_path, kind)")
    .eq("project_id", job.project_id)
    .eq("target_language", target)
    .order("start_ms");
  const withAudio = (segs ?? []).filter((s) => (s.generated_audio as unknown as { kind: string }[])?.some((g) => g.kind === "segment"));
  if (!withAudio.length) throw new Error("No generated audio found. Generate the voice first.");

  return withTmp(job.id, async (dir) => {
    const placements: { file: string; startMs: number }[] = [];
    let compressed = 0;
    let overflow = 0;
    for (let i = 0; i < withAudio.length; i++) {
      const s = withAudio[i];
      const ga = (s.generated_audio as unknown as { storage_path: string; kind: string }[]).find((g) => g.kind === "segment")!;
      const raw = path.join(dir, `raw_${i}.mp3`);
      await downloadToFile(BUCKETS.generated, ga.storage_path, raw);
      const start = Math.max(0, (s.start_ms as number) + (s.offset_ms as number) + (s.pause_ms as number));
      const nextStart = i + 1 < withAudio.length ? (withAudio[i + 1].start_ms as number) + (withAudio[i + 1].offset_ms as number) : totalMs;
      const slot = Math.max(300, Math.min(nextStart, totalMs || nextStart) - start);
      const len = await durationMs(raw);
      let tempo = Number(s.speed) || 1;
      if (len / tempo > slot) {
        const needed = len / slot;
        tempo = Math.min(MAX_TEMPO, Math.max(tempo, needed));
        compressed++;
        if (needed > MAX_TEMPO) overflow++;
      }
      const fitted = path.join(dir, `fit_${i}.wav`);
      await changeTempo(raw, fitted, tempo);
      placements.push({ file: fitted, startMs: start });
      await admin.from("generated_audio").update({ duration_ms: Math.round(len / tempo) }).eq("translation_segment_id", s.id).eq("kind", "segment");
    }

    let bed: { file: string; volume: number } | null = null;
    const vol = Number(project.original_audio_volume ?? 0);
    if (vol > 0) {
      const src = await sourceMedia(job.project_id, "extracted");
      if (src) {
        const f = path.join(dir, "bed.mp3");
        await downloadToFile(src.bucket, src.storage_path, f);
        bed = { file: f, volume: vol };
      }
    }
    const lastEnd = placements.length ? placements[placements.length - 1].startMs + 30_000 : 1000;
    const out = path.join(dir, "track.mp3");
    await buildTrack({ placements, totalMs: totalMs || lastEnd, output: out, workDir: dir, bed });
    const objectPath = `${job.org_id}/${job.project_id}/${target}/dub_track.mp3`;
    await uploadFile(BUCKETS.generated, objectPath, out, "audio/mpeg");
    await admin.from("generated_audio").delete().eq("project_id", job.project_id).eq("target_language", target).eq("kind", "track");
    await admin.from("generated_audio").insert({
      org_id: job.org_id,
      project_id: job.project_id,
      target_language: target,
      kind: "track",
      storage_path: objectPath,
      duration_ms: totalMs,
    });
    return {
      result: { segments: placements.length, compressed, overflow },
      next: [{ type: "subtitles", targetLanguage: target }],
    };
  });
}

async function cuesFor(projectId: string, language: string | null): Promise<Cue[]> {
  const admin = createAdminClient();
  if (!language) {
    const { data } = await admin.from("transcript_segments").select("start_ms, end_ms, source_text").eq("project_id", projectId).order("idx");
    return (data ?? []).map((d) => ({ startMs: d.start_ms, endMs: d.end_ms, text: d.source_text }));
  }
  const { data } = await admin
    .from("translation_segments")
    .select("start_ms, end_ms, offset_ms, pause_ms, text")
    .eq("project_id", projectId)
    .eq("target_language", language)
    .order("start_ms");
  return (data ?? []).map((d) => ({ startMs: d.start_ms + d.offset_ms + d.pause_ms, endMs: d.end_ms + d.offset_ms + d.pause_ms, text: d.text }));
}

/** Writes SRT and VTT for one language and records them. Exported for manual regeneration. */
export async function writeSubtitles(orgId: string, projectId: string, language: string, isSource: boolean, offsetOverride?: number) {
  const admin = createAdminClient();
  const { data: prev } = await admin.from("subtitles").select("timing_offset_ms").eq("project_id", projectId).eq("language", language).limit(1);
  const offset = offsetOverride ?? prev?.[0]?.timing_offset_ms ?? 0;
  const cues = applyOffset(await cuesFor(projectId, isSource ? null : language), offset);
  for (const format of ["srt", "vtt"] as const) {
    const body = format === "srt" ? toSrt(cues) : toVtt(cues);
    const objectPath = `${orgId}/${projectId}/subtitles/${language}.${format}`;
    await uploadBuffer(BUCKETS.generated, objectPath, Buffer.from(body, "utf8"), format === "srt" ? "application/x-subrip" : "text/vtt");
    await admin
      .from("subtitles")
      .upsert(
        { org_id: orgId, project_id: projectId, language, is_source: isSource, format, storage_path: objectPath, timing_offset_ms: offset },
        { onConflict: "project_id,language,format" },
      );
  }
  return cues.length;
}

/* STEP 10: generate subtitles from the original and translated dialogue. */
async function subtitlesStep(job: JobRow): Promise<StepResult> {
  const target = must(job.target_language, "Subtitle job has no target language.");
  const project = await getProject(job.project_id);
  let sourceCount = 0;
  if (project.source_language) sourceCount = await writeSubtitles(job.org_id, job.project_id, project.source_language, true);
  const targetCount = await writeSubtitles(job.org_id, job.project_id, target, false);
  return { result: { sourceCount, targetCount }, next: [{ type: "render", targetLanguage: target }] };
}

/* STEPS 11 and 12: combine audio with video and export. */
async function renderStep(job: JobRow): Promise<StepResult> {
  const admin = createAdminClient();
  const target = must(job.target_language, "Render job has no target language.");
  const project = await getProject(job.project_id);
  const media = must(await sourceMedia(job.project_id, "original"), "Original media is missing.");
  const { data: track } = await admin
    .from("generated_audio")
    .select("storage_path")
    .eq("project_id", job.project_id)
    .eq("target_language", target)
    .eq("kind", "track")
    .limit(1)
    .single();
  if (!track) throw new Error("The synchronised dub track is missing.");
  const base = safeFileName(`${project.name}_${target}`);

  return withTmp(job.id, async (dir) => {
    const trackFile = path.join(dir, "track.mp3");
    await downloadToFile(BUCKETS.generated, track.storage_path, trackFile);
    const exports: { kind: string; format: string; path: string; size: number }[] = [];
    const prefix = `${job.org_id}/${job.project_id}/${target}/${Date.now()}`;

    if (project.media_kind === "video") {
      const video = path.join(dir, `video${path.extname(media.file_name) || ".mp4"}`);
      await downloadToFile(media.bucket, media.storage_path, video);
      const srtFile = path.join(dir, "subs.srt");
      const { data: sub } = await admin.from("subtitles").select("storage_path").eq("project_id", job.project_id).eq("language", target).eq("format", "srt").maybeSingle();
      let subtitles: { file: string; language: string } | null = null;
      if (sub && job.payload?.embedSubtitles !== false) {
        await downloadToFile(BUCKETS.generated, sub.storage_path, srtFile);
        subtitles = { file: srtFile, language: target };
      }
      const out = path.join(dir, `${base}.mp4`);
      try {
        await muxVideo({ video, audio: trackFile, output: out, subtitles });
      } catch (e) {
        // Some containers reject a copied video stream with soft subtitles: retry without embedding.
        if (!subtitles) throw e;
        await muxVideo({ video, audio: trackFile, output: out, subtitles: null });
      }
      const p = `${prefix}/${base}.mp4`;
      await uploadFile(BUCKETS.exports, p, out, "video/mp4");
      exports.push({ kind: "video", format: "mp4", path: p, size: (await fs.stat(out)).size });
    }
    for (const fmt of ["mp3", "wav"] as const) {
      const out = path.join(dir, `${base}.${fmt}`);
      await transcode(trackFile, out, fmt);
      const p = `${prefix}/${base}.${fmt}`;
      await uploadFile(BUCKETS.exports, p, out, fmt === "mp3" ? "audio/mpeg" : "audio/wav");
      exports.push({ kind: "audio", format: fmt, path: p, size: (await fs.stat(out)).size });
    }
    const { data: subs } = await admin.from("subtitles").select("format, storage_path").eq("project_id", job.project_id).eq("language", target);
    for (const s of subs ?? []) {
      const local = path.join(dir, `sub.${s.format}`);
      await downloadToFile(BUCKETS.generated, s.storage_path, local);
      const p = `${prefix}/${base}.${s.format}`;
      await uploadFile(BUCKETS.exports, p, local, s.format === "srt" ? "application/x-subrip" : "text/vtt");
      exports.push({ kind: s.format, format: s.format, path: p, size: (await fs.stat(local)).size });
    }
    await admin.from("export_records").insert(
      exports.map((e) => ({
        org_id: job.org_id,
        project_id: job.project_id,
        target_language: target,
        kind: e.kind,
        format: e.format,
        storage_path: e.path,
        size_bytes: e.size,
        created_by: job.created_by,
      })),
    );

    const { data: pending } = await admin
      .from("processing_jobs")
      .select("id")
      .eq("project_id", job.project_id)
      .in("status", ["queued", "running"])
      .neq("id", job.id);
    const finished = !pending?.length;
    return {
      result: { exports: exports.length },
      ...(finished
        ? {
            projectStatus: "completed",
            statusDetail: null,
            notifyTitle: `${project.name}: ${languageName(target)} dub is ready`,
            notifyBody: "Your dubbed media and subtitles are ready to download.",
          }
        : {}),
    };
  });
}
