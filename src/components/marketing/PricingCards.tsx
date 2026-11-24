import { Check, ExternalLink } from "lucide-react";
import { PLANS } from "@/config/plans";
import { cn } from "@/lib/utils";

const AGENT_NAMES: Record<string, string> = { deal_inspection: "Deal Inspection", forecasting: "Forecasting", sales_productivity: "Sales Productivity", pipeline_analysis: "Pipeline Analysis", customer_retention: "Customer Retention", revenue_insights: "Revenue Insights" };

/** Three plan cards linked to the Selar checkout pages in the order supplied. Paying never activates a plan by itself. */
export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {PLANS.map((p) => (
        <article key={p.id} className={cn("relative flex flex-col rounded-2xl border bg-white p-6", p.highlighted ? "border-blue shadow-[var(--shadow-lift)]" : "border-line shadow-[var(--shadow-card)]")}>
          {p.highlighted && <span className="absolute -top-3 left-6 rounded-full bg-blue px-3 py-1 text-xs font-semibold text-white">Most popular</span>}
          <h3 className="text-lg font-extrabold">{p.name}</h3>
          <p className="mt-1 min-h-[40px] text-sm text-muted">{p.summary}</p>
          <p className="mt-5"><span className="font-display text-4xl font-extrabold text-navy">${p.priceUsd}</span><span className="text-sm text-muted"> USD {p.billingLabel}</span></p>
          <p className="mt-1 text-xs text-muted">Billed monthly through Selar</p>
          <dl className="mt-5 space-y-2 rounded-xl bg-canvas p-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Users</dt><dd className="font-semibold text-ink">{p.seats}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Opportunities</dt><dd className="font-semibold text-ink">{p.maxOpportunities == null ? "Unlimited" : p.maxOpportunities.toLocaleString("en")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">AI questions a month</dt><dd className="font-semibold text-ink">{p.aiQueriesPerMonth.toLocaleString("en")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Integrations</dt><dd className="font-semibold text-ink">{p.maxIntegrations == null ? "Unlimited" : p.maxIntegrations}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">AI agents</dt><dd className="text-right font-semibold text-ink">{p.agents.length === 6 ? "All six" : p.agents.map((a) => AGENT_NAMES[a]).join(", ")}</dd></div>
          </dl>
          {!compact && (
            <div className="mt-5 space-y-4 text-sm">
              <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Included</p><ul className="mt-2 space-y-1.5">{p.features.map((f) => <li key={f} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-success" />{f}</li>)}</ul></div>
              <div><p className="text-xs font-bold uppercase tracking-wide text-muted">AI features</p><ul className="mt-2 space-y-1.5">{p.aiFeatures.map((f) => <li key={f} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-success" />{f}</li>)}</ul></div>
              <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Forecasting and reporting</p><ul className="mt-2 space-y-1.5">{[p.forecasting, ...p.reporting].map((f) => <li key={f} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-success" />{f}</li>)}</ul></div>
            </div>
          )}
          <a href={p.checkoutUrl} target="_blank" rel="noopener noreferrer" className={cn("btn mt-6 w-full", p.highlighted ? "btn-primary" : "btn-dark")}>Choose {p.name}<ExternalLink size={14} /></a>
        </article>
      ))}
    </div>
  );
}
