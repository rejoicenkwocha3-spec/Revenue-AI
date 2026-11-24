import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type Plan } from "@/config/plans";
import type { ParsedPayment } from "@/lib/selar-parse";
export { parseSelarPayload, verifySignature, secretMatches, type ParsedPayment } from "@/lib/selar-parse";
import { audit, notify, orgMemberIds } from "@/lib/audit";

function addPeriod(from: Date, plan: Plan): Date {
  const d = new Date(from);
  if (plan.billing === "year") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

/** Activates or extends the plan for the organisation that owns the paying email. */
export async function applyPayment(eventRowId: string, p: ParsedPayment, forOrgId?: string): Promise<{ ok: boolean; note: string; orgId?: string }> {
  const admin = createAdminClient();
  if (!p.successful) return { ok: false, note: "Payment not successful" };
  if (!p.plan) return { ok: false, note: `Could not identify the plan. Expected one of: ${PLANS.map((x) => x.selarSlug).join(", ")}` };
  if (p.currency && p.currency !== "USD") return { ok: false, note: `Unexpected currency ${p.currency}` };
  if (p.amount != null && p.amount + 0.01 < p.plan.priceUsd) return { ok: false, note: `Amount ${p.amount} is below the ${p.plan.name} price` };

  let orgId = forOrgId ?? null;
  if (!orgId) {
    if (!p.email) return { ok: false, note: "No customer email in the notification" };
    const { data: profile } = await admin.from("profiles").select("id, default_org_id").eq("email", p.email).maybeSingle();
    if (!profile) return { ok: false, note: `No Revenue AI account for ${p.email}. It can be claimed after sign up.` };
    const { data: owned } = await admin.from("organisations").select("id").eq("owner_id", profile.id).limit(1);
    orgId = owned?.[0]?.id ?? profile.default_org_id;
  }
  if (!orgId) return { ok: false, note: "No workspace found for the customer" };

  const now = new Date();
  const { data: current } = await admin.from("subscriptions").select("*").eq("org_id", orgId).eq("status", "active").order("current_period_end", { ascending: false }).limit(1).maybeSingle();
  const start = current && current.plan_id === p.plan.id && current.current_period_end && new Date(current.current_period_end) > now ? new Date(current.current_period_end) : now;
  const end = addPeriod(start, p.plan);
  if (current) await admin.from("subscriptions").update({ status: "expired", updated_at: now.toISOString() }).eq("id", current.id);
  await admin.from("subscriptions").insert({
    org_id: orgId,
    plan_id: p.plan.id,
    status: "active",
    provider: "selar",
    provider_reference: p.eventId,
    customer_email: p.email,
    current_period_start: current && start > now ? current.current_period_start : now.toISOString(),
    current_period_end: end.toISOString(),
  });
  await admin.from("payment_events").update({ processed: true, org_id: orgId, process_note: `Activated ${p.plan.name} until ${end.toISOString().slice(0, 10)}` }).eq("id", eventRowId);
  await audit({ orgId, actorType: "system", action: "billing.activated", details: { plan: p.plan.name, reference: p.eventId } });
  await notify({ userIds: await orgMemberIds(orgId, ["owner", "admin"]), orgId, title: `${p.plan.name} plan is active`, body: `Your payment was verified. The plan renews on ${end.toISOString().slice(0, 10)}.`, link: "/dashboard/billing" });
  return { ok: true, note: "activated", orgId };
}
