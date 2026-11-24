import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseSelarPayload, verifySignature, secretMatches, applyPayment } from "@/lib/selar";

/**
 * Selar payment notification endpoint.
 * Configure in Selar as: https://YOUR_DOMAIN/api/webhooks/selar?secret=SELAR_WEBHOOK_SECRET
 * Requests are accepted only with a valid HMAC signature header or the shared secret.
 * Subscriptions are activated only from verified notifications, never from checkout clicks.
 */
export async function POST(req: Request) {
  const secret = process.env.SELAR_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const raw = await req.text();
  const url = new URL(req.url);
  const sig = req.headers.get("x-selar-signature") ?? req.headers.get("x-signature") ?? req.headers.get("x-webhook-signature");
  const ok = verifySignature(raw, sig, secret) || secretMatches(url.searchParams.get("secret") ?? req.headers.get("x-webhook-secret"), secret);
  if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let payload: unknown;
  try {
    payload = (req.headers.get("content-type") ?? "").includes("application/x-www-form-urlencoded") ? Object.fromEntries(new URLSearchParams(raw)) : JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const parsed = parseSelarPayload(payload);
  const eventId = parsed.eventId ?? `hash:${Buffer.from(raw).toString("base64").slice(0, 120)}`;
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("payment_events")
    .insert({ provider: "selar", event_id: eventId, customer_email: parsed.email, plan_id: parsed.plan?.id ?? null, amount: parsed.amount, currency: parsed.currency, payload: payload as object })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const result = await applyPayment(row.id, parsed);
  if (!result.ok) await admin.from("payment_events").update({ process_note: result.note }).eq("id", row.id);
  return NextResponse.json({ ok: true, activated: result.ok, note: result.note });
}
