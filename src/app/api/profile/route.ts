import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export const PATCH = handle(async (req: Request) => {
  const ctx = await requireUser();
  const { fullName } = await parseBody(req, z.object({ fullName: z.string().trim().min(2).max(120) }));
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", ctx.userId);
  if (error) throw new ApiError(500, error.message);
  await supabase.auth.updateUser({ data: { full_name: fullName } });
  return json({ ok: true });
});
