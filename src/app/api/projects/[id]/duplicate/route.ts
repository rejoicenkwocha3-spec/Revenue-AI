import { bucketName } from "@/config/buckets";
import { handle, json, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";

/** Duplicates project settings, media reference, transcript, speakers and translations. Generated audio is not copied. */
export const POST = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { ctx, project } = await projectAccess(id, "project.create");
  const admin = createAdminClient();
  const name = `${project.name} (copy)`.slice(0, 160);
  const { data: copy, error } = await admin
    .from("projects")
    .insert({
      org_id: project.org_id,
      name,
      description: project.description,
      source_language: project.source_language,
      target_languages: project.target_languages,
      media_kind: project.media_kind,
      duration_seconds: project.duration_seconds,
      original_audio_volume: project.original_audio_volume,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !copy) throw new ApiError(500, error?.message ?? "Could not duplicate.");

  // Copy the private media objects so each project owns its files.
  const { data: media } = await admin.from("media_files").select("*").eq("project_id", id);
  for (const m of media ?? []) {
    const newPath = String(m.storage_path).replace(`${project.org_id}/${id}/`, `${project.org_id}/${copy.id}/`);
    const { error: cpErr } = await admin.storage.from(bucketName(m.bucket)).copy(m.storage_path, newPath);
    if (cpErr) throw new ApiError(500, `Could not copy media: ${cpErr.message}`);
    const { id: _omit, created_at: _c, ...rest } = m;
    void _omit; void _c;
    await admin.from("media_files").insert({ ...rest, project_id: copy.id, storage_path: newPath, created_by: ctx.userId });
  }

  const { data: tr } = await admin.from("transcriptions").select("*").eq("project_id", id).maybeSingle();
  if (tr) {
    const { data: newTr } = await admin
      .from("transcriptions")
      .insert({ org_id: tr.org_id, project_id: copy.id, language: tr.language, provider: tr.provider, full_text: tr.full_text, word_count: tr.word_count })
      .select("id")
      .single();
    const { data: speakers } = await admin.from("speakers").select("*").eq("project_id", id);
    const speakerMap = new Map<string, string>();
    for (const s of speakers ?? []) {
      const { data: ns } = await admin
        .from("speakers")
        .insert({ org_id: s.org_id, project_id: copy.id, label: s.label, display_name: s.display_name, color: s.color, voice_provider: s.voice_provider, voice_id: s.voice_id, voice_name: s.voice_name, accent: s.accent, emotion: s.emotion })
        .select("id")
        .single();
      if (ns) speakerMap.set(s.id, ns.id);
    }
    const { data: segs } = await admin.from("transcript_segments").select("*").eq("project_id", id).order("idx");
    const segMap = new Map<string, string>();
    for (let i = 0; i < (segs ?? []).length; i += 300) {
      const chunk = (segs ?? []).slice(i, i + 300);
      const { data: inserted } = await admin
        .from("transcript_segments")
        .insert(chunk.map((s) => ({ org_id: s.org_id, project_id: copy.id, transcription_id: newTr!.id, speaker_id: s.speaker_id ? speakerMap.get(s.speaker_id) ?? null : null, idx: s.idx, start_ms: s.start_ms, end_ms: s.end_ms, source_text: s.source_text })))
        .select("id, idx");
      const byIdx = new Map((inserted ?? []).map((r) => [r.idx, r.id]));
      chunk.forEach((s) => segMap.set(s.id, byIdx.get(s.idx)));
    }
    const { data: trs } = await admin.from("translation_segments").select("*").eq("project_id", id);
    const rows = (trs ?? [])
      .filter((t) => segMap.get(t.segment_id))
      .map((t) => ({ org_id: t.org_id, project_id: copy.id, segment_id: segMap.get(t.segment_id), target_language: t.target_language, text: t.text, provider: t.provider, start_ms: t.start_ms, end_ms: t.end_ms, speed: t.speed, pause_ms: t.pause_ms, offset_ms: t.offset_ms, emotion: t.emotion, status: t.status }));
    for (let i = 0; i < rows.length; i += 300) await admin.from("translation_segments").insert(rows.slice(i, i + 300));
    await admin.from("projects").update({ status: rows.length ? "review" : "draft" }).eq("id", copy.id);
  }
  await logActivity({ orgId: project.org_id, userId: ctx.userId, projectId: copy.id, action: "project.duplicated", details: { name: project.name } });
  return json({ id: copy.id }, 201);
});
