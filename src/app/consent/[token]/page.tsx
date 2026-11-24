import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/tokens";
import { supabaseConfigured } from "@/lib/env";
import { ConsentFlow } from "./ConsentFlow";

export const metadata: Metadata = { title: "Voice consent", robots: { index: false } };

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let consent: { ownerName: string; ownerEmail: string; orgName: string; statement: string; status: string; commercialUse: boolean } | null = null;
  if (supabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data } = await admin.from("voice_consents").select("voice_owner_name, voice_owner_email, consent_statement, status, commercial_use, organisations(name)").eq("token_hash", hashToken(token)).maybeSingle();
    if (data) {
      consent = {
        ownerName: data.voice_owner_name,
        ownerEmail: data.voice_owner_email,
        orgName: (data.organisations as unknown as { name: string } | null)?.name ?? "A LinguaDub workspace",
        statement: data.consent_statement,
        status: data.status,
        commercialUse: data.commercial_use,
      };
    }
  }
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white"><div className="container-ld flex h-16 items-center"><Logo /></div></header>
      <main className="container-ld max-w-2xl py-12">
        {!consent ? (
          <div className="card p-8 text-center">
            <h1 className="text-2xl font-extrabold">This consent link is not valid</h1>
            <p className="mt-2 text-muted">It may have been withdrawn by the requester. No voice has been created from it.</p>
          </div>
        ) : (
          <ConsentFlow token={token} consent={consent} />
        )}
      </main>
      <footer className="py-8 text-center text-sm text-muted">© 2026 LinguaDub</footer>
    </div>
  );
}
