"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, ArrowRight } from "lucide-react";

const badge = { display: "inline-block", background: "#EEF3FD", color: "#155EEF", fontSize: "0.8125rem", fontWeight: 600, padding: "0.25rem 0.875rem", borderRadius: "100px", marginBottom: "1rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" };

const plans = [
  {
    name: "Starter",
    href: "https://selar.com/47plan?currency=USD",
    highlight: false,
    features: [
      "Up to 10 document analyses per month",
      "Similarity checking against web and repository sources",
      "Originality reports with PDF export",
      "Citation checker: APA, MLA, Harvard",
      "Grammar and writing analysis",
      "Single user account",
      "Email support",
    ],
  },
  {
    name: "Professional",
    href: "https://selar.com/57plan?currency=USD",
    highlight: true,
    features: [
      "Up to 50 document analyses per month",
      "Full similarity checking and source comparison",
      "AI writing insights with confidence indicators",
      "Authorship analysis",
      "Citation checker: all major formats",
      "Grammar, tone and readability analysis",
      "Advanced originality reports",
      "Team collaboration: up to 5 members",
      "Priority email support",
    ],
  },
  {
    name: "Institution",
    href: "https://selar.com/97plan?currency=USD",
    highlight: false,
    features: [
      "Unlimited document analyses",
      "Full platform access: all features",
      "Institutional dashboard",
      "Department, class and assignment management",
      "Role-based access: Owner, Admin, Lecturer, Student",
      "Bulk submission and review workflows",
      "Aggregate reporting and usage statistics",
      "API access",
      "Dedicated account support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <section style={{ background: "linear-gradient(150deg, #102A43 0%, #2864DC 100%)", padding: "5rem 0 4rem", textAlign: "center" }}>
        <div className="container-ta">
          <div style={badge}>Pricing</div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem,5vw,3.25rem)", color: "#ffffff", lineHeight: 1.1, margin: "0 auto 1.25rem", letterSpacing: "-0.02em" }}>
            Simple, Transparent Pricing
          </h1>
          <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
            Choose the plan that fits your needs. All plans include core originality checking and report generation.
          </p>
        </div>
      </section>

      <section style={{ padding: "5rem 0", background: "#F5F8FC" }}>
        <div className="container-ta">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "2rem", maxWidth: 1050, margin: "0 auto" }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: "#ffffff",
                  border: plan.highlight ? "2px solid #155EEF" : "1px solid #D1DCF0",
                  borderRadius: 16,
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  position: "relative",
                  boxShadow: plan.highlight ? "0 8px 32px rgba(21,94,239,0.12)" : "0 1px 4px rgba(16,42,67,0.06)",
                }}
              >
                {plan.highlight && (
                  <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#155EEF", color: "white", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 1rem", borderRadius: 100, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Most Popular
                  </div>
                )}
                <div>
                  <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.375rem", color: "#102A43", margin: "0 0 0.5rem" }}>{plan.name}</h2>
                  <p style={{ color: "#64748B", fontSize: "0.9rem", margin: 0 }}>
                    {plan.name === "Starter" && "For individual students and writers."}
                    {plan.name === "Professional" && "For educators, researchers and small teams."}
                    {plan.name === "Institution" && "For universities, colleges and organisations."}
                  </p>
                </div>

                <div style={{ padding: "1.25rem", background: "#F5F8FC", borderRadius: 10, textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: "0.875rem", margin: "0 0 0.25rem" }}>Starting from</p>
                  <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#102A43", margin: 0 }}>See current pricing on checkout</p>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem", flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", color: "#263449", fontSize: "0.9rem", lineHeight: 1.5 }}>
                      <CheckCircle2 size={16} color="#155EEF" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    background: plan.highlight ? "#155EEF" : "transparent",
                    color: plan.highlight ? "#ffffff" : "#155EEF",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    padding: "0.75rem 1.5rem",
                    borderRadius: 8,
                    border: plan.highlight ? "none" : "1.5px solid #155EEF",
                    textDecoration: "none",
                    transition: "opacity 0.2s",
                    marginTop: "auto",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Get {plan.name} <ArrowRight size={15} />
                </a>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "0.875rem", marginTop: "2.5rem", maxWidth: 500, marginInline: "auto" }}>
            All plans are processed securely through Selar. Subscriptions are verified before access is granted. Clicking a plan button takes you to the secure checkout page.
          </p>
        </div>
      </section>

      <section style={{ background: "#ffffff", padding: "4rem 0", borderTop: "1px solid #D1DCF0" }}>
        <div className="container-ta">
          <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.625rem", color: "#102A43", margin: "0 0 2rem", textAlign: "center" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
            {[
              { q: "What counts as a document analysis?", a: "Each document submitted through TrueAuthor for similarity, AI writing or authorship analysis counts as one analysis against your monthly allowance." },
              { q: "Can I upgrade or change my plan?", a: "Yes. You can upgrade to a higher plan at any time. Your new plan limit applies from the billing date of the upgrade." },
              { q: "Is my document data secure?", a: "Yes. TrueAuthor uses Supabase-managed storage with row-level security. Your documents are accessible only to you and authorised users within your organisation." },
              { q: "Does TrueAuthor access the Turnitin database?", a: "No. TrueAuthor uses its own authorised comparison sources. It does not access Turnitin's proprietary student paper database or subscription publisher databases." },
            ].map((faq) => (
              <div key={faq.q} style={{ background: "#F5F8FC", borderRadius: 10, padding: "1.25rem", border: "1px solid #D1DCF0" }}>
                <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#102A43", margin: "0 0 0.5rem" }}>{faq.q}</p>
                <p style={{ color: "#64748B", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
