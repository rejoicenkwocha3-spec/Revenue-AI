import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import type { Role } from "@/lib/permissions";

export interface AppContext {
  userId: string;
  email: string;
  fullName: string;
  orgId: string;
  orgName: string;
  role: Role;
  memberships: { orgId: string; orgName: string; role: Role }[];
}

/**
 * Resolves the signed in user, their active workspace and role.
 * The active workspace is the profile's default_org_id, falling back to the first membership.
 */
export const getAppContext = cache(async (): Promise<AppContext | null> => {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("full_name, default_org_id").eq("id", user.id).maybeSingle(),
    supabase.from("organisation_members").select("org_id, role, organisations(name)").eq("user_id", user.id),
  ]);

  const memberships = (members ?? []).map((m) => ({
    orgId: m.org_id as string,
    role: m.role as Role,
    orgName: ((m.organisations as unknown as { name: string } | null)?.name ?? "Workspace") as string,
  }));
  if (memberships.length === 0) return null;
  const active = memberships.find((m) => m.orgId === profile?.default_org_id) ?? memberships[0];

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? user.email?.split("@")[0] ?? "",
    orgId: active.orgId,
    orgName: active.orgName,
    role: active.role,
    memberships,
  };
});

export async function requireAppContext(): Promise<AppContext> {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");
  return ctx;
}
