import crypto from "node:crypto";
import { planFromSelarText, type Plan } from "@/config/plans";

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

