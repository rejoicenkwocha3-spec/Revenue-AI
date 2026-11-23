"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrueAuthorLogo from "@/components/TrueAuthorLogo";
import {
  FileText, ShieldCheck, Brain, Search, Quote, PenTool,
  BookOpen, Building2, ArrowRight, CheckCircle2, ChevronRight,
  BarChart2, Layers, Users, Upload, Scan, FileBarChart2
} from "lucide-react";

const S = {
  section: { padding: "5rem 0" } as React.CSSProperties,
  sectionAlt: { padding: "5rem 0", background: "#ffffff" } as React.CSSProperties,
  h2: { fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "clamp(2rem,4vw,2.75rem)", color: "#102A43", margin: "0 0 1rem", lineHeight: 1.15 } as React.CSSProperties,
  lead: { fontSize: "1.125rem", color: "#64748B", lineHeight: 1.7, margin: "0 0 2.5rem" } as React.CSSProperties,
  badge: { display: "inline-block", background: "#EEF3FD", color: "#155EEF", fontSize: "0.8125rem", fontWeight: 600, padding: "0.25rem 0.875rem", borderRadius: "100px", marginBottom: "1rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
};

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="card-ta" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div style={{ width: 44, height: 44, background: "#EEF3FD", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} color="#155EEF" />
      </div>
      <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.0625rem", color: "#102A43", margin: 0 }}>{title}</h3>
      <p style={{ color: "#64748B", fontSize: "0.9375rem", lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 48, height: 48, background: "#155EEF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "white", fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem" }}>
        {num}
      </div>
      <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#102A43", margin: "0 0 0.5rem" }}>{title}</h3>
      <p style={{ color: "#64748B", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* HERO */}
      <section style={{ background: "linear-gradient(150deg, #102A43 0%, #155EEF 100%)", padding: "7rem 0 6rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 75% 25%, rgba(255,101,79,0.12) 0%, transparent 55%), radial-gradient(circle at 15% 75%, rgba(255,255,255,0.04) 0%, transparent 50%)" }} />
        <div className="container-ta" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ ...S.badge, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)" }}>
              Academic Integrity Platform
            </div>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2.25rem,5vw,3.75rem)", color: "#ffffff", lineHeight: 1.1, margin: "0 0 1.5rem", letterSpacing: "-0.02em" }}>
              Every Word Matters.<br />Every Original Idea<br />Deserves Recognition.
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.25rem)", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: 600, margin: "0 0 2.5rem" }}>
              TrueAuthor helps students, educators and institutions evaluate writing originality, understand text similarity and improve academic integrity with intelligent writing analysis.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/signup" className="btn-white">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link href="/platform" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none", padding: "0.75rem 1.75rem", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)", transition: "background 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Explore Platform
              </Link>
            </div>
          </div>
        </div>

        {/* Product demo card */}
        <div className="container-ta" style={{ marginTop: "4rem", position: "relative", zIndex: 1 }}>
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "2rem", maxWidth: 700 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF654F" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFD44F" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4FFF8F" }} />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem", marginLeft: "0.5rem" }}>TrueAuthor Analysis Engine</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "1rem" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Similarity Score</p>
                <p style={{ color: "#ffffff", fontSize: "2rem", fontFamily: "var(--font-manrope)", fontWeight: 800, margin: 0 }}>14<span style={{ fontSize: "1.25rem" }}>%</span></p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>Low similarity detected</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "1rem" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Writing Indicators</p>
                <p style={{ color: "#ffffff", fontSize: "2rem", fontFamily: "var(--font-manrope)", fontWeight: 800, margin: 0 }}>Low</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>Primarily human writing</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "1rem" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Citations Checked</p>
                <p style={{ color: "#ffffff", fontSize: "2rem", fontFamily: "var(--font-manrope)", fontWeight: 800, margin: 0 }}>23</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>2 require attention</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "1rem" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Report Status</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.375rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4FFF8F" }} />
                  <p style={{ color: "#ffffff", fontSize: "1rem", fontFamily: "var(--font-manrope)", fontWeight: 700, margin: 0 }}>Complete</p>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>Ready to export</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{ background: "#ffffff", padding: "2rem 0", borderBottom: "1px solid #D1DCF0" }}>
        <div className="container-ta" style={{ textAlign: "center" }}>
          <p style={{ color: "#64748B", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 1.5rem" }}>
            Trusted by academic institutions worldwide
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "3rem", flexWrap: "wrap", alignItems: "center" }}>
            {["Universities", "Colleges", "Research Institutions", "Publishers", "Corporate Organisations"].map((name) => (
              <span key={name} style={{ color: "#102A43", fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", opacity: 0.65 }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section style={S.section}>
        <div className="container-ta">
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 3.5rem" }}>
            <div style={S.badge}>What TrueAuthor Does</div>
            <h2 style={S.h2}>One Platform for Writing Integrity</h2>
            <p style={{ ...S.lead, margin: 0 }}>
              TrueAuthor brings together the essential tools educators and students need to understand originality, improve writing quality and uphold academic standards.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.5rem" }}>
            <FeatureCard icon={Search} title="Originality Checking" desc="Analyse documents against authorised sources to understand text similarity and identify matching passages with clear source references." />
            <FeatureCard icon={Brain} title="AI Writing Insights" desc="Evaluate writing patterns and identify indicators of potentially AI-generated text with appropriate confidence information and explanations of analytical limitations." />
            <FeatureCard icon={PenTool} title="Authorship Analysis" desc="Where authorised writing samples are available, analyse writing consistency across vocabulary, sentence structure and linguistic characteristics." />
            <FeatureCard icon={Quote} title="Citation Checker" desc="Review academic references across APA, MLA, Chicago, Harvard and IEEE formats. Identify missing references, inconsistent citations and formatting issues." />
            <FeatureCard icon={FileText} title="Grammar Analysis" desc="Provide feedback on grammar, punctuation, sentence clarity, academic tone and readability with constructive suggestions." />
            <FeatureCard icon={FileBarChart2} title="Originality Reports" desc="Generate professional reports with similarity percentages, matched passages, source information and AI writing indicators. Export to PDF." />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={S.sectionAlt}>
        <div className="container-ta">
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 3.5rem" }}>
            <div style={S.badge}>The Process</div>
            <h2 style={S.h2}>How TrueAuthor Works</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "2rem 1.5rem", maxWidth: 900, margin: "0 auto" }}>
            <StepCard num="1" title="Upload Document" desc="Submit PDF, DOCX or TXT files securely through the platform." />
            <StepCard num="2" title="Analyse Content" desc="TrueAuthor extracts text and runs comprehensive analysis across all dimensions." />
            <StepCard num="3" title="Review Similarities" desc="Examine matched passages side by side with source references clearly indicated." />
            <StepCard num="4" title="Examine Insights" desc="Review AI writing indicators, authorship patterns and citation observations." />
            <StepCard num="5" title="Generate Report" desc="Produce a professional originality report with all findings clearly documented." />
            <StepCard num="6" title="Improve Originality" desc="Use feedback and writing assistance tools to strengthen your work." />
          </div>
        </div>
      </section>

      {/* AUDIENCE SOLUTIONS */}
      <section style={S.section}>
        <div className="container-ta">
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 3.5rem" }}>
            <div style={S.badge}>Solutions</div>
            <h2 style={S.h2}>Built for Every Academic Role</h2>
            <p style={{ ...S.lead, margin: 0 }}>Whether you are a student submitting coursework, a lecturer reviewing assignments or an institution managing academic integrity, TrueAuthor serves your specific needs.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1.5rem" }}>
            {[
              { icon: BookOpen, title: "Students", desc: "Understand your similarity score before submission, improve your citations and get writing feedback that helps you learn." },
              { icon: Users, title: "Lecturers", desc: "Review student submissions, access comprehensive originality reports and manage assignment integrity with confidence." },
              { icon: Building2, title: "Universities", desc: "Implement institution-wide academic integrity workflows with centralised management, role-based access and aggregate reporting." },
              { icon: Layers, title: "Researchers", desc: "Ensure manuscript originality, verify citation accuracy and maintain the highest standards of academic publishing integrity." },
            ].map((item) => (
              <div key={item.title} className="card-ta" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <div style={{ width: 44, height: 44, background: "#EEF3FD", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon size={22} color="#155EEF" />
                </div>
                <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.0625rem", color: "#102A43", margin: 0 }}>{item.title}</h3>
                <p style={{ color: "#64748B", fontSize: "0.9375rem", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                <Link href="/solutions" style={{ color: "#155EEF", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  Learn more <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTITUTIONAL FEATURES */}
      <section style={{ ...S.sectionAlt }}>
        <div className="container-ta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <div>
            <div style={S.badge}>Institutional Management</div>
            <h2 style={S.h2}>Designed for Institutions at Scale</h2>
            <p style={{ color: "#64748B", fontSize: "1.0625rem", lineHeight: 1.7, marginBottom: "2rem" }}>
              TrueAuthor provides administrators with the tools to create departments, manage classes, collect submissions and oversee academic integrity across the entire institution from one centralised dashboard.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                "Role-based access: Owner, Administrator, Lecturer, Student, Researcher",
                "Department and class management with assignment workflows",
                "Aggregate usage statistics and institutional reporting",
                "Secure document isolation and row-level data protection",
              ].map((item) => (
                <li key={item} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", color: "#263449", fontSize: "0.9375rem", lineHeight: 1.5 }}>
                  <CheckCircle2 size={18} color="#155EEF" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/solutions" className="btn-primary">Explore Institutional Features <ArrowRight size={16} /></Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Documents Analysed", value: "2.4M+" },
              { label: "Institutions Served", value: "340+" },
              { label: "Reports Generated", value: "1.8M+" },
              { label: "Accuracy Rate", value: "99.2%" },
            ].map((stat) => (
              <div key={stat.label} className="card-ta" style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
                <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.75rem", color: "#155EEF", margin: "0 0 0.25rem" }}>{stat.value}</p>
                <p style={{ color: "#64748B", fontSize: "0.875rem", margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section style={S.section}>
        <div className="container-ta" style={{ textAlign: "center" }}>
          <div style={S.badge}>Pricing</div>
          <h2 style={S.h2}>Simple, Transparent Pricing</h2>
          <p style={{ ...S.lead, maxWidth: 500, margin: "0 auto 2.5rem" }}>Choose the plan that fits your needs. All plans include core originality checking and report generation.</p>
          <Link href="/pricing" className="btn-primary">View All Plans <ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: "linear-gradient(135deg, #102A43 0%, #155EEF 100%)", padding: "5rem 0" }}>
        <div className="container-ta" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <TrueAuthorLogo size={48} variant="white" />
          </div>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "clamp(1.75rem,4vw,2.5rem)", color: "#ffffff", margin: "0 0 1rem" }}>
            Original Work. Authentic Thinking. Trusted Results.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.125rem", margin: "0 0 2.5rem", maxWidth: 500, marginInline: "auto" }}>
            Join thousands of students, educators and institutions who rely on TrueAuthor for academic integrity.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-white">Start Free Today</Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none", padding: "0.75rem 1.75rem", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)" }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
