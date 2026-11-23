import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BarChart3, Leaf, FileText, Target, Users, ArrowRight,
  Database, Zap, Globe, Factory, ShieldCheck, TrendingDown, CheckCircle2
} from "lucide-react";

export default function PlatformPage() {
  const capabilities = [
    {
      icon: Leaf,
      title: "Carbon Accounting",
      desc: "A structured carbon accounting engine built on the GHG Protocol. Enter activity data for electricity, fuel, travel, waste and purchased goods. ClimateBooks calculates emissions using sourced emission factors and maintains a complete audit trail for every figure.",
      color: "#174D36",
      bg: "#E8F2EC",
    },
    {
      icon: Globe,
      title: "Emissions Measurement",
      desc: "Measure Scope 1, 2 and 3 emissions across your operations and value chain. Categorise by location, department and activity type. Track data quality and verification status for every record.",
      color: "#2A4E8A",
      bg: "#EAF0F8",
    },
    {
      icon: Database,
      title: "Climate Data Management",
      desc: "Centralise all your sustainability data in one secure environment. Manage emission factors, activity records, reporting periods and organisational boundaries. Upload custom emission factors and maintain factor version history.",
      color: "#174D36",
      bg: "#E8F2EC",
    },
    {
      icon: FileText,
      title: "Sustainability Reporting",
      desc: "Generate structured reports aligned with GHG Protocol, CDP, CSRD, ESRS, ISSB and SECR. Export to PDF and CSV. Create report history and track disclosure status across multiple reporting periods.",
      color: "#8B6B10",
      bg: "#FDF5E0",
    },
    {
      icon: Zap,
      title: "AI Climate Intelligence",
      desc: "An AI assistant grounded in your actual data. Ask questions about your carbon footprint, identify emission hotspots, understand Scope 3 categories and prepare climate disclosures. The assistant never invents data or fabricates compliance status.",
      color: "#174D36",
      bg: "#E8F2EC",
    },
    {
      icon: BarChart3,
      title: "Emissions Analytics",
      desc: "Visualise emissions across scope, location, department, supplier and category. Track year-over-year changes, monitor reduction progress and compare performance against baseline years.",
      color: "#2A4E8A",
      bg: "#EAF0F8",
    },
    {
      icon: TrendingDown,
      title: "Decarbonisation Management",
      desc: "Set net zero targets and science-based reduction goals. Create climate action plans, model reduction scenarios and track initiative progress. Charts show your trajectory against targets.",
      color: "#174D36",
      bg: "#E8F2EC",
    },
    {
      icon: Users,
      title: "Supplier Engagement",
      desc: "Invite suppliers to submit their sustainability data. Manage submission requests, track responses and review supplier emissions. Build a comprehensive picture of your Scope 3 supply chain.",
      color: "#8B6B10",
      bg: "#FDF5E0",
    },
    {
      icon: ShieldCheck,
      title: "Climate Risk Management",
      desc: "Track physical and transition climate risks in a structured environment. Distinguish between measured data, estimates and modelled assumptions at every stage.",
      color: "#2A4E8A",
      bg: "#EAF0F8",
    },
    {
      icon: CheckCircle2,
      title: "Audit and Assurance",
      desc: "Every calculation is transparent, traceable and auditable. ClimateBooks records the methodology, emission factor, source, unit conversion and data quality indicator for each record.",
      color: "#174D36",
      bg: "#E8F2EC",
    },
  ];

  const workflow = [
    { step: "01", label: "Collect Data", desc: "Enter activity data from operations, energy, travel, waste and supply chain" },
    { step: "02", label: "Calculate Emissions", desc: "Apply sourced emission factors to generate tCO₂e figures" },
    { step: "03", label: "Analyse Impact", desc: "Visualise emissions by scope, source, location and department" },
    { step: "04", label: "Generate Reports", desc: "Produce structured disclosures aligned with recognised frameworks" },
    { step: "05", label: "Plan Reductions", desc: "Set targets, create climate action plans and model scenarios" },
    { step: "06", label: "Monitor Progress", desc: "Track performance against baseline and report on reduction initiatives" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: "linear-gradient(160deg, #0B352B 0%, #174D36 100%)", padding: "5rem 0 4rem" }}>
        <div className="container-cb" style={{ textAlign: "center", maxWidth: "760px" }}>
          <span className="eyebrow">The ClimateBooks Platform</span>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3.25rem)", color: "#FFFFFF", marginTop: "0.75rem", marginBottom: "1.25rem", lineHeight: 1.1 }}>
            Your complete climate accounting environment
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.0625rem", lineHeight: 1.7 }}>
            ClimateBooks provides the tools, data infrastructure and AI intelligence your organisation needs to measure, manage and reduce its environmental impact.
          </p>
        </div>
      </section>

      {/* Workflow */}
      <section style={{ background: "#F7F8F3", padding: "4.5rem 0" }}>
        <div className="container-cb">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="eyebrow">How it works</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0B352B", marginTop: "0.5rem" }}>
              From raw data to climate action
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {workflow.map((w, i) => (
              <div key={w.step} style={{ textAlign: "center", position: "relative" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "#174D36",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 0.875rem",
                  fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "0.875rem", color: "#D9AD55",
                }}>
                  {w.step}
                </div>
                {i < workflow.length - 1 && (
                  <div style={{
                    position: "absolute", top: 24, left: "calc(50% + 28px)", width: "calc(100% - 56px)",
                    height: 2, background: "#DDE8E2", zIndex: 0,
                  }} />
                )}
                <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#0B352B", marginBottom: "0.4rem" }}>
                  {w.label}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#5A6B61", lineHeight: 1.5 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span className="eyebrow">Platform Capabilities</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0B352B", marginTop: "0.5rem" }}>
              Built for the full climate accounting lifecycle
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {capabilities.map((c) => (
              <div key={c.title} className="card-cb" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: "0.625rem", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <c.icon size={20} style={{ color: c.color }} />
                </div>
                <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B" }}>{c.title}</h3>
                <p style={{ color: "#5A6B61", fontSize: "0.875rem", lineHeight: 1.65 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0B352B", padding: "4.5rem 0" }}>
        <div className="container-cb" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#FFFFFF", marginBottom: "1rem" }}>
            Ready to begin your climate programme?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "2rem" }}>
            Start measuring your organisation's environmental footprint today.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-gold">Get Started <ArrowRight size={16} /></Link>
            <Link href="/pricing" className="btn-outline">View Pricing</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
