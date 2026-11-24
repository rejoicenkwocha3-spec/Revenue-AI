import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashToken } from "@/lib/tokens";
import { supabaseConfigured } from "@/lib/env";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { AcceptInvite } from "./AcceptInvite";

export const metadata = { title: "Join workspace", robots: { index: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!supabaseConfigured()) redirect("/login");
  const admin = createAdminClient();
  const { data: inv } = await admin.from("team_invitations").select("email, role, status, expires_at, organisations(name)").eq("token_hash", hashToken(token)).maybeSingle();
  const { data: { user } } = await (await createClient()).auth.getUser();
  const valid = inv && inv.status === "pending" && new Date(inv.expires_at) > new Date();
  if (valid && !user) {
    const { data: existing } = await admin.from("profiles").select("id").eq("email", inv.email).maybeSingle();
    redirect(existing ? `/login?next=${encodeURIComponent(`/invite/${token}`)}` : `/signup?invite=${token}&email=${encodeURIComponent(inv.email)}`);
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="flex justify-center"><Logo /></div>
        {!valid ? (
          <>
            <h1 className="mt-6 text-2xl font-extrabold">Invitation unavailable</h1>
            <p className="mt-2 text-muted">This invitation was used, revoked or has expired. Ask the workspace administrator for a new one.</p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-extrabold">Join {(inv.organisations as unknown as { name: string })?.name}</h1>
            <p className="mt-2 text-muted">You were invited as {ROLE_LABELS[inv.role as Role]}.</p>
            <AcceptInvite token={token} mismatch={user!.email?.toLowerCase() !== inv.email.toLowerCase() ? inv.email : null} />
          </>
        )}
      </div>
    </div>
  );
}
