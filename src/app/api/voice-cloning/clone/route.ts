import { z } from "zod";
import { handle, json, parseBody, ApiError } from "@/lib/api";
import { orgAccess } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCloning } from "@/lib/providers";
import { downloadBuffer, BUCKETS } from "@/lib/storage";
import { getEntitlements } from "@/lib/billing";
import { logActivity } from "@/lib/activity";

export const maxDuration = 300;

const schema = z.object({
  consentId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
  accent: z.string().trim().max(60).optional(),
  gender: z.string().trim().max(40).optional(),
  style: z.string().trim().max(40).optional(),
  samplePaths: z.array(z.string()).min(1).max(10),
});

/** Creates a voice replica from uploaded samples. Requires verified, unrevoked consent and plan capacity. */
export const POST = handle(async (req: Request) => {
  const body = await parseBody(req, schema);
  const admin = createAdminClient();
  const { data: c } = await admin.from("voice_consents").select("*").eq("id", body.consentId).maybeSingle();
  if (!c) throw new ApiError(404, "Consent not found.");
  const { ctx } = await orgAccess(c.org_id, "voice.clone");
  if (c.status !== "verified" || c.revoked_at) throw new ApiError(403, "Cloning requires verified consent from the voice owner.");
  if (body.samplePaths.some((p) => !p.startsWith(`${c.org_id}/samples/${c.id}/`))) throw new ApiError(400, "Samples must belong to this consent.");

  const ent = await getEntitlements(c.org_id);
  const { count } = await admin.from("voice_profiles").select("id", { count: "exact", head: true }).eq("org_id", c.org_id).eq("is_cloned", true).eq("status", "active");
  if ((count ?? 0) >= ent.voiceClones) throw new ApiError(402, ent.voiceClones ? `Your plan includes ${ent.voiceClones} cloned ${ent.voiceClones === 1 ? "voice" : "voices"}. Delete one or upgrade.` : "Voice cloning needs an active plan.");

  const provider = requireCloning();
  const files = await Promise.all(
    body.samplePaths.map(async (p) => ({ data: await downloadBuffer(BUCKETS.voiceSamples, p), fileName: p.split("/").pop()!, mimeType: "audio/mpeg" })),
  );
  const { voiceId } = await provider.cloneVoice({
    name: body.name,
    description: body.description ?? `Consented voice of ${c.voice_owner_name}`,
    files,
    labels: { ...(body.accent ? { accent: body.accent } : {}), ...(body.gender ? { gender: body.gender } : {}), linguadub_consent: c.id },
  });
  const { data, error } = await admin
    .from("voice_profiles")
    .insert({
      org_id: c.org_id,
      provider: provider.id,
      provider_voice_id: voiceId,
      name: body.name,
      accent: body.accent ?? null,
      gender: body.gender ?? null,
      style: body.style ?? null,
      description: body.description ?? null,
      is_cloned: true,
      consent_id: c.id,
      sample_paths: body.samplePaths,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) throw new ApiError(500, error.message);
  await logActivity({ orgId: c.org_id, userId: ctx.userId, action: "voice.cloned", details: { voice: body.name } });
  return json({ id: data.id, voiceId }, 201);
});
