import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";

const plans = [
  { name: "Starter", href: "https://selar.com/47plan?currency=USD", features: ["10 analyses/month", "Similarity reports", "Citation checker", "Grammar analysis"] },
  { name: "Professional", href: "https://selar.com/57plan?currency=USD", features: ["50 analyses/month", "AI writing insights", "Authorship analysis", "Team: 5 members"], highlight: true },
  { name: "Institution", href: "https://selar.com/97plan?currency=USD", features: ["Unlimited analyses", "Institutional dashboard", "Role-based access", "API access"] },
];

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", user!.id)
    .single();

  const currentPlan = sub?.plan ?? "free";

  return (
    <>
      <DashboardHeader title="Billing" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 900 }}>

        {/* Current plan */}
        <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
          <div style={{ width: 48, height: 48, background: "#EEF3FD", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CreditCard size={24} color="#155EEF" />
          </div>
          <div>
            <p style={{ color: "#64748B", fontSize: "0.8125rem", fontWeight: 500, margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Plan</p>
            <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.25rem", color: "#102A43", margin: "0 0 0.25rem", textTransform: "capitalize" }}>{currentPlan}</p>
            {sub?.current_period_end && (
              <p style={{ color: "#64748B", fontSize: "0.875rem", margin: 0 }}>
                Renews {new Date(sub.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {/* Plans */}
        <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 1.25rem" }}>Available Plans</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1.25rem" }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{ background: "#ffffff", border: plan.highlight ? "2px solid #155EEF" : "1px solid #D1DCF0", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", boxShadow: plan.highlight ? "0 4px 16px rgba(21,94,239,0.1)" : "0 1px 4px rgba(16,42,67,0.06)", position: "relative" }}>
              {plan.highlight && (
                <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#155EEF", color: "white", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.875rem", borderRadius: 100, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Most Popular</div>
              )}
              <div>
                <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: 0 }}>{plan.name}</h3>
                {currentPlan === plan.name.toLowerCase() && (
                  <span style={{ display: "inline-block", background: "#F0FDF4", color: "#16A34A", fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.6rem", borderRadius: 100, marginTop: "0.375rem" }}>Current Plan</span>
                )}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", color: "#263449", fontSize: "0.875rem" }}>
                    <CheckCircle2 size={14} color="#155EEF" style={{ flexShrink: 0, marginTop: "0.15rem" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={plan.href} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: plan.highlight ? "#155EEF" : "transparent", color: plan.highlight ? "#ffffff" : "#155EEF", fontWeight: 600, fontSize: "0.875rem", padding: "0.625rem 1.25rem", borderRadius: 8, border: plan.highlight ? "none" : "1.5px solid #155EEF", textDecoration: "none" }}>
                {currentPlan === plan.name.toLowerCase() ? "Manage Plan" : "Upgrade"} <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>

        <p style={{ color: "#94A3B8", fontSize: "0.8125rem", marginTop: "1.5rem", lineHeight: 1.6 }}>
          Subscriptions are processed securely through Selar. Access is verified before activation. Contact support if you have billing questions.
        </p>
      </div>
    </>
  );
}
