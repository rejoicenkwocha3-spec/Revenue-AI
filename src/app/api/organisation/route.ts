import { z } from "zod";
import { handle, json, parseBody, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { assertAffected, dbError } from "@/lib/crud";
import { audit } from "@/lib/audit";

const schema = z.object({ name: z.string().trim().min(1).max(120).optional(), currency: z.enum(["USD", "EUR", "GBP", "NGN", "CAD", "AUD", "ZAR", "INR"]).optional(), fiscal_year_start_month: z.coerce.number().int().min(1).max(12).optional() });

export const PATCH = handle(async (req: Request) => {
  const ctx = await requireUser("team.manage");
  const body = await parseBody(req, schema);
  const supabase = await createClient();
  const { data, error } = await supabase.from("organisations").update(body).eq("id", ctx.orgId).select("id");
  dbError(error, "organisation");
  assertAffected(data, "organisation");
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "organisation.updated", details: body });
  return json({ ok: true });
});
