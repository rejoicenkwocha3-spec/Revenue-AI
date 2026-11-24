import { z } from "zod";
import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyPayment } from "@/lib/selar";
import { getPlan } from "@/config/plans";

/** Links a verified Selar payment (received before sign up) to this workspace. The payer email must match the account. */
export const POST = handle(async (req: Request) => {
  const ctx = await requireUser("billing.manage");
  const { reference } = await parseBody(req, z.object({ reference: z.string().trim().min(3).max(200) }));
  const admin = createAdminClient();
  const { data: ev } = await admin.from("payment_events").select("*").eq("provider", "selar").eq("event_id", reference).maybeSingle();
  if (!ev) throw new ApiError(404, "No verified payment with that reference has been received from Selar yet.");
  if (ev.processed) throw new ApiError(409, "This payment has already been applied.");
  if (!ev.customer_email || ev.customer_email.toLowerCase() !== ctx.email.toLowerCase()) throw new ApiError(403, "The payment was made with a different email address than your account.");
  const result = await applyPayment(ev.id, { eventId: ev.event_id, email: ev.customer_email, plan: getPlan(ev.plan_id) ?? null, amount: ev.amount != null ? Number(ev.amount) : null, currency: ev.currency, successful: true }, ctx.orgId);
  if (!result.ok) throw new ApiError(400, result.note);
  return json({ ok: true });
});
