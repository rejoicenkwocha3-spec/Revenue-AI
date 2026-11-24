import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { getAppContext } from "@/lib/session";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { SetupRequired } from "@/components/app/SetupRequired";
import { WorkspaceMissing } from "@/components/app/WorkspaceMissing";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | Revenue AI" } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return <SetupRequired />;
  const supabase = await createClient();
  const ctx = await getAppContext();
  if (!ctx) {
    // Signed in but no workspace yet: redirecting to /login would loop, because the proxy sends signed in users back here.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    return <WorkspaceMissing email={user.email ?? ""} />;
  }
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", ctx.userId).is("read_at", null);
  const unread = count ?? 0;
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar unread={unread} />
      <div className="lg:pl-[256px]">
        <Topbar ctx={ctx} unread={unread} />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
