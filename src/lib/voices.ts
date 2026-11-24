import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { cloningProvider } from "@/lib/providers";
import { BUCKETS, removeObjects } from "@/lib/storage";

/** Deletes a cloned voice at the provider, removes its samples and unassigns it from speakers. */
export async function deleteClonedVoice(voiceProfileId: string) {
  const admin = createAdminClient();
  const { data: v } = await admin.from("voice_profiles").select("*").eq("id", voiceProfileId).maybeSingle();
  if (!v) return;
  const provider = cloningProvider();
  if (provider && provider.id === v.provider) {
    try {
      await provider.deleteVoice(v.provider_voice_id);
    } catch (e) {
      // A voice already removed at the provider is fine; anything else must surface.
      if (!/404|not.?found/i.test((e as Error).message)) throw e;
    }
  }
  await removeObjects(BUCKETS.voiceSamples, v.sample_paths ?? []);
  await admin.from("speakers").update({ voice_id: null, voice_name: null, voice_provider: null }).eq("voice_id", v.provider_voice_id).eq("org_id", v.org_id);
  await admin.from("voice_profiles").update({ status: "deleted", sample_paths: [] }).eq("id", voiceProfileId);
}
