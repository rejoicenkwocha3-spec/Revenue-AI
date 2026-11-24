import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/billing";
import { PageHeader, Notice } from "@/components/app/ui";
import { PricingCards } from "@/components/marketing/PricingCards";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { ClaimPayment } from "./ClaimPayment";

export const metadata = { title: "Billing" };

function Meter({ label, used, total, format }: { label: string; used: number; total: number | null; format: (n: number) => string }) {
  const pct = total ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="font-medium text-navy">{label}</span><span className="tabular-nums text-muted">{format(used)} of {total == null ? "unlimited" : format(total)}</span></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas"><div className={`h-full rounded-full ${pct > 90 ? "bg-danger" : "bg-blue"}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default async function BillingPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const ent = await getEntitlements(ctx.orgId);
  const manage = can(ctx.role, "billing.manage");
  const [{ count: members }, { count: opps }, { count: integrations }, { data: history }, { data: payments }] = await Promise.all([
    supabase.from("organisation_members").select("user_id", { count: "exact", head: true }).eq("org_id", ctx.orgId),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("org_id", ctx.orgId),
    supabase.from("integrations").select("id", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("status", "connected"),
    supabase.from("subscriptions").select("id, plan_id, status, current_period_start, current_period_end, provider_reference, created_at").eq("org_id", ctx.orgId).order("created_at", { ascending: false }).limit(12),
    manage ? supabase.from("payment_events").select("id, event_id, amount, currency, plan_id, processed, process_note, received_at").eq("org_id", ctx.orgId).order("received_at", { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
  ]);
  const n = (v: number) => String(v);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Billing" description="Your plan, usage and payment history." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section className="card p-6">
          <p className="text-sm text-muted">Current plan</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-navy">{ent.plan ? ent.plan.name : "Free"}</p>
          {ent.plan && ent.subscription ? (
            <p className="mt-1 text-sm text-muted">${ent.plan.priceUsd} USD {ent.plan.billingLabel} · active until {formatDate(ent.subscription.currentPeriodEnd)}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">Free limits apply until a paid plan is verified. Choose a plan below.</p>
          )}
          <Notice className="mt-4">Plans activate only when Selar confirms your payment, never from clicking a checkout button. Pay with <span className="font-semibold">{ctx.email}</span> so the payment matches this organisation.</Notice>
        </section>
        <section className="card space-y-5 p-6">
          <Meter label="Users" used={members ?? 0} total={ent.seats} format={n} />
          <Meter label="Opportunities" used={opps ?? 0} total={ent.maxOpportunities} format={n} />
          <Meter label="AI questions this month" used={ent.aiQueriesUsed} total={ent.aiQueriesPerMonth} format={n} />
          <Meter label="Connected integrations" used={integrations ?? 0} total={ent.maxIntegrations} format={n} />
          <p className="text-xs text-muted">AI agents included: {ent.agents.length} of 6. Usage period started {formatDate(ent.periodStart)}.</p>
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
