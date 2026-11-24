import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/billing";
import { PageHeader, Notice } from "@/components/app/ui";
import { PricingCards } from "@/components/marketing/PricingCards";
import { can } from "@/lib/permissions";
import { formatBytes, formatDate } from "@/lib/utils";
import { ClaimPayment } from "./ClaimPayment";

export const metadata = { title: "Billing" };

function Meter({ label, used, total, format }: { label: string; used: number; total: number; format: (n: number) => string }) {
  const pct = total ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="font-medium text-navy">{label}</span><span className="tabular-nums text-muted">{format(used)} of {format(total)}</span></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas"><div className={`h-full rounded-full ${pct > 90 ? "bg-coral" : "bg-blue"}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default async function BillingPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const ent = await getEntitlements(ctx.orgId);
  const manage = can(ctx.role, "billing.manage");
  const [{ count: members }, { count: clones }, { data: history }, { data: payments }] = await Promise.all([
    supabase.from("organisation_members").select("user_id", { count: "exact", head: true }).eq("org_id", ctx.orgId),
    supabase.from("voice_profiles").select("id", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("is_cloned", true).eq("status", "active"),
    supabase.from("subscriptions").select("id, plan_id, status, current_period_start, current_period_end, provider_reference, created_at").eq("org_id", ctx.orgId).order("created_at", { ascending: false }).limit(12),
    manage ? supabase.from("payment_events").select("id, event_id, amount, currency, plan_id, processed, process_note, received_at").eq("org_id", ctx.orgId).order("received_at", { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
  ]);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Billing" description="Your plan, usage this billing period and payment history." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section className="card p-6">
          <p className="text-sm text-muted">Current plan</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-navy">{ent.plan ? ent.plan.name : "No active plan"}</p>
          {ent.plan && ent.subscription ? (
            <p className="mt-1 text-sm text-muted">${ent.plan.priceUsd} USD {ent.plan.billingLabel} · active until {formatDate(ent.subscription.currentPeriodEnd)}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">{ent.minutesIncluded ? `Trial allowance of ${ent.minutesIncluded} minutes.` : "Choose a plan below to start dubbing."}</p>
          )}
          <Notice className="mt-4">Plans are activated automatically when Selar confirms your payment. Pay with <span className="font-semibold">{ctx.email}</span> so the payment matches this workspace.</Notice>
        </section>
        <section className="card space-y-5 p-6">
          <Meter label="Dubbing minutes" used={ent.minutesUsed} total={ent.minutesIncluded} format={(n) => `${n.toFixed(1)} min`} />
          <Meter label="Storage" used={ent.storageBytesUsed} total={ent.storageBytesIncluded} format={formatBytes} />
          <Meter label="Team seats" used={members ?? 0} total={ent.seats} format={(n) => String(n)} />
          <Meter label="Cloned voices" used={clones ?? 0} total={ent.voiceClones} format={(n) => String(n)} />
          <p className="text-xs text-muted">Usage period started {formatDate(ent.periodStart)}.</p>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Plans</h2>
        <PricingCards />
      </section>

      {manage && <ClaimPayment />}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card">
          <h2 className="border-b border-line px-6 py-4 text-lg font-bold">Subscription history</h2>
          {!history?.length ? <p className="px-6 py-6 text-sm text-muted">No subscriptions yet.</p> : (
            <ul className="divide-y divide-line text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex justify-between gap-3 px-6 py-3">
                  <span className="font-medium text-navy">{h.plan_id.replace("plan_", "Plan ")}</span>
                  <span className="text-muted">{formatDate(h.current_period_start)} to {formatDate(h.current_period_end)}</span>
                  <span className={h.status === "active" ? "font-semibold text-success" : "text-muted"}>{h.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {manage && (
          <section className="card">
            <h2 className="border-b border-line px-6 py-4 text-lg font-bold">Verified payments</h2>
            {!payments?.length ? <p className="px-6 py-6 text-sm text-muted">Payments confirmed by Selar appear here.</p> : (
              <ul className="divide-y divide-line text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="px-6 py-3">
                    <div className="flex justify-between gap-3"><span className="font-medium text-navy">{p.amount != null ? `${p.amount} ${p.currency ?? ""}` : "Payment"}</span><span className="text-muted">{formatDate(p.received_at)}</span></div>
                    <p className="text-xs text-muted">Reference {p.event_id} · {p.process_note}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
