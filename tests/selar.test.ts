import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { parseSelarPayload, verifySignature, secretMatches } from "@/lib/selar-parse";
import { PLANS } from "@/config/plans";

test("pricing cards keep the Selar links in the supplied order", () => {
  assert.deepEqual(PLANS.map((p) => p.checkoutUrl), ["https://selar.com/47plan?currency=USD", "https://selar.com/57plan?currency=USD", "https://selar.com/97plan?currency=USD"]);
  assert.deepEqual(PLANS.map((p) => [p.name, p.priceUsd, p.billing]), [["Starter", 47, "month"], ["Growth", 57, "month"], ["Scale", 97, "month"]]);
});

test("a successful payment notification is parsed to the right plan", () => {
  const p = parseSelarPayload({ event: "order.completed", data: { reference: "ORD-1", amount: "57.00", currency: "usd", product: { url: "https://selar.com/57plan" }, customer: { email: "Buyer@Example.com" } } });
  assert.equal(p.plan?.id, "plan_57");
  assert.equal(p.email, "buyer@example.com");
  assert.equal(p.eventId, "ORD-1");
  assert.equal(p.currency, "USD");
  assert.equal(p.successful, true);
});

test("failed or refunded payments are never treated as successful", () => {
  assert.equal(parseSelarPayload({ status: "failed", product: "47plan", email: "a@b.co" }).successful, false);
  assert.equal(parseSelarPayload({ status: "refunded", product: "47plan", email: "a@b.co" }).successful, false);
});

test("webhook authentication rejects wrong signatures and secrets", () => {
  const body = JSON.stringify({ a: 1 });
  const sig = crypto.createHmac("sha256", "s3cret").update(body).digest("hex");
  assert.equal(verifySignature(body, sig, "s3cret"), true);
  assert.equal(verifySignature(body, `sha256=${sig}`, "s3cret"), true);
  assert.equal(verifySignature(body, sig, "other"), false);
  assert.equal(verifySignature(body, null, "s3cret"), false);
  assert.equal(secretMatches("s3cret", "s3cret"), true);
  assert.equal(secretMatches("s3creT", "s3cret"), false);
  assert.equal(secretMatches(null, "s3cret"), false);
});
