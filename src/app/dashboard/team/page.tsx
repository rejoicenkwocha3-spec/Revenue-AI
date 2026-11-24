import { Plus } from "lucide-react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/app/ui";
import { SettingsTabs } from "@/components/app/SettingsTabs";
import { FormButton, ActionButton } from "@/components/app/forms";
import { getEntitlements } from "@/lib/billing";
import { can } from "@/lib/permissions";
import { TeamClient } from "./TeamClient";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const manage = can(ctx.role, "team.manage");
  const [{ data: members }, { data: invites }, { data: teams }, { data: territories }, ent] = await Promise.all([
    supabase.from("organisation_members").select("user_id, role, team_id, territory_id, created_at, profiles(full_name, email)").eq("org_id", ctx.orgId).order("created_at"),
    manage ? supabase.from("team_invitations").select("id, email, role, status, expires_at, created_at").eq("org_id", ctx.orgId).eq("status", "pending").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.from("teams").select("id, name, manager_id").eq("org_id", ctx.orgId).order("name"),
    supabase.from("territories").select("id, name, region, description").eq("org_id", ctx.orgId).order("name"),
    getEntitlements(ctx.orgId),
  ]);
  const people = (members ?? []).map((m) => { const p = m.profiles as unknown as { full_name: string | null; email: string | null } | null; return { userId: m.user_id, role: m.role, teamId: m.team_id, territoryId: m.territory_id, joined: m.created_at, name: p?.full_name ?? "", email: p?.email ?? "" }; });
  const nameOf = (id: string | null) => people.find((p) => p.userId === id)?.name ?? "No manager";
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title="Settings" description="Invite employees, assign roles, organise teams and sales territories." />
      <SettingsTabs current="team" role={ctx.role} />
      <TeamClient me={ctx.userId} myRole={ctx.role} manage={manage} seats={ent.seats} members={people} invites={(invites ?? []) as { id: string; email: string; role: string; expires_at: string }[]} teams={(teams ?? []).map((t) => ({ id: t.id, name: t.name }))} territories={(territories ?? []).map((t) => ({ id: t.id, name: t.name }))} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Teams" description="Group representatives under a manager" actions={manage && <FormButton label="New team" icon={<Plus size={14} />} className="btn btn-outline btn-xs" title="New team" endpoint="/api/teams" fields={[{ name: "name", label: "Team name", required: true }, { name: "manager_id", label: "Manager", type: "select", options: people.map((p) => ({ value: p.userId, label: p.name || p.email })) }]} />}>
          {(teams ?? []).length ? <ul className="divide-y divide-line">{(teams ?? []).map((t) => <li key={t.id} className="flex items-center justify-between py-2.5 text-sm"><span><span className="font-semibold text-ink">{t.name}</span><span className="block text-xs text-muted">{nameOf(t.manager_id)} · {people.filter((p) => p.teamId === t.id).length} members</span></span>{manage && <ActionButton endpoint={`/api/teams/${t.id}`} method="DELETE" label="Delete" confirm="Delete team?" className="btn btn-ghost btn-xs" />}</li>)}</ul> : <p className="text-sm text-muted">No teams yet.</p>}
        </Card>
        <Card title="Sales territories" description="Assign members and accounts to territories" actions={manage && <FormButton label="New territory" icon={<Plus size={14} />} className="btn btn-outline btn-xs" title="New territory" endpoint="/api/territories" fields={[{ name: "name", label: "Territory name", required: true }, { name: "region", label: "Region" }, { name: "description", label: "Description", type: "textarea" }]} />}>
          {(territories ?? []).length ? <ul className="divide-y divide-line">{(territories ?? []).map((t) => <li key={t.id} className="flex items-center justify-between py-2.5 text-sm"><span><span className="font-semibold text-ink">{t.name}</span><span className="block text-xs text-muted">{t.region ?? "No region"} · {people.filter((p) => p.territoryId === t.id).length} members</span></span>{manage && <ActionButton endpoint={`/api/territories/${t.id}`} method="DELETE" label="Delete" confirm="Delete territory?" className="btn btn-ghost btn-xs" />}</li>)}</ul> : <p className="text-sm text-muted">No territories yet.</p>}
        </Card>
      </div>
    </div>
  );
}
