import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { projectAccess } from "@/lib/access";
import { writeSubtitles } from "@/lib/pipeline/steps";
import { logActivity } from "@/lib/activity";

const schema = z.object({ language: z.string().min(2).max(5), offsetMs: z.number().int().min(-60000).max(60000).default(0) });

/** Regenerates SRT and VTT for a language with a global timing offset. Reflects the latest edited text. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { ctx, project } = await projectAccess(id, "translation.edit");
  const { language, offsetMs } = await parseBody(req, schema);
  const isSource = language === project.source_language;
  if (!isSource && !project.target_languages.includes(language)) throw new ApiError(400, "Unknown language for this project.");
  const cues = await writeSubtitles(project.org_id, id, language, isSource, offsetMs);
  await logActivity({ orgId: project.org_id, userId: ctx.userId, projectId: id, action: "subtitles.updated", details: { language, offsetMs } });
  return json({ ok: true, cues });
});
