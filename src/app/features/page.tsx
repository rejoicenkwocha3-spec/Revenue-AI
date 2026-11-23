import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Leaf, Zap, Factory, BarChart3, FileText, MessageSquare, Target, Users, ShieldCheck, CheckCircle2 } from "lucide-react";

const scope3Categories = [
  "Purchased goods and services",
  "Capital goods",
  "Fuel and energy-related activities",
  "Upstream transportation and distribution",
  "Waste generated in operations",
  "Business travel",
  "Employee commuting",
  "Upstream leased assets",
  "Downstream transportation and distribution",
  "Processing of sold products",
  "Use of sold products",
  "End-of-life treatment of sold products",
  "Downstream leased assets",
  "Franchises",
  "Investments",
];

const reportingFrameworks = [
  { name: "GHG Protocol", desc: "The global standard for corporate greenhouse gas accounting and reporting." },
  { name: "CDP", desc: "Annual climate, water and forest disclosure to investors and cities." },
  { name: "CSRD", desc: "Corporate Sustainability Reporting Directive for EU companies." },
  { name: "ESRS", desc: "European Sustainability Reporting Standards under CSRD." },
  { name: "ISSB", desc: "IFRS Sustainability Disclosure Standards for investor-grade climate reporting." },
  { name: "SECR", desc: "Streamlined Energy and Carbon Reporting for UK companies." },
];

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <section style={{ background: "linear-gradient(160deg, #0B352B 0%, #174D36 100%)", padding: "5rem 0 4rem" }}>
        <div className="container-cb" style={{ textAlign: "center", maxWidth: "720px" }}>
          <span className="eyebrow">Platform Features</span>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3.25rem)", color: "#FFFFFF", marginTop: "0.75rem", marginBottom: "1.25rem", lineHeight: 1.1 }}>
            Every tool your climate programme requires
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.0625rem", lineHeight: 1.7 }}>
            From data collection and emissions calculation to AI-powered insights, decarbonisation planning and regulatory reporting.
          </p>
        </div>
      </section>

      {/* Carbon Footprint Measurement */}
      <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
            <div>
              <span className="eyebrow">Carbon Footprint Measurement</span>
              <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0B352B", marginTop: "0.5rem", marginBottom: "1rem" }}>
                Measure your complete greenhouse gas footprint
              </h2>
              <p style={{ color: "#5A6B61", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                ClimateBooks provides a structured environment to measure greenhouse gas emissions across your operations and value chain. Every calculation uses the formula:
              </p>
              <div style={{ background: "#F7F8F3", border: "1px solid #DDE8E2", borderRadius: "0.75rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", fontFamily: "monospace", fontSize: "0.9rem", color: "#0B352B" }}>
                Emissions = Activity Data × Emission Factor
              </div>
              <p style={{ color: "#5A6B61", lineHeight: 1.7 }}>
                Results are recorded in kilograms or tonnes of CO₂ equivalent (kgCO₂e or tCO₂e) with full transparency over data quality, verification status and calculation methodology.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                "Activity quantity and measurement unit",
                "Emission factor and factor source",
                "Reporting period and calculation methodology",
                "Result in kgCO₂e or tCO₂e",
                "Data quality and verification status",
                "Complete calculation audit trail",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <CheckCircle2 size={16} style={{ color: "#174D36", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.9rem", color: "#242B27" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`@media(max-width:768px){section>div>div{grid-template-columns:1fr !important;gap:2rem !important}}`}</style>
      </section>

      {/* Scope 1 */}
      <section style={{ background: "#F7F8F3", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <span className="badge-scope1" style={{ marginBottom: "1rem", display: "inline-flex" }}>Scope 1</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0B352B", marginBottom: "1rem" }}>
              Direct Emissions
            </h2>
            <p style={{ color: "#5A6B61", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Track direct greenhouse gas emissions from sources owned or controlled by your organisation.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.875rem" }}>
              {["Company vehicles", "Fuel combustion", "Industrial processes", "Refrigerants", "Company equipment", "On-site generation"].map((item) => (
                <div key={item} style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.625rem", padding: "0.875rem 1rem", display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#174D36", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.875rem", color: "#242B27" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scope 2 */}
      <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <span className="badge-scope2" style={{ marginBottom: "1rem", display: "inline-flex" }}>Scope 2</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0B352B", marginBottom: "1rem" }}>
              Indirect Energy Emissions
            </h2>
            <p style={{ color: "#5A6B61", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Track indirect greenhouse gas emissions from the generation of purchased energy consumed by your organisation.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.875rem" }}>
              {["Purchased electricity", "District heating", "District cooling", "Purchased steam", "Renewable energy tracking", "Location-based and market-based"].map((item) => (
                <div key={item} style={{ background: "#FDF5E0", border: "1px solid #F0E0A8", borderRadius: "0.625rem", padding: "0.875rem 1rem", display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8B6B10", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.875rem", color: "#242B27" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scope 3 */}
      <section style={{ background: "#F7F8F3", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <span className="badge-scope3" style={{ marginBottom: "1rem", display: "inline-flex" }}>Scope 3</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0B352B", marginBottom: "1rem" }}>
              Value Chain Emissions
            </h2>
            <p style={{ color: "#5A6B61", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Track all 15 GHG Protocol Scope 3 categories across your upstream and downstream value chain.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.625rem" }}>
              {scope3Categories.map((cat, i) => (
                <div key={cat} style={{ background: "#EAF0F8", border: "1px solid #C5D8F0", borderRadius: "0.625rem", padding: "0.75rem 1rem", display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2A4E8A", width: 20, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: "0.8375rem", color: "#242B27" }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant */}
      <section style={{ background: "#0B352B", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
            <div>
              <span className="eyebrow">AI Climate Assistant</span>
              <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#FFFFFF", marginTop: "0.5rem", marginBottom: "1rem" }}>
                Intelligence grounded in your data
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                ClimateBooks' AI assistant analyses your actual emissions records to answer questions, surface insights and prepare disclosures. It never fabricates data, invents emission factors or claims regulatory compliance without sufficient evidence.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  "What is our total carbon footprint?",
                  "Which activities contribute most to our emissions?",
                  "How have our emissions changed this year?",
                  "What are our biggest Scope 3 emission sources?",
                  "Recommend opportunities to reduce our emissions.",
                  "Generate a sustainability performance summary.",
                ].map((q) => (
                  <div key={q} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                    <MessageSquare size={14} style={{ color: "#D9AD55", flexShrink: 0, marginTop: "0.15rem" }} />
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", fontStyle: "italic" }}>{q}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ background: "#F7F8F3", borderRadius: "1rem", padding: "1.5rem" }}>
                <span className="eyebrow" style={{ marginBottom: "1rem", display: "block" }}>Reporting Frameworks</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {reportingFrameworks.map((f) => (
                    <div key={f.name} style={{ display: "flex", gap: "0.875rem" }}>
                      <div style={{ background: "#174D36", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "0.25rem", height: "fit-content", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {f.name}
                      </div>
                      <span style={{ fontSize: "0.8125rem", color: "#5A6B61", lineHeight: 1.5 }}>{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`@media(max-width:768px){section>div>div{grid-template-columns:1fr !important}}`}</style>
      </section>

      {/* Decarbonisation + Supplier */}
      <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            {[
              {
                icon: Target,
                title: "Decarbonisation Planning",
                desc: "Set net zero targets and science-based reduction goals. Create climate action plans and assign reduction initiatives. Track progress against your baseline year and model reduction scenarios.",
                items: ["Net zero and interim targets", "Science-based target alignment", "Climate action plan builder", "Scenario modelling", "Progress dashboards"],
              },
              {
                icon: Users,
                title: "Supplier Management",
                desc: "Collect and manage supplier sustainability information. Invite suppliers to submit their emissions data, track submission status and review responses as part of your Scope 3 management programme.",
                items: ["Supplier invitation workflows", "Customisable data requests", "Submission tracking", "Response review and verification", "Supplier emissions aggregation"],
              },
            ].map((item) => (
              <div key={item.title} className="card-cb" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "#E8F2EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon size={22} style={{ color: "#174D36" }} />
                </div>
                <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.1875rem", color: "#0B352B" }}>{item.title}</h3>
                <p style={{ color: "#5A6B61", fontSize: "0.875rem", lineHeight: 1.65 }}>{item.desc}</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.4rem", listStyle: "none", padding: 0 }}>
                  {item.items.map((i) => (
                    <li key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <CheckCircle2 size={14} style={{ color: "#174D36", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.845rem", color: "#242B27" }}>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <style>{`@media(max-width:640px){section>div>div{grid-template-columns:1fr !important}}`}</style>
      </section>

      {/* CTA */}
      <section style={{ background: "#F7F8F3", padding: "4.5rem 0" }}>
        <div className="container-cb" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0B352B", marginBottom: "1rem" }}>
            Start measuring your impact today
          </h2>
          <p style={{ color: "#5A6B61", marginBottom: "2rem" }}>
            Create your ClimateBooks account and begin tracking emissions in minutes.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-primary">Get Started <ArrowRight size={16} /></Link>
            <Link href="/pricing" className="btn-ghost">View Pricing</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
