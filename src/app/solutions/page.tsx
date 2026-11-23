import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Building2, Factory, TrendingDown, Globe, Landmark, Truck, Users, BarChart3 } from "lucide-react";

const solutions = [
  {
    icon: Building2,
    audience: "Small and Medium Businesses",
    problem: "SMBs face growing pressure from customers, lenders and regulators to demonstrate environmental responsibility, but lack the internal resources or expertise to manage complex climate reporting.",
    benefits: [
      "Get started quickly with guided data entry and clear methodology",
      "Understand your carbon footprint without specialist knowledge",
      "Generate credible sustainability reports for stakeholders",
      "Identify your highest-impact reduction opportunities",
    ],
  },
  {
    icon: Globe,
    audience: "Large Enterprises",
    problem: "Enterprise organisations managing multiple sites, departments and reporting entities need a centralised platform to consolidate emissions data, enforce data quality and produce board-level climate disclosures.",
    benefits: [
      "Manage multiple organisations and reporting entities",
      "Consolidate Scope 1, 2 and 3 data across all locations",
      "Produce CSRD, ESRS and ISSB-aligned disclosures",
      "Track performance against science-based targets",
    ],
  },
  {
    icon: Landmark,
    audience: "Financial Institutions",
    problem: "Banks, asset managers and insurers must assess, disclose and manage the climate risks and financed emissions within their portfolios to meet TCFD, SFDR and regulatory requirements.",
    benefits: [
      "Measure financed and facilitated emissions (Scope 3 Category 15)",
      "Assess transition and physical climate risks",
      "Produce investor and regulatory climate disclosures",
      "Engage portfolio companies on sustainability performance",
    ],
  },
  {
    icon: Factory,
    audience: "Manufacturing Companies",
    problem: "Manufacturers face emissions from energy-intensive processes, complex supply chains and product lifecycles. Measuring and reducing industrial emissions requires detailed activity-level tracking.",
    benefits: [
      "Track direct emissions from manufacturing processes (Scope 1)",
      "Measure purchased energy and industrial energy intensity (Scope 2)",
      "Map supply chain emissions across material inputs (Scope 3)",
      "Support product carbon footprint calculations",
    ],
  },
  {
    icon: Building2,
    audience: "Real Estate and Property",
    problem: "Property developers and real estate investors must account for operational emissions from buildings, embodied carbon in construction and tenant energy consumption.",
    benefits: [
      "Track energy consumption and emissions across property portfolios",
      "Measure tenant emissions under Scope 3",
      "Support green building certifications and EPC requirements",
      "Report to GRESB and other real estate ESG frameworks",
    ],
  },
  {
    icon: Truck,
    audience: "Supply Chain Businesses",
    problem: "Logistics, distribution and supply chain businesses face increasing pressure from enterprise customers to disclose and reduce their emissions as part of Scope 3 supplier engagement programmes.",
    benefits: [
      "Calculate freight emissions across transport modes",
      "Respond to customer supplier data requests",
      "Manage and report on logistics emissions intensity",
      "Build credibility with enterprise procurement teams",
    ],
  },
  {
    icon: TrendingDown,
    audience: "Sustainability Consultants",
    problem: "Sustainability consultants managing multiple client accounts need a scalable platform to collect data, calculate emissions, produce reports and demonstrate value to each client.",
    benefits: [
      "Manage multiple client organisations from one account",
      "Streamline data collection and emissions calculation",
      "Generate professional client reports in minutes",
      "Scale your practice without multiplying manual effort",
    ],
  },
  {
    icon: BarChart3,
    audience: "ESG Teams",
    problem: "In-house ESG and sustainability teams need reliable tools to collect, verify and report environmental data to leadership, investors and regulators under tight timelines.",
    benefits: [
      "Centralise all ESG data in one auditable environment",
      "Automate emissions calculations with sourced factors",
      "Support CSRD, CDP, ISSB and SECR reporting workflows",
      "Collaborate with internal stakeholders and external auditors",
    ],
  },
];

export default function SolutionsPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <section style={{ background: "linear-gradient(160deg, #0B352B 0%, #174D36 100%)", padding: "5rem 0 4rem" }}>
        <div className="container-cb" style={{ textAlign: "center", maxWidth: "720px" }}>
          <span className="eyebrow">Solutions</span>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3.25rem)", color: "#FFFFFF", marginTop: "0.75rem", marginBottom: "1.25rem", lineHeight: 1.1 }}>
            Built for every type of organisation
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.0625rem", lineHeight: 1.7 }}>
            ClimateBooks adapts to your organisation's size, sector and regulatory context. Explore the solution designed for your team.
          </p>
        </div>
      </section>

      <section style={{ background: "#F7F8F3", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {solutions.map((s, i) => (
              <div key={s.audience} className="card-cb" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "2rem", alignItems: "start" }}>
                <div style={{ width: 52, height: 52, borderRadius: "0.75rem", background: "#E8F2EC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <s.icon size={24} style={{ color: "#174D36" }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.1875rem", color: "#0B352B", marginBottom: "0.625rem" }}>
                    {s.audience}
                  </h2>
                  <p style={{ color: "#5A6B61", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "1rem" }}>{s.problem}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem 1.5rem" }}>
                    {s.benefits.map((b) => (
                      <div key={b} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#174D36", marginTop: "0.45rem", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8375rem", color: "#242B27", lineHeight: 1.5 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="btn-primary"
                  style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  Get Started
                </Link>
                <style>{`@media(max-width:640px){.card-cb{grid-template-columns:1fr !important}}`}</style>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#0B352B", padding: "4.5rem 0" }}>
        <div className="container-cb" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#FFFFFF", marginBottom: "1rem" }}>
            Not sure which solution fits?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "2rem" }}>
            Start a free account and explore the platform. ClimateBooks adapts to your organisation's structure and reporting requirements.
          </p>
          <Link href="/signup" className="btn-gold">
            Start Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
