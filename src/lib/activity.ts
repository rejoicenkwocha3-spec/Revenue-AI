import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function logActivity(params: {
  orgId: string;
  userId?: string | null;
  projectId?: string | null;
  action: string;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("activity_logs").insert({
    org_id: params.orgId,
    user_id: params.userId ?? null,
    project_id: params.projectId ?? null,
    action: params.action,
    details: params.details ?? {},
  });
  if (error) console.error("[activity]", error.message);
}

export async function notify(params: { userIds: string[]; orgId?: string; title: string; body?: string; link?: string }) {
  if (params.userIds.length === 0) return;
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert(
    params.userIds.map((u) => ({ user_id: u, org_id: params.orgId ?? null, title: params.title, body: params.body ?? null, link: params.link ?? null })),
  );
  if (error) console.error("[notify]", error.message);
}

export async function orgMemberIds(orgId: string, roles?: string[]): Promise<string[]> {
  const admin = createAdminClient();
  let q = admin.from("organisation_members").select("user_id").eq("org_id", orgId);
  if (roles) q = q.in("role", roles);
  const { data } = await q;
  return (data ?? []).map((r) => r.user_id as string);
}
