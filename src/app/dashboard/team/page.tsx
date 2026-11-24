import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/ui";
import { getEntitlements } from "@/lib/billing";
import { can } from "@/lib/permissions";
import { describeActivity } from "@/lib/activity-text";
import { timeAgo } from "@/lib/utils";
import { TeamClient } from "./TeamClient";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const manage = can(ctx.role, "team.manage");
  const [{ data: members }, { data: invites }, { data: activity }, ent] = await Promise.all([
    supabase.from("organisation_members").select("user_id, role, created_at, profiles(full_name, email)").eq("org_id", ctx.orgId).order("created_at"),
    manage ? supabase.from("team_invitations").select("id, email, role, status, expires_at, created_at").eq("org_id", ctx.orgId).eq("status", "pending").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.from("activity_logs").select("id, action, details, created_at, profiles:user_id(full_name)").eq("org_id", ctx.orgId).order("created_at", { ascending: false }).limit(25),
    getEntitlements(ctx.orgId),
  ]);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Team" description="Invite people, assign roles and follow what your team is working on." />
      <TeamClient
        me={ctx.userId}
        myRole={ctx.role}
        manage={manage}
        seats={ent.seats}
        members={(members ?? []).map((m) => ({ userId: m.user_id, role: m.role, joined: m.created_at, name: (m.profiles as unknown as { full_name: string | null; email: string | null })?.full_name ?? "", email: (m.profiles as unknown as { email: string | null })?.email ?? "" }))}
        invites={(invites ?? []) as { id: string; email: string; role: string; expires_at: string }[]}
      />
      <section className="card mt-5">
        <h2 className="border-b border-line px-6 py-4 text-lg font-bold">Team activity</h2>
        {!activity?.length ? <p className="px-6 py-6 text-sm text-muted">No activity yet.</p> : (
          <ul className="divide-y divide-line">
            {activity.map((a) => (
              <li key={a.id} className="flex justify-between gap-4 px-6 py-3 text-sm">
                <span><span className="font-semibold text-navy">{(a.profiles as unknown as { full_name: string } | null)?.full_name ?? "LinguaDub"}</span> {describeActivity(a.action, a.details as Record<string, unknown>)}</span>
                <span className="shrink-0 text-xs text-muted">{timeAgo(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
