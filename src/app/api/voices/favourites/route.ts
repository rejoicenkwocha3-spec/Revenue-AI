import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ provider: z.string().max(40), voiceId: z.string().max(120), name: z.string().max(120), favourite: z.boolean() });

export const POST = handle(async (req: Request) => {
  const ctx = await requireUser();
  const body = await parseBody(req, schema);
  const supabase = await createClient();
  if (body.favourite) {
    const { error } = await supabase.from("voice_favourites").upsert({ user_id: ctx.userId, org_id: ctx.orgId, provider: body.provider, provider_voice_id: body.voiceId, name: body.name });
    if (error) throw new ApiError(500, error.message);
  } else {
    const { error } = await supabase.from("voice_favourites").delete().eq("user_id", ctx.userId).eq("provider", body.provider).eq("provider_voice_id", body.voiceId);
    if (error) throw new ApiError(500, error.message);
  }
  return json({ ok: true });
});
