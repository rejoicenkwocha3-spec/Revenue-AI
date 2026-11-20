import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  Search, Brain, Database, BarChart3, Code2, MessageSquare,
  Star, Layers, ArrowRight, CheckCircle2, Zap, Globe
} from "lucide-react";

const capabilities = [
  {
    icon: Search,
    title: "Search Infrastructure",
    desc: "Enterprise-grade search infrastructure built for scale. Handle millions of queries per second with consistent sub-50ms response times. SearchSprout manages all indexing, sharding and replication automatically.",
    points: ["Distributed indexing", "Auto-scaling replicas", "99.9% uptime SLA", "Global edge delivery"],
  },
  {
    icon: Brain,
    title: "AI-Powered Search",
    desc: "Natural language understanding transforms how users find information. SearchSprout interprets user intent, understands synonyms, handles typos and surfaces contextually relevant results even from ambiguous queries.",
    points: ["Natural language processing", "Intent classification", "Typo tolerance", "Context-aware ranking"],
  },
  {
    icon: Layers,
    title: "Hybrid Search",
    desc: "Combine the precision of keyword matching with the intelligence of semantic vector search. Hybrid search delivers the best of both approaches: exact matches when needed, conceptual discovery when relevant.",
    points: ["Keyword matching", "Vector similarity search", "Configurable weighting", "Multi-field search"],
  },
  {
    icon: Globe,
    title: "Semantic Search",
    desc: "Allow users to find relevant content even when they do not use the exact words contained in your indexed data. Semantic search understands concepts, relationships and meaning across your entire content library.",
    points: ["Embedding-based retrieval", "Cross-language search", "Conceptual matching", "Automatic synonyms"],
  },
  {
    icon: Star,
    title: "AI Personalisation",
    desc: "Adapt search results to each user based on behavioural signals, preferences and context. Personalised search increases relevance, engagement and conversion rates across every session.",
    points: ["Behavioural signals", "User preference learning", "Session context", "A/B testing"],
  },
  {
    icon: BarChart3,
    title: "Search Analytics",
    desc: "Understand exactly how users search your content. Track popular queries, zero-result searches, click patterns and conversion funnels. Use data to continuously improve your search experience.",
    points: ["Query performance tracking", "Zero result analysis", "Click-through rates", "Conversion attribution"],
  },
  {
    icon: MessageSquare,
    title: "AI Search Assistant",
    desc: "Allow users to ask questions and receive conversational answers grounded in your indexed content. The AI assistant retrieves relevant documents and synthesises accurate, contextual responses.",
    points: ["Retrieval-augmented generation", "Cited answers", "Multi-turn conversations", "Source attribution"],
  },
  {
    icon: Code2,
    title: "Developer API",
    desc: "Build custom search experiences with clean, well-documented APIs. Full-featured SDKs for all major languages, webhook support, real-time indexing and enterprise-grade security.",
    points: ["REST and GraphQL APIs", "SDK for 10+ languages", "Real-time indexing", "Secure API key management"],
  },
];

const workflow = [
  { step: "Connect Data", icon: Database, desc: "Upload files, provide URLs or use the API to ingest your content. SearchSprout handles parsing, chunking and storage." },
  { step: "Index Content", icon: Layers, desc: "SearchSprout automatically builds searchable indexes with AI embeddings, full-text indexes and structured attribute indexes." },
  { step: "Configure Search", icon: Search, desc: "Use the visual dashboard to set ranking rules, configure filters, define searchable attributes and customise result layouts." },
  { step: "Deploy Search", icon: Zap, desc: "Embed the hosted search UI or build a custom experience using the Search API. Go live in minutes." },
  { step: "Analyse Performance", icon: BarChart3, desc: "Monitor query volume, response times, user behaviour and conversion metrics through the analytics dashboard." },
  { step: "Optimise Results", icon: Star, desc: "Use merchandising tools, synonyms and AI insights to continuously improve relevance and business outcomes." },
];

export default function PlatformPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section style={{ background: "#071F20", padding: "5rem 0 4rem", textAlign: "center" }}>
          <div className="container-ss">
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#FFFFFF", marginBottom: "1.25rem", lineHeight: 1.1 }}>
              The Complete Search Platform
            </h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.125rem", maxWidth: "580px", margin: "0 auto 2.5rem", lineHeight: 1.65 }}>
              Everything you need to build intelligent search experiences: AI search, semantic retrieval, personalisation, analytics and powerful developer tools.
            </p>
            <Link href="/signup" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
              Start Building Free <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Workflow */}
        <section style={{ background: "#F7FAF8", padding: "5rem 0" }}>
          <div className="container-ss">
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", marginBottom: "0.75rem" }}>
                The SearchSprout Workflow
              </h2>
              <p style={{ color: "#65736D", fontSize: "1rem", maxWidth: "480px", margin: "0 auto" }}>
                From raw data to live search experience in a structured, repeatable process.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
              {workflow.map((w, i) => (
                <div key={w.step} className="card-ss" style={{ textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "#063B38", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                    <w.icon size={22} color="#16C653" />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#16C653", fontWeight: 600, marginBottom: "0.375rem" }}>STEP {String(i + 1).padStart(2, "0")}</div>
                  <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>{w.step}</h3>
                  <p style={{ color: "#65736D", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section style={{ background: "#FFFFFF", padding: "5rem 0" }}>
          <div className="container-ss">
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", marginBottom: "0.75rem" }}>
                Platform Capabilities
              </h2>
              <p style={{ color: "#65736D", fontSize: "1rem", maxWidth: "480px", margin: "0 auto" }}>
                Every capability you need to build world-class search experiences, all in one platform.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {capabilities.map((c, i) => (
                <div key={c.title} className="card-ss" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "center" }}>
                  <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "0.625rem", background: "#E8F8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <c.icon size={22} color="#16C653" />
                      </div>
                      <h3 style={{ fontSize: "1.25rem", margin: 0 }}>{c.title}</h3>
                    </div>
                    <p style={{ color: "#65736D", fontSize: "0.9375rem", lineHeight: 1.65, marginBottom: "1.25rem" }}>{c.desc}</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {c.points.map((p) => (
                        <li key={p} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#071F20" }}>
                          <CheckCircle2 size={15} color="#16C653" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ order: i % 2 === 0 ? 1 : 0, background: "#F7FAF8", borderRadius: "0.75rem", height: "180px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #DCE8E2" }}>
                    <c.icon size={56} color="#DCE8E2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: "#063B38", padding: "5rem 0", textAlign: "center" }}>
          <div className="container-ss">
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#FFFFFF", marginBottom: "1rem" }}>
              Ready to Build Smarter Search?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
              Start your free account today and have your first search experience live in under 30 minutes.
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
