import { handle, json, requireUser } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { ttsProvider, capabilities } from "@/lib/providers";
import type { VoiceInfo } from "@/lib/providers/types";

let cache: { at: number; provider: string; voices: VoiceInfo[] } | null = null;

/** Lists voices from the connected voice provider, plus this workspace's cloned voices and the user's favourites. */
export const GET = handle(async () => {
  const ctx = await requireUser();
  const provider = ttsProvider();
  const admin = createAdminClient();
  let voices: VoiceInfo[] = [];
  let error: string | null = null;
  if (provider) {
    try {
      if (!cache || cache.provider !== provider.id || Date.now() - cache.at > 5 * 60_000) {
        cache = { at: Date.now(), provider: provider.id, voices: await provider.listVoices() };
      }
      voices = cache.voices;
    } catch (e) {
      error = (e as Error).message;
    }
  }
  const [{ data: cloned }, { data: favs }] = await Promise.all([
    admin.from("voice_profiles").select("id, provider, provider_voice_id, name, language, accent, gender, style, description, status, created_at").eq("org_id", ctx.orgId).eq("is_cloned", true).eq("status", "active"),
    admin.from("voice_favourites").select("provider, provider_voice_id").eq("user_id", ctx.userId).eq("org_id", ctx.orgId),
  ]);
  const clonedIds = new Set((cloned ?? []).map((c) => c.provider_voice_id));
  // A provider account may also contain clones made by other workspaces: only show this workspace's clones.
  const { data: allClones } = await admin.from("voice_profiles").select("provider_voice_id").eq("is_cloned", true);
  const foreign = new Set((allClones ?? []).map((c) => c.provider_voice_id).filter((v) => !clonedIds.has(v)));
  const library = voices.filter((v) => !foreign.has(v.voiceId) && !clonedIds.has(v.voiceId) && v.category !== "cloned");
  const clonedVoices: VoiceInfo[] = (cloned ?? []).map((c) => ({
    provider: c.provider,
    voiceId: c.provider_voice_id,
    name: c.name,
    accent: c.accent,
    gender: c.gender,
    age: null,
    style: c.style,
    description: c.description,
    languages: capabilities().tts?.languages ?? [],
    previewUrl: null,
    category: "cloned",
  }));
  return json({
    provider: provider ? { id: provider.id, name: provider.name, emotionMode: provider.emotionMode, accentByInstruction: provider.accentByInstruction } : null,
    voices: library,
    cloned: clonedVoices,
    favourites: (favs ?? []).map((f) => `${f.provider}:${f.provider_voice_id}`),
    error,
  });
});
