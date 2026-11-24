import { z } from "zod";
import { handle, json, parseBody, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export const POST = handle(async (req: Request) => {
  const ctx = await requireUser();
  const { ids } = await parseBody(req, z.object({ ids: z.array(z.string().uuid()).max(500).optional() }));
  const supabase = await createClient();
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", ctx.userId).is("read_at", null);
  if (ids?.length) q = q.in("id", ids);
  await q;
  return json({ ok: true });
});
