import { Plug, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const integrations = [
  { name: "JavaScript SDK", category: "SDK", status: "available", desc: "Full-featured JavaScript and TypeScript SDK for browser and Node.js applications." },
  { name: "Python SDK", category: "SDK", status: "available", desc: "Python SDK for server-side indexing and search query management." },
  { name: "PHP SDK", category: "SDK", status: "available", desc: "PHP SDK for integration with Laravel, Symfony and WordPress." },
  { name: "Ruby SDK", category: "SDK", status: "available", desc: "Ruby gem for Rails applications and standalone Ruby scripts." },
  { name: "Go SDK", category: "SDK", status: "available", desc: "Lightweight Go package for high-performance server-side integration." },
  { name: "Shopify", category: "Ecommerce", status: "available", desc: "Connect your Shopify product catalog and sync inventory automatically." },
  { name: "WooCommerce", category: "Ecommerce", status: "available", desc: "Index WooCommerce products, categories and attributes." },
  { name: "WordPress", category: "CMS", status: "available", desc: "Replace WordPress search with AI-powered SearchSprout results." },
  { name: "Contentful", category: "CMS", status: "available", desc: "Sync Contentful content types and entries to SearchSprout indexes." },
  { name: "Sanity", category: "CMS", status: "available", desc: "Index Sanity documents and query them with intelligent search." },
  { name: "Zapier", category: "Automation", status: "available", desc: "Connect SearchSprout to 5,000+ apps using Zapier automation." },
  { name: "Segment", category: "Analytics", status: "coming-soon", desc: "Send behavioural signals from Segment to improve personalisation." },
];

export default function IntegrationsPage() {
  const categories = [...new Set(integrations.map((i) => i.category))];

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Integrations</h1>
        <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Connect SearchSprout to your existing tools and platforms.</p>
      </div>

      {categories.map((cat) => (
        <div key={cat} style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#65736D", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1rem" }}>{cat}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {integrations.filter((i) => i.category === cat).map((int) => (
              <div key={int.name} className="card-ss" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "0.625rem", background: "#F7FAF8", border: "1px solid #DCE8E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Plug size={18} color="#16C653" />
                    </div>
                    <span style={{
                      fontSize: "0.75rem", padding: "0.2rem 0.625rem", borderRadius: "2rem", fontWeight: 500,
                      background: int.status === "available" ? "#E8F8EE" : "#F7FAF8",
                      color: int.status === "available" ? "#16C653" : "#65736D"
                    }}>
                      {int.status === "available" ? "Available" : "Coming soon"}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.375rem" }}>{int.name}</h3>
                  <p style={{ fontSize: "0.875rem", color: "#65736D", lineHeight: 1.55, marginBottom: "1rem" }}>{int.desc}</p>
                </div>
                {int.status === "available" ? (
                  <Link href="/dashboard/api-keys" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "#16C653", fontWeight: 600, textDecoration: "none" }}>
                    View docs <ArrowRight size={13} />
                  </Link>
                ) : (
                  <span style={{ fontSize: "0.875rem", color: "#65736D" }}>Available soon</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
