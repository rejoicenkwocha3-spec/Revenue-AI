import "server-only";
import type { Db } from "@/lib/supabase/types";
import type { OrgData } from "./types";

const num = (v: unknown) => (v == null ? 0 : Number(v));

/**
 * Loads the organisation's revenue records with the caller's client, so Row Level Security applies.
 * Every number Revenue AI shows is computed from these rows.
 */
export async function loadOrgData(supabase: Db, orgId: string): Promise<OrgData> {
  const since = new Date(Date.now() - 365 * 86400000).toISOString();
  const [history, org, stages, members, opps, accounts, contacts, oppContacts, activities, meetings, tx, targets, tasks, renewals] = await Promise.all([
    supabase.from("opportunity_history").select("opportunity_id, field, old_value, new_value, created_at").eq("org_id", orgId).in("field", ["close_date", "stage", "amount", "forecast_category"]).gte("created_at", since).limit(20000),
    supabase.from("organisations").select("fiscal_year_start_month, currency").eq("id", orgId).maybeSingle(),
    supabase.from("pipeline_stages").select("id, name, position, probability, kind, expected_days").eq("org_id", orgId).order("position"),
    supabase.from("organisation_members").select("user_id, role, team_id, territory_id, profiles(full_name, email)").eq("org_id", orgId),
    supabase.from("opportunities").select("*").eq("org_id", orgId).limit(10000),
    supabase.from("accounts").select("id, name, industry, region, owner_id, lifecycle_stage, priority, employee_count, created_at").eq("org_id", orgId).limit(10000),
    supabase.from("contacts").select("id, account_id, first_name, last_name, email, title, buying_role, last_contacted_at").eq("org_id", orgId).limit(20000),
    supabase.from("opportunity_contacts").select("opportunity_id, contact_id, role").eq("org_id", orgId).limit(20000),
    supabase.from("sales_activities").select("id, type, subject, notes, opportunity_id, account_id, contact_id, user_id, outcome, competitor_mentioned, objection, budget_discussed, occurred_at").eq("org_id", orgId).gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(20000),
    supabase.from("meetings").select("id, title, starts_at, opportunity_id, account_id, organiser_id, status, outcome").eq("org_id", orgId).gte("starts_at", since).limit(10000),
    supabase.from("revenue_transactions").select("id, account_id, opportunity_id, owner_id, type, amount, recurring, product, region, occurred_on").eq("org_id", orgId).limit(20000),
    supabase.from("revenue_targets").select("id, scope, team_id, user_id, period_type, period_start, period_end, amount").eq("org_id", orgId),
    supabase.from("tasks").select("id, title, due_date, status, priority, kind, assignee_id, opportunity_id, account_id, created_at").eq("org_id", orgId).neq("status", "cancelled").limit(10000),
    supabase.from("renewals").select("id, account_id, owner_id, renewal_date, current_arr, expected_arr, status").eq("org_id", orgId),
  ]);
  const firstError = [stages, members, opps, accounts, activities, tx].find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);
  return {
    orgId,
    fiscalStartMonth: org.data?.fiscal_year_start_month ?? 1,
    currency: org.data?.currency ?? "USD",
    stages: (stages.data ?? []) as OrgData["stages"],
    members: (members.data ?? []).map((m) => {
      const p = m.profiles as unknown as { full_name: string | null; email: string | null } | null;
      return { user_id: m.user_id, role: m.role, team_id: m.team_id, territory_id: m.territory_id, full_name: p?.full_name || p?.email || "Member", email: p?.email ?? "" };
    }),
    opportunities: (opps.data ?? []).map((o) => ({ ...o, amount: num(o.amount), competitors: o.competitors ?? [] })) as OrgData["opportunities"],
    accounts: (accounts.data ?? []) as OrgData["accounts"],
    contacts: (contacts.data ?? []) as OrgData["contacts"],
    oppContacts: (oppContacts.data ?? []) as OrgData["oppContacts"],
    activities: (activities.data ?? []) as OrgData["activities"],
    meetings: (meetings.data ?? []) as OrgData["meetings"],
    transactions: (tx.data ?? []).map((t) => ({ ...t, amount: num(t.amount) })) as OrgData["transactions"],
    targets: (targets.data ?? []).map((t) => ({ ...t, amount: num(t.amount) })) as OrgData["targets"],
    tasks: (tasks.data ?? []) as OrgData["tasks"],
    renewals: (renewals.data ?? []).map((r) => ({ ...r, current_arr: num(r.current_arr), expected_arr: r.expected_arr == null ? null : num(r.expected_arr) })) as OrgData["renewals"],
    history: (history.data ?? []) as OrgData["history"],
    now: new Date(),
  };
}
