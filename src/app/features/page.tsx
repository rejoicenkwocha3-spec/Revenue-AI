import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Search, Brain, Layers, Zap, MessageSquare, Star, BarChart3, Settings, Database, Code2, ArrowRight, CheckCircle2 } from "lucide-react";

const featureGroups = [
  {
    id: "ai-search",
    icon: Brain,
    title: "AI-Powered Search",
    tagline: "Search That Understands Intent",
    desc: "Move beyond simple keyword matching. SearchSprout uses large language models and neural retrieval to understand what users mean, not just what they type. Handle ambiguous queries, conversational search and complex natural language questions with confidence.",
    items: [
      "Natural language query understanding",
      "Intent classification and query expansion",
      "Typo tolerance and spelling correction",
      "Multilingual search support",
      "Query suggestion and autocomplete",
      "Contextual result reranking",
    ],
  },
  {
    id: "hybrid-search",
    icon: Layers,
    title: "Hybrid Search",
    tagline: "The Best of Keyword and Semantic",
    desc: "Hybrid search combines traditional BM25 keyword matching with modern semantic vector retrieval. This combination delivers exact matches for specific queries while providing conceptual discovery when users search with natural language.",
    items: [
      "BM25 full-text ranking",
      "Dense vector similarity search",
      "Configurable hybrid weighting",
      "Multi-field search boosting",
      "Attribute-based filtering",
      "Geo-search capabilities",
    ],
  },
  {
    id: "instant-search",
    icon: Zap,
    title: "Instant Search",
    tagline: "Results as Fast as You Type",
    desc: "Users expect instant results. SearchSprout delivers search responses in under 50 milliseconds, allowing you to build reactive search experiences that update results with every keystroke. No loading spinners, no delays.",
    items: [
      "Sub-50ms median response time",
      "Debounced query optimisation",
      "Incremental result loading",
      "Client-side caching",
      "Optimistic UI patterns",
      "Mobile-first performance",
    ],
  },
  {
    id: "personalisation",
    icon: Star,
    title: "AI Personalisation",
    tagline: "Results That Know Your Users",
    desc: "Personalise search results for every user based on their behaviour, preferences and session context. Users see more relevant results the more they interact with your search experience, increasing engagement and conversion.",
    items: [
      "User profile-based reranking",
      "Session signal integration",
      "Collaborative filtering",
      "Purchase and engagement history",
      "A/B testing for personalisation rules",
      "GDPR-compliant preference storage",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Search Analytics",
    tagline: "Understand How Your Users Search",
    desc: "Comprehensive analytics give you a complete picture of how users interact with your search experience. Use these insights to identify content gaps, optimise ranking and improve conversions.",
    items: [
      "Total search volume and trends",
      "Popular queries and click-through rates",
      "Zero result query tracking",
      "Search conversion attribution",
      "Result position performance",
      "Date-range filtering and exports",
    ],
  },
  {
    id: "merchandising",
    icon: Settings,
    title: "Search Merchandising",
    tagline: "Take Control of Your Search Results",
    desc: "Give your business team full control over how search results are ranked and displayed. Promote important content, demote irrelevant results and create rules that reflect your business priorities without touching code.",
    items: [
      "Pin results to top positions",
      "Promote selected content",
      "Demote or hide unwanted results",
      "Create query-specific ranking rules",
      "Configure search redirects",
      "Visual rule builder with live preview",
    ],
  },
  {
    id: "recommendations",
    icon: Database,
    title: "Recommendation Engine",
    tagline: "Discover What Users Did Not Know to Search For",
    desc: "Drive content discovery beyond the search bar. The SearchSprout recommendation engine surfaces relevant products, articles and content based on what users are viewing, browsing and engaging with.",
    items: [
      "Related content recommendations",
      "Trending and popular content",
      "Category-based discovery",
      "Behavioural signal integration",
      "Collaborative filtering models",
      "Embeddable recommendation widgets",
    ],
  },
  {
    id: "ai-assistant",
    icon: MessageSquare,
    title: "AI Search Assistant",
    tagline: "Conversational Answers from Your Content",
    desc: "Let users ask questions in natural language and receive conversational answers grounded in your indexed content. The AI assistant retrieves relevant documents and synthesises accurate responses with source attribution.",
    items: [
      "Retrieval-augmented generation",
      "Source citation for every answer",
      "Multi-turn conversation support",
      "Custom assistant persona",
      "Hallucination safeguards",
      "Answer quality monitoring",
    ],
  },
  {
    id: "developer-api",
    icon: Code2,
    title: "Search API and Developer Tools",
    tagline: "Build Anything on Top of SearchSprout",
    desc: "A complete developer toolkit for integrating SearchSprout into any application. Clean REST and GraphQL APIs, SDKs for all major languages, detailed documentation and a sandbox environment for testing.",
    items: [
      "REST and GraphQL API endpoints",
      "SDKs: JavaScript, Python, PHP, Ruby, Go, Java",
      "Secure API key management",
      "Webhook support for real-time events",
      "API request logs and monitoring",
      "Rate limiting and usage quotas",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section style={{ background: "#071F20", padding: "5rem 0 4rem", textAlign: "center" }}>
          <div className="container-ss">
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#FFFFFF", marginBottom: "1.25rem", lineHeight: 1.1 }}>
              Every Feature You Need to Build Brilliant Search
            </h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.125rem", maxWidth: "580px", margin: "0 auto 2.5rem", lineHeight: 1.65 }}>
              SearchSprout combines AI search, semantic retrieval, personalisation, analytics and developer tools into one complete platform.
            </p>
            <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
                Start Building Free <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="btn-outline" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Feature nav */}
        <section style={{ background: "#F7FAF8", borderBottom: "1px solid #DCE8E2", padding: "1.25rem 0" }}>
          <div className="container-ss">
            <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", flexWrap: "wrap" }}>
              {featureGroups.map((f) => (
                <a
                  key={f.id}
                  href={`#${f.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.4rem 0.875rem", borderRadius: "2rem",
                    background: "#FFFFFF", border: "1px solid #DCE8E2",
                    fontSize: "0.875rem", fontWeight: 500, color: "#063B38",
                    textDecoration: "none", whiteSpace: "nowrap"
                  }}
                >
                  <f.icon size={14} />
                  {f.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        {featureGroups.map((f, i) => (
          <section
            key={f.id}
            id={f.id}
            style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F7FAF8", padding: "5rem 0" }}
          >
            <div className="container-ss">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
                <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "#E8F8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <f.icon size={24} color="#16C653" />
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#16C653", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>{f.tagline}</div>
                  <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", marginBottom: "1rem", lineHeight: 1.2 }}>{f.title}</h2>
                  <p style={{ color: "#65736D", fontSize: "1rem", lineHeight: 1.65, marginBottom: "1.75rem" }}>{f.desc}</p>
                  <Link href="/signup" className="btn-primary">
                    Try {f.title} Free <ArrowRight size={15} />
                  </Link>
                </div>

                <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                  <div className="card-ss">
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                      {f.items.map((item) => (
                        <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9375rem", color: "#071F20" }}>
                          <CheckCircle2 size={16} color="#16C653" style={{ flexShrink: 0 }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* CTA */}
        <section style={{ background: "#063B38", padding: "5rem 0", textAlign: "center" }}>
          <div className="container-ss">
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#FFFFFF", marginBottom: "1rem" }}>
              All Features Included on Every Plan
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
              No feature gating. Every SearchSprout plan includes the full platform. Scale your usage, not your feature access.
            </p>
            <Link href="/pricing" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
              View Pricing Plans <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
