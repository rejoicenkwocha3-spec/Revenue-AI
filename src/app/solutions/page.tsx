import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ShoppingBag, Building2, Globe, BookOpen, Database, Users, FileText, Layers, ArrowRight, CheckCircle2 } from "lucide-react";

const solutions = [
  {
    icon: ShoppingBag,
    title: "Ecommerce",
    headline: "Convert More Browsers into Buyers",
    desc: "Search is the highest-converting entry point in any ecommerce store. SearchSprout gives shoppers the power to find exactly what they want, in the words they naturally use.",
    problems: [
      "Shoppers abandon when they cannot find products",
      "Keyword-only search misses product discovery",
      "No visibility into what customers are searching for",
    ],
    solutions_list: [
      "AI search understands product attributes and synonyms",
      "Visual filters and faceted navigation",
      "Search analytics to identify demand gaps",
      "Personalised results based on shopping behaviour",
      "Merchandising tools to promote high-margin products",
    ],
  },
  {
    icon: Building2,
    title: "Enterprise",
    headline: "Unify Knowledge Across Your Organisation",
    desc: "Enterprise teams lose hours every day searching disconnected systems. SearchSprout creates a unified, intelligent search layer across all your internal knowledge bases and documentation.",
    problems: [
      "Information scattered across multiple systems",
      "Employees cannot find relevant documents and policies",
      "Onboarding slowed by poor knowledge discovery",
    ],
    solutions_list: [
      "Federated search across connected data sources",
      "Role-based access control and data security",
      "AI assistant for conversational knowledge retrieval",
      "Advanced permission management",
      "Audit logs and compliance reporting",
    ],
  },
  {
    icon: Globe,
    title: "Online Marketplaces",
    headline: "Match Buyers with the Right Sellers",
    desc: "Marketplaces live or die on the quality of their search and discovery experience. SearchSprout delivers precise, faceted search across millions of listings at scale.",
    problems: [
      "Large catalog sizes make keyword search insufficient",
      "Poor matching between buyer intent and seller listings",
      "No tools to manage listing quality and relevance",
    ],
    solutions_list: [
      "Semantic search across millions of listings",
      "Attribute-based filtering and faceted navigation",
      "Seller-funded merchandising and promotion tools",
      "Fraud-resistant search quality signals",
      "Real-time indexing for new listings",
    ],
  },
  {
    icon: FileText,
    title: "Digital Publishers",
    headline: "Help Readers Discover More Content",
    desc: "Readers who find relevant content stay longer and return more often. SearchSprout gives publishers intelligent article search, content recommendations and editorial controls.",
    problems: [
      "Archive content is effectively invisible to readers",
      "No connection between search and content recommendations",
      "Editorial teams cannot surface important content",
    ],
    solutions_list: [
      "Full-text search across entire content archives",
      "AI-powered content recommendations",
      "Editorial pinning and content promotion",
      "Topic clustering and category search",
      "Engagement analytics per search query",
    ],
  },
  {
    icon: BookOpen,
    title: "Educational Platforms",
    headline: "Connect Students with the Right Learning Materials",
    desc: "Learners searching for specific topics, instructors or formats need search that understands educational context. SearchSprout makes learning discovery faster and more effective.",
    problems: [
      "Students struggle to find relevant courses and materials",
      "Search does not understand educational terminology",
      "No visibility into what students are searching for",
    ],
    solutions_list: [
      "Subject-aware semantic search",
      "Skill level and format filtering",
      "Curriculum-based content discovery",
      "Learning path recommendations",
      "Instructor and resource search",
    ],
  },
  {
    icon: Layers,
    title: "SaaS Platforms",
    headline: "Improve Feature Discoverability and Retention",
    desc: "In-app search is one of the most underused growth levers in SaaS. SearchSprout helps users find features, settings and help content without leaving your application.",
    problems: [
      "Users cannot find product features they need",
      "Support ticket volume inflated by poor search",
      "No data on what features users search for most",
    ],
    solutions_list: [
      "In-app search across features and settings",
      "Integrated help content search",
      "Command palette search patterns",
      "User behaviour analytics for product teams",
      "AI assistant for user support",
    ],
  },
  {
    icon: Database,
    title: "Documentation and Knowledge Bases",
    headline: "Make Your Documentation Actually Useful",
    desc: "Great documentation deserves great search. SearchSprout transforms static documentation into an interactive knowledge discovery experience that answers questions instantly.",
    problems: [
      "Developers cannot find the right API references",
      "Support teams direct users to docs that are hard to navigate",
      "Documentation usage is invisible to content teams",
    ],
    solutions_list: [
      "Semantic search across code, prose and examples",
      "AI assistant for question answering",
      "Popular query tracking to prioritise content",
      "Version-aware search results",
      "Search widget embeddable in any docs site",
    ],
  },
  {
    icon: Users,
    title: "Digital Agencies",
    headline: "Manage Search Experiences Across All Clients",
    desc: "Agencies managing multiple client sites need a platform that scales. SearchSprout provides multi-project management, white-label capabilities and centralised analytics.",
    problems: [
      "Managing separate search tools for each client is complex",
      "No consistent reporting across client projects",
      "Client onboarding takes too long",
    ],
    solutions_list: [
      "Multi-project management from one dashboard",
      "Per-project billing and usage tracking",
      "White-label search widget options",
      "Client-level access permissions",
      "Consolidated analytics and reporting",
    ],
  },
];

