"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search, Brain, PenTool, Quote, FileText, FileBarChart2,
  Folder, Building2, ArrowRight, CheckCircle2
} from "lucide-react";

const badge = { display: "inline-block", background: "#EEF3FD", color: "#155EEF", fontSize: "0.8125rem", fontWeight: 600, padding: "0.25rem 0.875rem", borderRadius: "100px", marginBottom: "1rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" };

const features = [
  {
    icon: Search,
    title: "Originality Checking",
    desc: "TrueAuthor analyses submitted documents against authorised comparison sources to identify textual similarities. Each matched passage is highlighted with source references, enabling a clear and informed review of the document's originality.",
    points: ["Similarity percentage with passage-level detail", "Side-by-side source comparison", "Exclusion settings for bibliographies, quotes and common phrases", "Match categorisation and source breakdown"],
  },
  {
    icon: Brain,
    title: "AI Writing Insights",
    desc: "The AI Writing Insights module evaluates writing patterns and provides indicators of potentially AI-generated text. Results are presented with appropriate confidence information and clear explanations of analytical limitations.",
    points: ["Writing pattern and style evaluation", "AI writing indicators with confidence context", "Highlighted passages where technically supported", "Transparent disclosure of false positive and false negative risk"],
  },
  {
    icon: PenTool,
    title: "Authorship Analysis",
    desc: "Where authorised writing samples are available for comparison, TrueAuthor analyses writing consistency across vocabulary, sentence structure and linguistic characteristics. Findings are presented as supporting evidence, not definitive identity verification.",
    points: ["Vocabulary and sentence structure analysis", "Style consistency across multiple documents", "Linguistic pattern identification", "Evidence-based presentation of observations"],
  },
  {
    icon: Quote,
    title: "Citation Checker",
    desc: "The Citation Checker helps users review academic references across all major citation formats. It identifies missing references, inconsistent citations and formatting issues without fabricating or verifying inaccessible sources.",
    points: ["APA, MLA, Chicago, Harvard and IEEE support", "Missing and inconsistent citation detection", "Formatting issue identification", "Citation alignment observations"],
  },
  {
    icon: FileText,
    title: "Grammar and Writing Analysis",
    desc: "TrueAuthor provides detailed feedback on grammar, punctuation, sentence clarity, academic tone and readability. Suggestions are constructive and designed to help writers improve without rewriting their original work.",
    points: ["Grammar and punctuation review", "Sentence clarity and structure feedback", "Academic tone and readability assessment", "Repetition and coherence observations"],
  },
  {
    icon: FileBarChart2,
    title: "Originality Reports",
    desc: "Every analysis produces a professional originality report containing document information, similarity findings, source details, AI writing indicators, citation observations and analysis metadata. Reports are exportable as PDF.",
    points: ["Similarity percentage and matched passages", "AI writing indicators where supported", "Citation and grammar observations", "PDF export with report reference number"],
  },
  {
    icon: Folder,
    title: "Document Management",
    desc: "Users can upload, organise and manage documents within a secure personal workspace. Each document tracks its processing status from submission through to completed report.",
    points: ["PDF, DOCX and TXT upload support", "Processing status: Queued, Processing, Completed, Failed", "Secure cloud storage with file validation", "Document organisation and version history"],
  },
  {
    icon: Building2,
    title: "Institutional Management",
    desc: "Institution administrators can create organisations, manage departments and classes, collect assignment submissions and oversee academic integrity across the entire institution from a centralised dashboard.",
    points: ["Department and class creation", "Assignment submission workflows", "Role-based access control", "Aggregate usage and integrity statistics"],
  },
];

const steps = [
  { n: "01", label: "Upload Document", desc: "Submit PDF, DOCX or TXT files securely through the browser or API." },
  { n: "02", label: "Analyse Content", desc: "TrueAuthor extracts text and runs similarity, AI and citation analysis concurrently." },
  { n: "03", label: "Review Similarities", desc: "Examine highlighted passages alongside source references and similarity scores." },
  { n: "04", label: "Examine Writing Insights", desc: "Review AI writing indicators, authorship patterns and grammar observations." },
  { n: "05", label: "Generate Report", desc: "Produce a complete originality report with all findings clearly documented." },
  { n: "06", label: "Improve Originality", desc: "Use feedback, suggestions and the writing assistant to strengthen your work." },
];

