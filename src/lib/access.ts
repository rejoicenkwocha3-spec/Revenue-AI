import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, requireUser } from "@/lib/api";
import { can, type Action, type Role } from "@/lib/permissions";
import type { AppContext } from "@/lib/session";

export interface ProjectRow {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  source_language: string | null;
  target_languages: string[];
  status: string;
  media_kind: string | null;
  duration_seconds: number | null;
  original_audio_volume: number;
  approval_status: string;
  created_by: string | null;
}

/** Loads a project and checks the caller's role in the project's own workspace. */
export async function projectAccess(projectId: string, action: Action): Promise<{ ctx: AppContext; project: ProjectRow; role: Role }> {
  const ctx = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) throw new ApiError(404, "Project not found.");
  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) throw new ApiError(404, "Project not found.");
  const membership = ctx.memberships.find((m) => m.orgId === project.org_id);
  if (!membership) throw new ApiError(404, "Project not found.");
  if (!can(membership.role, action)) throw new ApiError(403, "Your role does not allow this action. Ask a workspace administrator for access.");
  return { ctx, project: project as ProjectRow, role: membership.role };
}

/** Checks the caller's role for an organisation owned row. */
export async function orgAccess(orgId: string, action: Action): Promise<{ ctx: AppContext; role: Role }> {
  const ctx = await requireUser();
  const membership = ctx.memberships.find((m) => m.orgId === orgId);
  if (!membership) throw new ApiError(404, "Not found.");
  if (!can(membership.role, action)) throw new ApiError(403, "Your role does not allow this action.");
  return { ctx, role: membership.role };
}
