import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, planFromSelarText, type Plan } from "@/config/plans";
import { logActivity, notify, orgMemberIds } from "@/lib/activity";

/** Collects every string value in a nested payload with its key path. */
function walk(v: unknown, path: string[] = [], out: { path: string; value: string }[] = []) {
  if (v == null) return out;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out.push({ path: path.join(".").toLowerCase(), value: String(v) });
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...path, String(i)], out));
  else if (typeof v === "object") for (const [k, x] of Object.entries(v as Record<string, unknown>)) walk(x, [...path, k], out);
  return out;
}

export interface ParsedPayment {
  eventId: string | null;
  email: string | null;
  plan: Plan | null;
  amount: number | null;
  currency: string | null;
  successful: boolean;
}

/** Tolerant parser: Selar payloads are matched by field names, and the plan by its product slug. */
export function parseSelarPayload(payload: unknown): ParsedPayment {
  const fields = walk(payload);
  const find = (re: RegExp, valueRe?: RegExp) => fields.find((f) => re.test(f.path) && (!valueRe || valueRe.test(f.value)))?.value ?? null;
  const email = find(/email/, /^[^\s@]+@[^\s@]+\.[^\s@]+$/)?.toLowerCase() ?? null;
  const eventId =
    find(/(^|\.)(transaction_?)?reference$/) ?? find(/transaction_?(id|ref)$/) ?? find(/(order|payment|event)_?id$/) ?? find(/(^|\.)(order|transaction|data)\.id$/) ?? find(/^id$/);
  const plan = planFromSelarText(fields.map((f) => f.value).join(" ")) ?? null;
  const amountStr = find(/(amount|price|total)$/, /^\d+(\.\d+)?$/);
  const currency = find(/currency$/, /^[A-Za-z]{3}$/)?.toUpperCase() ?? null;
  const status = find(/(^|\.)(status|payment_status|event|type)$/)?.toLowerCase() ?? "";
  const failed = /(fail|declin|refund|cancel|abandon|pending)/.test(status);
  return { eventId, email, plan, amount: amountStr ? Number(amountStr) : null, currency, successful: !failed };
}

export function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const sig = signature.replace(/^sha256=/, "").trim();
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function secretMatches(provided: string | null, secret: string): boolean {
  if (!provided || provided.length !== secret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
}

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
    if (!profile) return { ok: false, note: `No LinguaDub account for ${p.email}. It can be claimed after sign up.` };
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
  await logActivity({ orgId, action: "billing.activated", details: { plan: p.plan.name } });
  await notify({ userIds: await orgMemberIds(orgId, ["owner", "admin"]), orgId, title: `${p.plan.name} plan is active`, body: `Your payment was verified. The plan renews on ${end.toISOString().slice(0, 10)}.`, link: "/dashboard/billing" });
  return { ok: true, note: "activated", orgId };
}
