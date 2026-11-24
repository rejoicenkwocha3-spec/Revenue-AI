import { Check, ArrowUpRight } from "lucide-react";
import { PLANS } from "@/config/plans";
import { cn } from "@/lib/utils";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {PLANS.map((plan) => (
        <article
          key={plan.id}
          className={cn(
            "relative flex flex-col rounded-[20px] border p-7",
            plan.highlighted ? "border-navy bg-navy text-white shadow-[var(--shadow-float)]" : "border-line bg-white shadow-[var(--shadow-card)]",
          )}
        >
          {plan.highlighted && (
            <span className="absolute right-6 top-6 chip bg-coral text-white">Most popular</span>
          )}
          <h3 className={cn("text-xl font-extrabold", plan.highlighted && "text-white")}>{plan.name}</h3>
          <p className={cn("mt-1.5 text-sm", plan.highlighted ? "text-[#C5CCE6]" : "text-muted")}>{plan.summary}</p>
          <p className="mt-6 flex items-baseline gap-1.5">
            <span className={cn("font-display text-5xl font-extrabold tracking-tight", plan.highlighted ? "text-white" : "text-navy")}>
              ${plan.priceUsd}
            </span>
            <span className={cn("text-sm", plan.highlighted ? "text-[#C5CCE6]" : "text-muted")}>USD {plan.billingLabel}</span>
          </p>

          <dl className={cn("mt-6 grid grid-cols-2 gap-3 rounded-xl p-4 text-sm", plan.highlighted ? "bg-white/8" : "bg-canvas")}>
            <div>
              <dt className={plan.highlighted ? "text-[#AEB6D6]" : "text-muted"}>Dubbing</dt>
              <dd className="font-semibold">{plan.monthlyMinutes} min per month</dd>
            </div>
            <div>
              <dt className={plan.highlighted ? "text-[#AEB6D6]" : "text-muted"}>Storage</dt>
              <dd className="font-semibold">{plan.storageGb} GB</dd>
            </div>
            <div>
              <dt className={plan.highlighted ? "text-[#AEB6D6]" : "text-muted"}>Languages</dt>
              <dd className="font-semibold">{plan.targetLanguagesPerProject} per project</dd>
            </div>
            <div>
              <dt className={plan.highlighted ? "text-[#AEB6D6]" : "text-muted"}>Team seats</dt>
              <dd className="font-semibold">{plan.seats}</dd>
            </div>
          </dl>

          {!compact && (
            <>
              <p className={cn("mt-6 text-xs font-semibold uppercase tracking-wider", plan.highlighted ? "text-[#AEB6D6]" : "text-muted")}>Included</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {[...plan.features, `${plan.voiceClones} consent verified voice ${plan.voiceClones === 1 ? "clone" : "clones"}`].map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check size={16} className={cn("mt-0.5 shrink-0", plan.highlighted ? "text-[#9DB8FF]" : "text-blue")} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className={cn("mt-6 text-xs font-semibold uppercase tracking-wider", plan.highlighted ? "text-[#AEB6D6]" : "text-muted")}>Exports</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {plan.exports.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check size={16} className={cn("mt-0.5 shrink-0", plan.highlighted ? "text-[#9DB8FF]" : "text-blue")} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-auto pt-7">
            <a
              href={plan.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("btn w-full", plan.highlighted ? "btn-light" : "btn-primary")}
            >
              Choose {plan.name} <ArrowUpRight size={16} />
            </a>
            <p className={cn("mt-3 text-center text-xs", plan.highlighted ? "text-[#AEB6D6]" : "text-muted")}>
              Secure checkout on Selar. Use your LinguaDub email.
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
