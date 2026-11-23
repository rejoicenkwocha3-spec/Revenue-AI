"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Brain, PenTool, Quote, FileText, FileBarChart2, ArrowRight, AlertCircle, Info } from "lucide-react";

const badge = { display: "inline-block", background: "#EEF3FD", color: "#155EEF", fontSize: "0.8125rem", fontWeight: 600, padding: "0.25rem 0.875rem", borderRadius: "100px", marginBottom: "1rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" };

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#FFF7F5", border: "1px solid #FFD6CF", borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1.5rem" }}>
      <Info size={18} color="#FF654F" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
      <p style={{ color: "#7C3A30", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  );
}

function FeatureSection({ id, icon: Icon, title, desc, points, notice, sources }: {
  id: string; icon: React.ElementType; title: string; desc: string;
  points: string[]; notice?: string; sources?: string[];
}) {
  return (
    <section id={id} style={{ padding: "5rem 0", borderBottom: "1px solid #D1DCF0" }}>
      <div className="container-ta">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ width: 52, height: 52, background: "#EEF3FD", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color="#155EEF" />
          </div>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "clamp(1.5rem,3.5vw,2rem)", color: "#102A43", margin: 0 }}>{title}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" }}>
          <div>
            <p style={{ color: "#64748B", fontSize: "1.0625rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>{desc}</p>
            {notice && <Notice>{notice}</Notice>}
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {points.map((p) => (
                <li key={p} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", color: "#263449", fontSize: "0.9375rem", lineHeight: 1.5 }}>
                  <span style={{ color: "#155EEF", fontWeight: 800, flexShrink: 0 }}>+</span>
                  {p}
                </li>
              ))}
            </ul>
            {sources && (
              <div>
                <p style={{ color: "#102A43", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>Comparison sources include:</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {sources.map((s) => (
                    <li key={s} style={{ color: "#64748B", fontSize: "0.875rem", display: "flex", gap: "0.5rem" }}>
                      <span style={{ color: "#D1DCF0" }}>—</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div style={{ background: "#F5F8FC", borderRadius: 12, padding: "2rem", border: "1px solid #D1DCF0", minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
            <Icon size={48} color="#D1DCF0" />
            <p style={{ color: "#94A3B8", fontSize: "0.875rem", textAlign: "center", maxWidth: 200, margin: 0 }}>
              {title} analysis interface
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <section style={{ background: "linear-gradient(150deg, #102A43 0%, #2864DC 100%)", padding: "5rem 0 4rem" }}>
        <div className="container-ta">
          <div style={badge}>Features</div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem,5vw,3.25rem)", color: "#ffffff", lineHeight: 1.1, maxWidth: 700, margin: "0 0 1.25rem", letterSpacing: "-0.02em" }}>
            Every Feature for Writing Integrity
          </h1>
          <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: 600, margin: "0 0 2rem" }}>
            From similarity checking to grammar analysis, TrueAuthor provides a complete toolkit for evaluating, understanding and improving written work.
          </p>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {["Similarity Checking", "AI Writing Insights", "Authorship Analysis", "Citation Checker", "Grammar Analysis", "Originality Reports"].map((f) => (
              <span key={f} style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontSize: "0.875rem", fontWeight: 500, padding: "0.375rem 1rem", borderRadius: 100, border: "1px solid rgba(255,255,255,0.2)" }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      <FeatureSection
        id="similarity"
        icon={Search}
        title="Plagiarism and Similarity Checking"
        desc="TrueAuthor analyses uploaded documents and identifies textual similarities against available comparison sources. Each matched passage is highlighted with source references, enabling a clear and informed review of the document's originality."
        notice="Similarity matching identifies text that resembles other sources. A similarity match is not a confirmed plagiarism finding. TrueAuthor does not access Turnitin's proprietary student paper database or subscription publisher databases. Only authorised comparison sources are used."
        sources={[
          "Previously submitted documents within authorised institutional repositories",
          "User-uploaded reference documents",
          "Legally accessible publicly available web content",
          "Licensed academic content where available through authorised partnerships",
        ]}
        points={[
          "Overall similarity percentage with passage-level detail",
          "Highlighted matched text with source references",
          "Side-by-side source comparison view",
          "Match categorisation: internet, repository, user-uploaded",
          "Exclusion settings: bibliographies, quoted text, common phrases and selected sources",
          "Downloadable similarity reports",
          "Explanation of how the similarity percentage is calculated",
        ]}
      />

      <FeatureSection
        id="ai-writing"
        icon={Brain}
        title="AI Writing Insights"
        desc="The AI Writing Insights module evaluates writing patterns and provides indicators of potentially AI-generated text. Results are presented with appropriate confidence information and clear explanations of the analytical method and its limitations."
        notice="AI writing detection is probabilistic. TrueAuthor never presents an AI detection score as definitive proof that a writer used AI. False positives and false negatives are possible. No finding from this module alone should be used to accuse a student of misconduct. Results are contextual evidence only."
        points={[
          "Writing pattern and style evaluation across the full document",
          "AI writing indicators with confidence context",
          "Text classification with passage-level highlighting where supported",
          "Explanation of detection methodology and inherent limitations",
          "Transparent disclosure of false positive and false negative risk",
          "Guidance on interpreting findings appropriately",
        ]}
      />

      <FeatureSection
        id="authorship"
        icon={PenTool}
        title="Authorship Analysis"
        desc="Where authorised writing samples are available for comparison, TrueAuthor analyses writing consistency across vocabulary, sentence structure and linguistic characteristics. The system looks for patterns that may indicate changes in writing style across a body of work."
        notice="Authorship analysis requires authorised prior writing samples. Findings are presented as supporting evidence, not definitive identity verification. TrueAuthor does not confirm authorship or provide certainty about who wrote a document."
        points={[
          "Vocabulary and lexical pattern analysis",
          "Sentence length, structure and complexity evaluation",
          "Stylistic consistency measurement across documents",
          "Linguistic characteristic identification",
          "Change detection across multiple submissions",
          "Evidence-based presentation of observations",
        ]}
      />

      <FeatureSection
        id="citations"
        icon={Quote}
        title="Citation Checker"
        desc="The Citation Checker helps users review academic references and identify formatting issues, missing citations and inconsistencies. It supports all major academic citation styles and provides actionable observations to help writers improve their referencing."
        notice="TrueAuthor does not independently verify whether a cited source is accessible or accurate. The citation checker identifies structural and formatting issues. It never invents sources or claims to have verified an inaccessible reference."
        points={[
          "Support for APA, MLA, Chicago, Harvard and IEEE citation styles",
          "Missing reference detection: in-text citations without bibliography entries",
          "Inconsistent citation format identification",
          "Incorrect formatting observations and suggestions",
          "Potential citation mismatch flagging",
          "Style-specific guidance for correction",
        ]}
      />

      <FeatureSection
        id="grammar"
        icon={FileText}
        title="Grammar and Writing Analysis"
        desc="TrueAuthor provides detailed feedback on grammar, punctuation, sentence clarity, academic tone and readability. Suggestions are constructive and designed to help writers improve their work rather than rewriting their original content."
        points={[
          "Grammar and punctuation error detection",
          "Sentence clarity and structural feedback",
          "Academic tone and register assessment",
          "Readability analysis with improvement suggestions",
          "Repetition and redundancy identification",
          "Sentence variety and coherence observations",
          "Passive voice and hedging language review",
        ]}
      />

      <FeatureSection
        id="reports"
        icon={FileBarChart2}
        title="Originality Reports"
        desc="Every analysis produces a comprehensive originality report documenting all findings clearly. Reports include document metadata, similarity findings, AI writing indicators, citation observations and analysis timestamps. All reports are exportable as PDF."
        points={[
          "Document information: title, author, submission date and word count",
          "Overall similarity percentage with matched passage breakdown",
          "Source references for all identified matches",
          "AI writing indicators where analysis is supported",
          "Citation observations and formatting notes",
          "Grammar and writing analysis summary",
          "Analysis date and unique report reference number",
          "PDF export with professional report formatting",
          "Secure sharing with authorised reviewers",
        ]}
      />

      <section style={{ background: "linear-gradient(135deg, #102A43 0%, #155EEF 100%)", padding: "4rem 0" }}>
        <div className="container-ta" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "clamp(1.75rem,4vw,2.25rem)", color: "#ffffff", margin: "0 0 1rem" }}>
            Experience Every Feature
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.0625rem", margin: "0 0 2rem", maxWidth: 480, marginInline: "auto" }}>
            Start your free account and run your first originality analysis in minutes.
          </p>
          <Link href="/signup" className="btn-white">Get Started Free <ArrowRight size={16} /></Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
