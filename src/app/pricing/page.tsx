import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$47",
    billing: "per month",
    desc: "Perfect for small businesses and developers getting started with AI-powered search.",
    cta: "Get Started",
    href: "https://selar.com/47plan?currency=USD",
    featured: false,
    features: [
      "Up to 50,000 search queries/month",
      "Up to 100,000 indexed records",
      "AI-powered search and semantic retrieval",
      "Instant search and autocomplete",
      "Search analytics dashboard",
      "3 search projects",
      "API access and JavaScript SDK",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "$57",
    billing: "per month",
    desc: "For growing businesses that need advanced personalisation and deeper analytics.",
    cta: "Get Started",
    href: "https://selar.com/57plan?currency=USD",
    featured: true,
    features: [
      "Up to 500,000 search queries/month",
      "Up to 1,000,000 indexed records",
      "Everything in Starter",
      "AI personalisation",
      "Recommendation engine",
      "Search merchandising tools",
      "10 search projects",
      "AI search assistant",
      "Priority email and chat support",
    ],
  },
  {
    name: "Scale",
    price: "$97",
    billing: "per month",
    desc: "For high-volume businesses and agencies that require enterprise-grade performance and control.",
    cta: "Get Started",
    href: "https://selar.com/97plan?currency=USD",
    featured: false,
    features: [
      "Unlimited search queries",
      "Unlimited indexed records",
      "Everything in Growth",
      "Unlimited search projects",
      "Advanced analytics and exports",
      "Team management and permissions",
      "Custom search ranking models",
      "Dedicated onboarding support",
      "99.9% uptime SLA",
    ],
  },
];

const faqs = [
  {
    q: "Can I change plans at any time?",
    a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Every plan includes a 14-day free trial with no credit card required. You can test the full platform before committing.",
  },
  {
    q: "What happens if I exceed my query limit?",
    a: "We will notify you when you approach your limit. Search continues to work and you are billed at a small per-query overage rate rather than experiencing downtime.",
  },
  {
    q: "Do I need a developer to get started?",
    a: "No. The SearchSprout dashboard lets you index content, configure search and deploy an embeddable widget without any code. Developer access is available via API for custom integrations.",
  },
  {
    q: "Can I use SearchSprout for multiple websites?",
    a: "Yes. Each plan includes multiple search projects. The Scale plan includes unlimited projects for agencies and enterprises managing many sites.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section style={{ background: "#071F20", padding: "5rem 0 4rem", textAlign: "center" }}>
          <div className="container-ss">
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#FFFFFF", marginBottom: "1.25rem", lineHeight: 1.1 }}>
              Simple, Transparent Pricing
            </h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.125rem", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
              Start free. Scale as you grow. All plans include the full SearchSprout platform with no feature restrictions.
            </p>
          </div>
        </section>

        {/* Pricing cards */}
        <section style={{ background: "#F7FAF8", padding: "5rem 0" }}>
          <div className="container-ss">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  style={{
                    background: plan.featured ? "#063B38" : "#FFFFFF",
                    border: plan.featured ? "2px solid #16C653" : "1px solid #DCE8E2",
                    borderRadius: "1rem",
                    padding: "2rem",
                    boxShadow: plan.featured ? "0 8px 32px rgba(6,59,56,0.2)" : "0 1px 4px rgba(6,59,56,0.06)",
                    position: "relative",
                  }}
                >
                  {plan.featured && (
                    <div style={{
                      position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                      background: "#16C653", color: "#FFFFFF", fontSize: "0.8125rem", fontWeight: 700,
                      padding: "0.3rem 1rem", borderRadius: "2rem", whiteSpace: "nowrap"
                    }}>
                      Most Popular
                    </div>
                  )}

                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: plan.featured ? "#16C653" : "#063B38", marginBottom: "0.25rem" }}>{plan.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem", marginBottom: "0.75rem" }}>
                      <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "2.5rem", color: plan.featured ? "#FFFFFF" : "#071F20" }}>{plan.price}</span>
                      <span style={{ fontSize: "0.9375rem", color: plan.featured ? "rgba(255,255,255,0.6)" : "#65736D" }}>{plan.billing}</span>
                    </div>
                    <p style={{ fontSize: "0.9rem", color: plan.featured ? "rgba(255,255,255,0.7)" : "#65736D", lineHeight: 1.55, margin: 0 }}>{plan.desc}</p>
                  </div>

                  <a
                    href={plan.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      padding: "0.75rem",
                      background: plan.featured ? "#16C653" : "#071F20",
                      color: "#FFFFFF",
                      borderRadius: "0.5rem",
                      fontWeight: 600, fontSize: "0.9375rem",
                      textDecoration: "none",
                      marginBottom: "1.75rem",
                      transition: "opacity 0.15s"
                    }}
                  >
                    {plan.cta} <ArrowRight size={15} />
                  </a>

                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.9rem", color: plan.featured ? "rgba(255,255,255,0.85)" : "#071F20" }}>
                        <CheckCircle2 size={15} color="#16C653" style={{ flexShrink: 0, marginTop: "0.15rem" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p style={{ textAlign: "center", color: "#65736D", fontSize: "0.875rem", marginTop: "2rem" }}>
              All plans include a 14-day free trial. No credit card required to start.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
          <div className="container-ss" style={{ maxWidth: "760px" }}>
            <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: "3rem" }}>
              Frequently Asked Questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {faqs.map((faq) => (
                <div key={faq.q} className="card-ss">
                  <h3 style={{ fontSize: "1rem", marginBottom: "0.625rem" }}>{faq.q}</h3>
                  <p style={{ color: "#65736D", fontSize: "0.9375rem", lineHeight: 1.65, margin: 0 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: "#063B38", padding: "5rem 0", textAlign: "center" }}>
          <div className="container-ss">
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#FFFFFF", marginBottom: "1rem" }}>
              Start Your Free Trial Today
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
              No credit card required. Full platform access for 14 days.
            </p>
            <Link href="/signup" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
              Start Building Free <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
