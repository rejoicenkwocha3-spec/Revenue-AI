"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, BookOpen, Users, Building2, Layers, GraduationCap, FileSearch, Briefcase, FlaskConical, Printer } from "lucide-react";

const badge = { display: "inline-block", background: "#EEF3FD", color: "#155EEF", fontSize: "0.8125rem", fontWeight: 600, padding: "0.25rem 0.875rem", borderRadius: "100px", marginBottom: "1rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" };

const solutions = [
  {
    icon: Building2,
    audience: "Universities",
    headline: "Institution-Wide Academic Integrity at Scale",
    challenge: "Universities face the challenge of managing academic integrity consistently across multiple faculties, departments and thousands of students. Manual review processes are slow, inconsistent and difficult to audit.",
    benefits: [
      "Centralised submission and review workflows for all departments",
      "Role-based access for administrators, lecturers and students",
      "Aggregate reporting and usage statistics across the institution",
      "Secure document isolation with row-level data protection",
      "Assignment management with configurable integrity policies",
    ],
  },
  {
    icon: GraduationCap,
    audience: "Colleges",
    headline: "Professional Academic Standards for College Programmes",
    challenge: "Colleges need robust academic integrity tools that work for professional and vocational programmes without the overhead of enterprise systems.",
    benefits: [
      "Straightforward submission and analysis workflows",
      "Similarity reports tailored to assignment context",
      "Citation support for professional academic writing",
      "AI writing insights for assessed coursework",
      "Department-level management and reporting",
    ],
  },
  {
    icon: BookOpen,
    audience: "Secondary Schools",
    headline: "Building Good Academic Habits from the Start",
    challenge: "Secondary schools need to teach responsible academic writing practices and help students understand the difference between research, citation and copying before they enter higher education.",
    benefits: [
      "Student-friendly originality reports with clear explanations",
      "Writing feedback focused on improvement and learning",
      "Citation checker supporting APA, MLA and Chicago styles",
      "Grammar and clarity analysis appropriate for secondary level",
      "Teacher oversight with class-level submission management",
    ],
  },
  {
    icon: BookOpen,
    audience: "Students",
    headline: "Understand Your Work Before You Submit",
    challenge: "Students want to submit confident, well-cited, original work. Without visibility into similarity and citation issues before submission, they risk unintentional academic integrity breaches.",
    benefits: [
      "Pre-submission originality checking with actionable results",
      "Citation checker to review and correct references",
      "Grammar and writing feedback for academic improvement",
      "AI writing insights with transparent explanations",
      "Downloadable originality reports for personal records",
    ],
  },
  {
    icon: Users,
    audience: "Lecturers",
    headline: "Faster, Fairer Assignment Review",
    challenge: "Lecturers reviewing large volumes of student submissions need reliable, consistent originality analysis without spending hours on manual checks.",
    benefits: [
      "Batch submission review with prioritised similarity flags",
      "Side-by-side source comparison for matched passages",
      "Complete originality reports exportable as PDF",
      "AI writing indicator review with appropriate context",
      "Class-level submission management and status tracking",
    ],
  },
  {
    icon: Layers,
    audience: "Academic Researchers",
    headline: "Publication-Ready Manuscript Integrity",
    challenge: "Researchers preparing manuscripts for publication need to verify originality, check citation accuracy and ensure their work meets the standards expected by academic journals.",
    benefits: [
      "Full manuscript originality analysis before submission",
      "Citation verification across IEEE, APA, Chicago and Harvard",
      "Writing consistency and authorship analysis across drafts",
      "Grammar and academic tone review for formal manuscripts",
      "Professional originality reports suitable for editorial review",
    ],
  },
  {
    icon: Printer,
    audience: "Publishers",
    headline: "Editorial Integrity at Every Stage",
    challenge: "Academic and professional publishers must verify the originality of submitted manuscripts, identify potential similarity issues and maintain rigorous publication standards.",
    benefits: [
      "Manuscript similarity analysis across authorised sources",
      "AI writing insights for editorial decision-making",
      "Authorship analysis for multi-author submissions",
      "Detailed originality reports for editorial records",
      "Secure document handling for confidential manuscripts",
    ],
  },
  {
    icon: FlaskConical,
    audience: "Research Institutions",
    headline: "Protecting Research Integrity Across the Organisation",
    challenge: "Research institutions require consistent standards for evaluating the originality and integrity of research outputs produced across multiple teams and projects.",
    benefits: [
      "Organisational submission and review workflows",
      "Team-level collaboration and document sharing",
      "Role-based access aligned to research hierarchy",
      "Citation checking across scientific and academic formats",
      "Aggregate institution reporting for research governance",
    ],
  },
  {
    icon: Briefcase,
    audience: "Corporate Organisations",
    headline: "Intellectual Property Protection in the Workplace",
    challenge: "Corporations producing whitepapers, reports and published content need to verify originality, protect intellectual property and ensure writing standards across teams.",
    benefits: [
      "Document originality analysis for published content",
      "Grammar and writing quality review for professional reports",
      "Team collaboration with role-based access and sharing",
      "Citation checking for research-based corporate documents",
      "Secure document storage and professional report export",
    ],
  },
];

export default function SolutionsPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <section style={{ background: "linear-gradient(150deg, #102A43 0%, #2864DC 100%)", padding: "5rem 0 4rem" }}>
        <div className="container-ta">
          <div style={badge}>Solutions</div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem,5vw,3.25rem)", color: "#ffffff", lineHeight: 1.1, maxWidth: 700, margin: "0 0 1.25rem", letterSpacing: "-0.02em" }}>
            The Right Solution for Every Academic Role
          </h1>
          <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, maxWidth: 600, margin: "0 0 2rem" }}>
            TrueAuthor serves students, lecturers, universities, researchers, publishers and organisations with purpose-built academic integrity workflows.
          </p>
        </div>
      </section>

      {solutions.map((s, i) => (
        <section key={s.audience} style={{ padding: "4rem 0", background: i % 2 === 0 ? "#F5F8FC" : "#ffffff", borderBottom: "1px solid #D1DCF0" }}>
          <div className="container-ta">
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2rem 3rem", alignItems: "start", maxWidth: 900 }}>
              <div style={{ width: 56, height: 56, background: "#EEF3FD", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <s.icon size={28} color="#155EEF" />
              </div>
              <div>
                <p style={{ color: "#155EEF", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.375rem" }}>{s.audience}</p>
                <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "clamp(1.375rem,3vw,1.875rem)", color: "#102A43", margin: "0 0 0.875rem", lineHeight: 1.2 }}>{s.headline}</h2>
                <p style={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>{s.challenge}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {s.benefits.map((b) => (
                    <li key={b} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", color: "#263449", fontSize: "0.9375rem" }}>
                      <span style={{ color: "#155EEF", fontWeight: 700, fontSize: "1rem", lineHeight: "1.5rem", flexShrink: 0 }}>+</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.625rem 1.375rem" }}>
                  Get Started <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section style={{ background: "linear-gradient(135deg, #102A43 0%, #155EEF 100%)", padding: "4rem 0" }}>
        <div className="container-ta" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "clamp(1.75rem,4vw,2.25rem)", color: "#ffffff", margin: "0 0 1rem" }}>
            Find the Solution Built for You
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.0625rem", margin: "0 0 2rem", maxWidth: 480, marginInline: "auto" }}>
            Start with a free account and explore the platform features relevant to your role.
          </p>
          <Link href="/signup" className="btn-white">Create Free Account <ArrowRight size={16} /></Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
