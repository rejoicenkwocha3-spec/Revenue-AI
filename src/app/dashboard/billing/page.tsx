"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, ExternalLink, Info } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "$47",
    period: "per month",
    features: ["1 organisation", "Up to 500 emission records", "Scope 1, 2 and 3 tracking", "GHG Protocol reports", "Email support"],
    selarUrl: "https://selar.com/47plan?currency=USD",
    color: "#174D36",
    bg: "#E8F2EC",
  },
  {
    name: "Professional",
    price: "$57",
    period: "per month",
    features: ["5 organisations", "Unlimited emission records", "All Scope 1, 2 and 3 categories", "CDP, CSRD, ISSB reporting", "AI Climate Assistant", "Supplier engagement", "Priority support"],
    selarUrl: "https://selar.com/57plan?currency=USD",
    color: "#0B352B",
    bg: "#174D36",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$97",
    period: "per month",
    features: ["Unlimited organisations", "Unlimited emission records", "All frameworks including SECR", "Full AI Climate Assistant", "Team management", "API access", "Dedicated support"],
    selarUrl: "https://selar.com/97plan?currency=USD",
    color: "#174D36",
    bg: "#E8F2EC",
  },
];

export default function BillingPage() {
  const [userEmail, setUserEmail] = useState("");

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserEmail(user?.email || ""));
  }, []);

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "900px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Billing</h1>
        <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Manage your ClimateBooks subscription</p>
      </div>

      <div style={{ background: "#FDF5E0", border: "1px solid #F0E0A8", borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "2rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <Info size={15} style={{ color: "#8B6B10", flexShrink: 0, marginTop: "1px" }} />
        <p style={{ fontSize: "0.8125rem", color: "#5A3A00", lineHeight: 1.6, margin: 0 }}>
          Subscriptions are processed securely through Selar. After payment, your subscription status will be verified before full access is granted. Access is not granted solely by clicking a checkout button.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        {PLANS.map((plan) => (
          <div key={plan.name} style={{
            background: plan.highlight ? plan.bg : "#FFFFFF",
            border: `1.5px solid ${plan.highlight ? "#0B352B" : "#DDE8E2"}`,
            borderRadius: "1.125rem",
            padding: "1.75rem 1.5rem",
            position: "relative",
          }}>
            {plan.highlight && (
              <div style={{ position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)", background: "#D9AD55", color: "#0B352B", fontSize: "0.65rem", fontWeight: 800, padding: "0.2rem 0.75rem", borderRadius: "0 0 0.5rem 0.5rem", whiteSpace: "nowrap" }}>
                MOST POPULAR
              </div>
            )}
            <div style={{ marginBottom: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: plan.highlight ? "rgba(255,255,255,0.6)" : "#9BAF9A", textTransform: "uppercase", letterSpacing: "0.08em" }}>{plan.name}</div>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "2rem", color: plan.highlight ? "#FFFFFF" : "#0B352B", lineHeight: 1 }}>{plan.price}</div>
            <div style={{ fontSize: "0.775rem", color: plan.highlight ? "rgba(255,255,255,0.5)" : "#9BAF9A", marginBottom: "1.25rem" }}>{plan.period}</div>
            <ul style={{ listStyle: "none", margin: "0 0 1.5rem", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {plan.features.map((f) => (
                <li key={f} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.8125rem", color: plan.highlight ? "rgba(255,255,255,0.8)" : "#5A6B61" }}>
                  <span style={{ color: plan.highlight ? "#D9AD55" : "#174D36", marginTop: "1px", flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href={plan.selarUrl} target="_blank" rel="noopener noreferrer" className={plan.highlight ? "btn-gold" : "btn-primary"} style={{ width: "100%", textAlign: "center", justifyContent: "center", display: "flex", gap: "0.4rem", alignItems: "center", textDecoration: "none" }}>
              Subscribe <ExternalLink size={13} />
            </a>
          </div>
        ))}
      </div>

      <div className="card-cb">
        <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "0.9375rem", color: "#0B352B", marginBottom: "0.75rem" }}>Subscription questions</h3>
        <p style={{ fontSize: "0.8375rem", color: "#5A6B61", lineHeight: 1.65, margin: 0 }}>
          For billing support or to discuss an enterprise arrangement, contact us at <strong>hello@climatebooks.io</strong>. Please include your account email: <code style={{ background: "#F7F8F3", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", fontSize: "0.8rem" }}>{userEmail}</code>
        </p>
      </div>
    </div>
  );
}
