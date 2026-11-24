import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export const PATCH = handle(async (req: Request) => {
  const ctx = await requireUser("team.manage");
  const { name } = await parseBody(req, z.object({ name: z.string().trim().min(1).max(120) }));
  const supabase = await createClient();
  const { error } = await supabase.from("organisations").update({ name, updated_at: new Date().toISOString() }).eq("id", ctx.orgId);
  if (error) throw new ApiError(500, error.message);
  return json({ ok: true });
});
