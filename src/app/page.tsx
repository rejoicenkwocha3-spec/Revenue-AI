"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClimateBookLogo from "@/components/ClimateBookLogo";
import {
  BarChart3, Leaf, FileText, Target, Users, ArrowRight,
  TrendingDown, Globe, ShieldCheck, Zap, Building2, Factory,
  CheckCircle2, ChevronRight
} from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          background: "linear-gradient(160deg, #0B352B 0%, #174D36 60%, #1a5c40 100%)",
          padding: "7rem 0 6rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 70% 30%, rgba(217,173,85,0.08) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(139,175,145,0.06) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />
        <div className="container-cb" style={{ position: "relative", textAlign: "center", maxWidth: "860px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.75rem" }}>
            <ClimateBookLogo size={64} />
          </div>
          <span className="eyebrow" style={{ color: "#D9AD55", marginBottom: "1rem", display: "block" }}>
            AI-Powered Climate Accounting
          </span>
          <h1 style={{
            fontFamily: "var(--font-manrope)",
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            color: "#FFFFFF",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "1.5rem",
          }}>
            Climate Intelligence.<br />Measurable Impact.
          </h1>
          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.65,
            maxWidth: "600px",
            margin: "0 auto 2.5rem",
          }}>
            ClimateBooks helps businesses measure their carbon footprint, manage sustainability data and create meaningful climate reports with intelligent AI-powered tools.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-gold" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
              Get Started <ArrowRight size={16} />
            </Link>
            <Link href="/platform" className="btn-outline" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
              Explore Platform
            </Link>
          </div>

          {/* Trust indicators */}
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center", marginTop: "3.5rem", flexWrap: "wrap" }}>
            {[
              { label: "GHG Protocol Aligned" },
              { label: "ISO 14064 Compatible" },
              { label: "CSRD Ready" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.6)", fontSize: "0.8125rem" }}>
                <CheckCircle2 size={14} style={{ color: "#8BAF91" }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section style={{ background: "#F7F8F3", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="eyebrow">The Platform</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "#0B352B", marginTop: "0.5rem" }}>
              Your entire climate programme in one place
            </h2>
          </div>

          {/* Dashboard preview card */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #DDE8E2",
            borderRadius: "1.25rem",
            boxShadow: "0 8px 48px rgba(11,53,43,0.12)",
            overflow: "hidden",
            maxWidth: "960px",
            margin: "0 auto",
          }}>
            {/* Browser chrome */}
            <div style={{ background: "#F0F5F2", borderBottom: "1px solid #DDE8E2", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                {["#FF5F57", "#FFBD2E", "#28CA41"].map((c) => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                ))}
              </div>
              <div style={{ flex: 1, background: "#E8EDE9", borderRadius: "0.3rem", padding: "0.2rem 0.75rem", fontSize: "0.75rem", color: "#5A6B61", maxWidth: "280px", margin: "0 auto" }}>
                app.climatebooks.com/dashboard
              </div>
            </div>

            {/* Dashboard content */}
            <div style={{ display: "flex", minHeight: "360px" }}>
              {/* Sidebar */}
              <div style={{ width: "200px", background: "#0B352B", padding: "1.25rem 0.75rem", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", marginBottom: "1rem" }}>
                  <ClimateBookLogo size={24} />
                  <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem", fontFamily: "var(--font-manrope)" }}>ClimateBooks</span>
                </div>
                {[
                  { icon: BarChart3, label: "Overview", active: true },
                  { icon: Building2, label: "Organisations" },
                  { icon: Leaf, label: "Carbon Footprint" },
                  { icon: Globe, label: "Scope 1" },
                  { icon: Zap, label: "Scope 2" },
                  { icon: Factory, label: "Scope 3" },
                  { icon: FileText, label: "Reports" },
                  { icon: Target, label: "Climate Targets" },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.4rem 0.75rem", borderRadius: "0.375rem",
                    background: item.active ? "rgba(255,255,255,0.12)" : "transparent",
                    marginBottom: "0.125rem",
                    color: item.active ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                    fontSize: "0.75rem", fontWeight: item.active ? 600 : 400,
                  }}>
                    <item.icon size={13} />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ flex: 1, padding: "1.5rem", background: "#F7F8F3" }}>
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B" }}>Emissions Overview</div>
                    <div style={{ fontSize: "0.75rem", color: "#5A6B61" }}>Reporting period: Jan 2026</div>
                  </div>
                  <div style={{ background: "#174D36", color: "#fff", fontSize: "0.7rem", fontWeight: 600, padding: "0.25rem 0.625rem", borderRadius: "0.25rem" }}>
                    Live
                  </div>
                </div>

                {/* Stat row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                  {[
                    { label: "Total Emissions", value: "1,842", unit: "tCO₂e", color: "#174D36" },
                    { label: "Scope 1 & 2", value: "624", unit: "tCO₂e", color: "#D9AD55" },
                    { label: "Scope 3", value: "1,218", unit: "tCO₂e", color: "#2A4E8A" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.5rem", padding: "0.75rem" }}>
                      <div style={{ fontSize: "0.65rem", color: "#5A6B61", marginBottom: "0.25rem" }}>{s.label}</div>
                      <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.1rem", color: s.color }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#5A6B61" }}>{s.unit}</div>
                    </div>
                  ))}
                </div>

                {/* Chart bars */}
                <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.5rem", padding: "0.875rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#5A6B61", marginBottom: "0.75rem", fontWeight: 600 }}>Emissions by Month</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "0.4rem", height: "80px" }}>
                    {[55, 72, 60, 85, 68, 90, 76, 82, 65, 88, 74, 70].map((h, i) => (
                      <div key={i} style={{ flex: 1, background: i === 11 ? "#174D36" : "#8BAF91", borderRadius: "2px 2px 0 0", height: `${h}%`, opacity: 0.85 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THREE PILLARS ── */}
      <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span className="eyebrow">What we do</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "#0B352B", marginTop: "0.5rem" }}>
              The future of climate accounting
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {[
              {
                icon: BarChart3,
                title: "Measurement",
                desc: "Understand your organisation's environmental footprint across Scope 1, 2 and 3 with transparent, auditable calculations grounded in recognised methodologies.",
                color: "#174D36",
                bg: "#E8F2EC",
              },
              {
                icon: Zap,
                title: "Intelligence",
                desc: "Transform complex climate data into meaningful insights. Our AI assistant analyses your data, identifies hotspots and recommends reduction opportunities.",
                color: "#8B6B10",
                bg: "#FDF5E0",
              },
              {
                icon: ShieldCheck,
                title: "Accountability",
                desc: "Track environmental performance and produce reliable sustainability reports aligned with GHG Protocol, CDP, CSRD, ESRS, ISSB and SECR frameworks.",
                color: "#2A4E8A",
                bg: "#EAF0F8",
              },
            ].map((item) => (
              <div key={item.title} className="card-cb" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ width: 48, height: 48, borderRadius: "0.625rem", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon size={22} style={{ color: item.color }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-manrope)", fontSize: "1.125rem", fontWeight: 800, color: "#0B352B", marginBottom: "0.5rem" }}>
                    {item.title}
                  </h3>
                  <p style={{ color: "#5A6B61", fontSize: "0.9rem", lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCOPES SECTION ── */}
      <section style={{ background: "#F7F8F3", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
            <div>
              <span className="eyebrow">Carbon Accounting</span>
              <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: "#0B352B", marginTop: "0.5rem", marginBottom: "1.25rem" }}>
                Understand Scope 1, 2 and 3 emissions
              </h2>
              <p style={{ color: "#5A6B61", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                ClimateBooks provides a structured environment for measuring direct and indirect emissions across your entire value chain. Every calculation is transparent, traceable and aligned with the GHG Protocol.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  { scope: "Scope 1", desc: "Direct emissions from owned sources: vehicles, fuel combustion, industrial processes", badge: "badge-scope1" },
                  { scope: "Scope 2", desc: "Indirect emissions from purchased electricity, heating and cooling", badge: "badge-scope2" },
                  { scope: "Scope 3", desc: "Value chain emissions across 15 categories including supply chain, travel and investments", badge: "badge-scope3" },
                ].map((item) => (
                  <div key={item.scope} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                    <span className={item.badge} style={{ marginTop: "0.1rem", flexShrink: 0 }}>{item.scope}</span>
                    <span style={{ color: "#5A6B61", fontSize: "0.9rem", lineHeight: 1.6 }}>{item.desc}</span>
                  </div>
                ))}
              </div>
              <Link href="/features" className="btn-primary" style={{ marginTop: "2rem", display: "inline-flex" }}>
                Explore Features <ArrowRight size={16} />
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "Scope 1 — Direct", value: 285, pct: 15, color: "#174D36" },
                { label: "Scope 2 — Energy", value: 339, pct: 18, color: "#D9AD55" },
                { label: "Scope 3 — Value chain", value: 1218, pct: 67, color: "#2A4E8A" },
              ].map((item) => (
                <div key={item.label} className="card-cb">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#242B27" }}>{item.label}</span>
                    <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, color: item.color, fontSize: "0.9rem" }}>
                      {item.value.toLocaleString()} tCO₂e
                    </span>
                  </div>
                  <div style={{ background: "#F0F5F2", borderRadius: "999px", height: "6px" }}>
                    <div style={{ width: `${item.pct}%`, height: "100%", borderRadius: "999px", background: item.color }} />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#5A6B61", marginTop: "0.375rem" }}>{item.pct}% of total</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            section > div > div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
              gap: 2rem !important;
            }
          }
        `}</style>
      </section>

      {/* ── AI SECTION ── */}
      <section style={{ background: "#0B352B", padding: "5rem 0" }}>
        <div className="container-cb" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <div>
            <span className="eyebrow">AI Climate Assistant</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: "#FFFFFF", marginTop: "0.5rem", marginBottom: "1.25rem" }}>
              Intelligent sustainability reporting
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Ask ClimateBooks anything about your environmental performance. Our AI assistant analyses your actual data to surface insights, identify reduction opportunities and help prepare climate disclosures.
            </p>
            {[
              "What is our total carbon footprint this year?",
              "Which activities contribute most to our emissions?",
              "Recommend opportunities to reduce our Scope 3 emissions.",
              "Generate a sustainability performance summary.",
            ].map((q) => (
              <div key={q} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                <ChevronRight size={14} style={{ color: "#D9AD55", flexShrink: 0 }} />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", fontStyle: "italic" }}>{q}</span>
              </div>
            ))}
            <Link href="/features" className="btn-gold" style={{ marginTop: "1.5rem", display: "inline-flex" }}>
              Learn More <ArrowRight size={16} />
            </Link>
          </div>
          {/* Chat preview */}
          <div style={{ background: "#0D3D2B", border: "1px solid rgba(139,175,145,0.2)", borderRadius: "1rem", padding: "1.5rem" }}>
            <div style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(139,175,145,0.15)" }}>
              <span style={{ color: "#8BAF91", fontSize: "0.75rem", fontWeight: 600 }}>AI Climate Assistant</span>
            </div>
            {[
              { from: "user", msg: "What are our highest emitting operations this quarter?" },
              { from: "ai", msg: "Based on your activity data, your top emission sources are: (1) Natural gas combustion in your London facility — 142 tCO₂e, (2) Business air travel — 89 tCO₂e, and (3) Purchased electricity — 76 tCO₂e. These three categories account for 68% of your total Scope 1 and 2 emissions. I recommend reviewing your energy procurement strategy as an immediate priority." },
            ].map((m, i) => (
              <div key={i} style={{ marginBottom: "0.875rem", display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  background: m.from === "user" ? "#174D36" : "rgba(255,255,255,0.08)",
                  color: m.from === "user" ? "#FFFFFF" : "rgba(255,255,255,0.8)",
                  borderRadius: m.from === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                  padding: "0.75rem 1rem",
                  fontSize: "0.8125rem",
                  lineHeight: 1.6,
                  maxWidth: "85%",
                }}>
                  {m.msg}
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 768px) {
            section[style*="#0B352B"] > div { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span className="eyebrow">Platform Features</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "#0B352B", marginTop: "0.5rem" }}>
              Everything your climate programme needs
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {[
              { icon: BarChart3, title: "Emissions Analytics", desc: "Visualise emissions by scope, location, department and category with professional charts." },
              { icon: FileText, title: "Sustainability Reporting", desc: "Generate structured reports for GHG Protocol, CDP, CSRD, ESRS, ISSB and SECR." },
              { icon: Target, title: "Decarbonisation Planning", desc: "Set net zero targets, create climate action plans and monitor reduction progress." },
              { icon: Users, title: "Supplier Engagement", desc: "Collect supplier sustainability data with invitation, submission and review workflows." },
              { icon: TrendingDown, title: "Carbon Reduction", desc: "Model reduction scenarios and compare current performance against your baseline year." },
              { icon: ShieldCheck, title: "Audit and Assurance", desc: "Every calculation is transparent, traceable and maintains a complete audit trail." },
            ].map((f) => (
              <div key={f.title} style={{
                padding: "1.5rem",
                border: "1px solid #DDE8E2",
                borderRadius: "0.875rem",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#8BAF91";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(23,77,54,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#DDE8E2";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div style={{ width: 36, height: 36, background: "#E8F2EC", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.875rem" }}>
                  <f.icon size={18} style={{ color: "#174D36" }} />
                </div>
                <h4 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#0B352B", marginBottom: "0.4rem" }}>
                  {f.title}
                </h4>
                <p style={{ color: "#5A6B61", fontSize: "0.85rem", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section style={{ background: "#F7F8F3", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span className="eyebrow">Industry Solutions</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "#0B352B", marginTop: "0.5rem" }}>
              Built for every type of organisation
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              "Small and Medium Businesses",
              "Large Enterprises",
              "Financial Institutions",
              "Manufacturing Companies",
              "Real Estate and Property",
              "Supply Chain Businesses",
              "Sustainability Consultants",
              "ESG Teams",
            ].map((s) => (
              <div key={s} style={{
                background: "#FFFFFF",
                border: "1px solid #DDE8E2",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#174D36", flexShrink: 0 }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#242B27" }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href="/solutions" className="btn-ghost">
              View All Solutions <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
        <div className="container-cb">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span className="eyebrow">Pricing</span>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "#0B352B", marginTop: "0.5rem" }}>
              Transparent pricing for every stage
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
            {[
              { name: "Starter", href: "https://selar.com/47plan?currency=USD", badge: null },
              { name: "Professional", href: "https://selar.com/57plan?currency=USD", badge: "Most Popular" },
              { name: "Enterprise", href: "https://selar.com/97plan?currency=USD", badge: null },
            ].map((p) => (
              <div key={p.name} style={{
                background: p.badge ? "#0B352B" : "#FFFFFF",
                border: `1.5px solid ${p.badge ? "#174D36" : "#DDE8E2"}`,
                borderRadius: "1rem",
                padding: "2rem 1.5rem",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}>
                {p.badge && (
                  <div style={{
                    position: "absolute", top: "-0.75rem", left: "50%", transform: "translateX(-50%)",
                    background: "#D9AD55", color: "#0B352B", fontSize: "0.7rem", fontWeight: 700,
                    padding: "0.2rem 0.75rem", borderRadius: "999px",
                  }}>
                    {p.badge}
                  </div>
                )}
                <div>
                  <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: p.badge ? "#FFFFFF" : "#0B352B" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: p.badge ? "rgba(255,255,255,0.5)" : "#5A6B61", marginTop: "0.25rem" }}>
                    See full details on checkout
                  </div>
                </div>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={p.badge ? "btn-gold" : "btn-ghost"}
                  style={{ width: "100%", textAlign: "center", justifyContent: "center" }}
                >
                  Get {p.name}
                </a>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link href="/pricing" style={{ color: "#174D36", fontSize: "0.875rem", fontWeight: 500, textDecoration: "underline" }}>
              View detailed pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: "linear-gradient(135deg, #0B352B 0%, #174D36 100%)", padding: "5rem 0" }}>
        <div className="container-cb" style={{ textAlign: "center" }}>
          <ClimateBookLogo size={52} />
          <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(1.75rem, 3vw, 2.75rem)", color: "#FFFFFF", marginTop: "1.5rem", marginBottom: "1rem" }}>
            Measure Impact. Manage Carbon.<br />Build a Better Future.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1.0625rem", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
            Join organisations using ClimateBooks to understand and reduce their environmental impact.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-gold" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
              Start Free Today <ArrowRight size={16} />
            </Link>
            <Link href="/platform" className="btn-outline" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