export default function PlatformPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* HERO */}
      <section style={{ background: "linear-gradient(150deg, #102A43 0%, #2864DC 100%)", padding: "5rem 0 4rem" }}>
        <div className="container-ta">
          <div style={badge}>The TrueAuthor Platform</div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem,5vw,3.25rem)", color: "#ffffff", lineHeight: 1.1, maxWidth: 700, margin: "0 0 1.25rem", letterSpacing: "-0.02em" }}>
            One Platform. Every Writing Integrity Need.
          </h1>
          <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: 600, margin: "0 0 2rem" }}>
            TrueAuthor integrates originality checking, AI writing analysis, authorship insights, citation review and writing improvement into a single intelligent environment built for academic trust.
          </p>
          <Link href="/signup" className="btn-white" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* WORKFLOW */}
      <section style={{ padding: "4rem 0", background: "#ffffff" }}>
        <div className="container-ta">
          <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.625rem", color: "#102A43", margin: "0 0 2.5rem", textAlign: "center" }}>
            The TrueAuthor Workflow
          </h2>
          <div style={{ display: "flex", overflowX: "auto", gap: "0", paddingBottom: "0.5rem" }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ flex: "1 0 160px", textAlign: "center", padding: "0 1rem", position: "relative" }}>
                {i < steps.length - 1 && (
                  <div style={{ position: "absolute", top: "1.25rem", left: "55%", right: "-45%", height: "2px", background: "#D1DCF0", zIndex: 0 }} />
                )}
                <div style={{ width: 48, height: 48, background: "#155EEF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem", position: "relative", zIndex: 1, color: "white", fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "0.875rem" }}>
                  {s.n}
                </div>
                <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.875rem", color: "#102A43", margin: "0 0 0.375rem" }}>{s.label}</p>
                <p style={{ color: "#64748B", fontSize: "0.8125rem", lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES DETAIL */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container-ta">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={badge}>Platform Capabilities</div>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "clamp(1.75rem,4vw,2.5rem)", color: "#102A43", margin: 0 }}>
              Built for Depth, Designed for Clarity
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {features.map((f, i) => (
              <div key={f.title} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start", direction: i % 2 === 1 ? "rtl" : "ltr" as "ltr" | "rtl" }}>
                <div style={{ direction: "ltr" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ width: 48, height: 48, background: "#EEF3FD", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <f.icon size={24} color="#155EEF" />
                    </div>
                    <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.375rem", color: "#102A43", margin: 0 }}>{f.title}</h3>
                  </div>
                  <p style={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>{f.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {f.points.map((p) => (
                      <li key={p} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", color: "#263449", fontSize: "0.9375rem" }}>
                        <CheckCircle2 size={16} color="#155EEF" style={{ marginTop: "0.15rem", flexShrink: 0 }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ direction: "ltr", background: "#F5F8FC", borderRadius: 12, padding: "2rem", border: "1px solid #D1DCF0", minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
                  <f.icon size={40} color="#D1DCF0" />
                  <p style={{ color: "#94A3B8", fontSize: "0.875rem", textAlign: "center", margin: 0 }}>{f.title} interface</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, #102A43 0%, #155EEF 100%)", padding: "4rem 0" }}>
        <div className="container-ta" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "clamp(1.75rem,4vw,2.25rem)", color: "#ffffff", margin: "0 0 1rem" }}>
            Ready to Experience the Full Platform?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.0625rem", margin: "0 0 2rem", maxWidth: 480, marginInline: "auto" }}>
            Start your free trial and explore every capability TrueAuthor offers.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-white">Start Free Trial</Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none", padding: "0.75rem 1.75rem", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)" }}>View Pricing</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
