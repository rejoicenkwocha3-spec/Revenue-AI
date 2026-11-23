import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    selarUrl: "https://selar.com/47plan?currency=USD",
    highlight: false,
    description: "For small businesses beginning their climate journey.",
    features: [
      "1 organisation",
      "Up to 2 users",
      "Scope 1 and 2 tracking",
      "Basic Scope 3 categories",
      "Activity data entry",
      "Standard emission factors",
      "GHG Protocol report",
      "CSV export",
      "Email support",
    ],
  },
  {
    name: "Professional",
    selarUrl: "https://selar.com/57plan?currency=USD",
    highlight: true,
    badge: "Most Popular",
    description: "For growing companies with serious sustainability ambitions.",
    features: [
      "Up to 3 organisations",
      "Up to 10 users",
      "Full Scope 1, 2 and 3 tracking",
      "All 15 Scope 3 categories",
      "AI Climate Assistant",
      "Custom emission factors",
      "Multi-framework reporting",
      "Supplier engagement module",
      "Decarbonisation planning",
      "PDF and CSV exports",
      "Priority email support",
    ],
  },
  {
    name: "Enterprise",
    selarUrl: "https://selar.com/97plan?currency=USD",
    highlight: false,
    description: "For large organisations with complex reporting requirements.",
    features: [
      "Unlimited organisations",
      "Unlimited users",
      "Full platform access",
      "Advanced AI insights",
      "CSRD, ESRS and ISSB workflows",
      "Audit and assurance tools",
      "Team permissions",
      "API access",
      "Dedicated onboarding",
      "Priority support",
      "Custom integrations",
    ],
  },
];

const faqs = [
  {
    q: "What emission factors does ClimateBooks use?",
    a: "ClimateBooks uses recognised emission factor datasets. The source, publication year, geography and applicable unit are recorded for every factor. Users can also upload custom emission factors where required.",
  },
  {
    q: "Is ClimateBooks compliant with GHG Protocol?",
    a: "ClimateBooks is designed to support GHG Protocol-aligned carbon accounting. The platform records methodology, activity data, emission factors and calculation results in a transparent, auditable format. Compliance with any specific regulatory requirement depends on how your organisation uses the platform.",
  },
  {
    q: "Can I manage multiple companies?",
    a: "Yes. The Professional plan supports up to 3 organisations. The Enterprise plan supports unlimited organisations, making it suitable for holding companies, consultants and enterprise group structures.",
  },
  {
    q: "How does the AI Climate Assistant work?",
    a: "The AI Assistant analyses your actual emissions data to answer questions about your carbon footprint, identify hotspots and recommend reduction opportunities. It is grounded in your records and approved climate accounting references. It never fabricates data or claims compliance without sufficient evidence.",
  },
  {
    q: "What reporting frameworks are supported?",
    a: "ClimateBooks supports structured workflows for GHG Protocol, CDP, CSRD, ESRS, ISSB and SECR. Framework-specific reporting is available where the required data and methodology are supported within the platform.",
  },
  {
    q: "What happens after I click Get Started on a plan?",
    a: "Clicking the plan button takes you to a secure Selar checkout. After completing your subscription, you will receive access credentials. ClimateBooks verifies your subscription status before granting paid access.",
  },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <section style={{ background: "linear-gradient(160deg, #0B352B 0%, #174D36 100%)", padding: "5rem 0 4rem" }}>
        <div className="container-cb" style={{ textAlign: "center", maxWidth: "640px" }}>
          <span className="eyebrow">Pricing</span>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3.25rem)", color: "#FFFFFF", marginTop: "0.75rem", marginBottom: "1.25rem", lineHeight: 1.1 }}>
            Transparent pricing for every stage
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.0625rem", lineHeight: 1.7 }}>
            Three clear plans designed for businesses at different stages of their climate journey. All plans include full pricing details on the checkout page.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section style={{ background: "#F7F8F3", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight ? "#0B352B" : "#FFFFFF",
                  border: `1.5px solid ${plan.highlight ? "#174D36" : "#DDE8E2"}`,
                  borderRadius: "1.25rem",
                  padding: "2rem 1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  position: "relative",
                  boxShadow: plan.highlight ? "0 12px 48px rgba(11,53,43,0.2)" : "0 2px 8px rgba(11,53,43,0.05)",
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: "-0.875rem", left: "50%", transform: "translateX(-50%)",
                    background: "#D9AD55", color: "#0B352B",
                    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em",
                    padding: "0.25rem 0.875rem", borderRadius: "999px", whiteSpace: "nowrap",
                  }}>
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.375rem", color: plan.highlight ? "#FFFFFF" : "#0B352B" }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: plan.highlight ? "rgba(255,255,255,0.55)" : "#5A6B61", marginTop: "0.375rem", lineHeight: 1.5 }}>
                    {plan.description}
                  </div>
                </div>

                <div style={{ fontSize: "0.75rem", color: plan.highlight ? "rgba(255,255,255,0.4)" : "#9BAF9A", fontStyle: "italic" }}>
                  Full pricing details on checkout
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem", flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                      <CheckCircle2 size={15} style={{ color: plan.highlight ? "#D9AD55" : "#174D36", flexShrink: 0, marginTop: "0.1rem" }} />
                      <span style={{ fontSize: "0.875rem", color: plan.highlight ? "rgba(255,255,255,0.8)" : "#242B27", lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.selarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={plan.highlight ? "btn-gold" : "btn-primary"}
                  style={{ width: "100%", textAlign: "center", justifyContent: "center" }}
                >
                  Get {plan.name} <ArrowRight size={15} />
                </a>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.8125rem", color: "#5A6B61" }}>
            Subscription access is verified after checkout. Paid features are not activated by clicking a button alone.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
        <div className="container-cb" style={{ maxWidth: "760px" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="eyebrow">Common Questions</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0B352B", marginTop: "0.5rem" }}>
              Frequently asked questions
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {faqs.map((faq) => (
              <div key={faq.q} style={{ border: "1px solid #DDE8E2", borderRadius: "0.875rem", padding: "1.25rem 1.5rem" }}>
                <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#0B352B", marginBottom: "0.625rem" }}>
                  {faq.q}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#5A6B61", lineHeight: 1.65 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0B352B", padding: "4.5rem 0" }}>
        <div className="container-cb" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#FFFFFF", marginBottom: "1rem" }}>
            Ready to start measuring your impact?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "2rem" }}>
            Choose the plan that fits your organisation and begin your climate programme today.
          </p>
          <Link href="/signup" className="btn-gold">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
