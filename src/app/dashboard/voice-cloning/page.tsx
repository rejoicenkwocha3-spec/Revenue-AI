import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Notice } from "@/components/app/ui";
import { cloningProvider } from "@/lib/providers";
import { getEntitlements } from "@/lib/billing";
import { can } from "@/lib/permissions";
import { VoiceCloningClient } from "./VoiceCloningClient";

export const metadata = { title: "Voice Cloning" };

export default async function VoiceCloningPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const [{ data: consents }, { data: voices }, ent] = await Promise.all([
    supabase.from("voice_consents").select("id, voice_owner_name, voice_owner_email, is_self, commercial_use, status, verified_at, created_at, revoked_at").eq("org_id", ctx.orgId).order("created_at", { ascending: false }),
    supabase.from("voice_profiles").select("id, name, provider, provider_voice_id, accent, gender, style, consent_id, created_at, sample_paths").eq("org_id", ctx.orgId).eq("is_cloned", true).eq("status", "active").order("created_at", { ascending: false }),
    getEntitlements(ctx.orgId),
  ]);
  const provider = cloningProvider();
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Voice Cloning" description="Create authorised replicas of real voices. Every replica requires recorded, verified consent from the person whose voice it is." />
      {!provider && <Notice tone="warning" className="mb-5">Voice cloning is not configured. Add ELEVENLABS_API_KEY on the server to enable it.</Notice>}
      <VoiceCloningClient
        consents={consents ?? []}
        voices={(voices ?? []).map((v) => ({ ...v, sample_count: (v.sample_paths ?? []).length }))}
        canClone={can(ctx.role, "voice.clone") && !!provider}
        limit={ent.voiceClones}
        selfEmail={ctx.email}
        selfName={ctx.fullName}
      />
    </div>
  );
}
