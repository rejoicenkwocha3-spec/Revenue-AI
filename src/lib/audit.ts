import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Appends to the organisation's audit trail. Every agent action and every consequential change is recorded here. */
export async function audit(params: {
  orgId: string;
  userId?: string | null;
  actorType?: "user" | "agent" | "system" | "integration";
  agentKey?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  const { error } = await createAdminClient().from("audit_logs").insert({
    org_id: params.orgId,
    user_id: params.userId ?? null,
    actor_type: params.actorType ?? "user",
    agent_key: params.agentKey ?? null,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    details: params.details ?? {},
  });
  if (error) console.error("[audit]", error.message);
}

export async function notify(params: { userIds: string[]; orgId?: string; title: string; body?: string; link?: string }) {
  const ids = [...new Set(params.userIds.filter(Boolean))];
  if (ids.length === 0) return;
  const { error } = await createAdminClient().from("notifications").insert(
    ids.map((u) => ({ user_id: u, org_id: params.orgId ?? null, title: params.title, body: params.body ?? null, link: params.link ?? null })),
  );
  if (error) console.error("[notify]", error.message);
}

export async function orgMemberIds(orgId: string, roles?: string[]): Promise<string[]> {
  let q = createAdminClient().from("organisation_members").select("user_id").eq("org_id", orgId);
  if (roles) q = q.in("role", roles);
  const { data } = await q;
  return (data ?? []).map((r) => r.user_id as string);
}