export default function SolutionsPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section style={{ background: "#071F20", padding: "5rem 0 4rem", textAlign: "center" }}>
          <div className="container-ss">
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#FFFFFF", marginBottom: "1.25rem", lineHeight: 1.1 }}>
              Search Solutions for Every Business
            </h1>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.125rem", maxWidth: "580px", margin: "0 auto 2.5rem", lineHeight: 1.65 }}>
              Whether you run an ecommerce store, a SaaS platform or an enterprise knowledge base, SearchSprout adapts to your business and your users.
            </p>
            <Link href="/signup" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
              Start Building Free <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Quick nav */}
        <section style={{ background: "#F7FAF8", borderBottom: "1px solid #DCE8E2", padding: "1.25rem 0" }}>
          <div className="container-ss">
            <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", flexWrap: "wrap" }}>
              {solutions.map((s) => (
                <a
                  key={s.title}
                  href={`#${s.title.toLowerCase().replace(/ /g, "-")}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.4rem 0.875rem", borderRadius: "2rem",
                    background: "#FFFFFF", border: "1px solid #DCE8E2",
                    fontSize: "0.875rem", fontWeight: 500, color: "#063B38",
                    textDecoration: "none", whiteSpace: "nowrap",
                    transition: "background 0.15s"
                  }}
                >
                  <s.icon size={14} />
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions */}
        {solutions.map((s, i) => (
          <section
            key={s.title}
            id={s.title.toLowerCase().replace(/ /g, "-")}
            style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F7FAF8", padding: "5rem 0" }}
          >
            <div className="container-ss">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }}>
                <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "#063B38", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.icon size={24} color="#16C653" />
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#16C653", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.title}</span>
                  </div>
                  <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: "1rem", lineHeight: 1.2 }}>{s.headline}</h2>
                  <p style={{ color: "#65736D", fontSize: "1rem", lineHeight: 1.65, marginBottom: "2rem" }}>{s.desc}</p>
                  <Link href="/signup" className="btn-primary">
                    Get Started <ArrowRight size={15} />
                  </Link>
                </div>

                <div style={{ order: i % 2 === 0 ? 1 : 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div className="card-ss">
                    <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#65736D", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Common Challenges</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {s.problems.map((p) => (
                        <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.9375rem", color: "#65736D" }}>
                          <span style={{ color: "#DCE8E2", marginTop: "0.1rem", flexShrink: 0 }}>&#8212;</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="card-ss">
                    <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#16C653", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>SearchSprout Solves This</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {s.solutions_list.map((sl) => (
                        <li key={sl} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.9375rem", color: "#071F20" }}>
                          <CheckCircle2 size={15} color="#16C653" style={{ flexShrink: 0, marginTop: "0.15rem" }} />
                          {sl}
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
              Find the Right Search Experience for Your Business
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
              Talk to our team or start building for free. We will help you configure the right setup for your use case.
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
