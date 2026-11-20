"use client";

import { useState } from "react";
import { Star, Plus, Trash2 } from "lucide-react";

interface RecommendationRule {
  id: string;
  name: string;
  type: string;
  source: string;
  enabled: boolean;
}

const defaultRules: RecommendationRule[] = [
  { id: "1", name: "Related Articles", type: "content", source: "Blog Index", enabled: true },
  { id: "2", name: "Similar Products", type: "product", source: "Products Index", enabled: true },
  { id: "3", name: "Trending Searches", type: "query", source: "Analytics", enabled: false },
];

export default function RecommendationsPage() {
  const [rules, setRules] = useState<RecommendationRule[]>(defaultRules);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("content");
  const [source, setSource] = useState("");

  function addRule(e: React.FormEvent) {
    e.preventDefault();
    setRules((prev) => [...prev, { id: Date.now().toString(), name, type, source, enabled: true }]);
    setName(""); setSource(""); setShowNew(false);
  }

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function deleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Recommendations</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Configure content and product recommendations for your users.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)} style={{ fontSize: "0.9rem" }}>
          <Plus size={16} /> Add Recommendation
        </button>
      </div>

      {/* Types */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { type: "content", label: "Content Recommendations", desc: "Recommend related articles, documentation or blog posts based on what users are reading." },
          { type: "product", label: "Product Recommendations", desc: "Suggest similar or complementary products based on the user's current view or search." },
          { type: "query", label: "Query Suggestions", desc: "Recommend related search queries users might also want to explore." },
        ].map((t) => (
          <div key={t.type} className="card-ss">
            <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: "#E8F8EE", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
              <Star size={18} color="#16C653" />
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.375rem" }}>{t.label}</div>
            <div style={{ fontSize: "0.875rem", color: "#65736D", lineHeight: 1.55 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Configure Recommendation</h2>
          <form onSubmit={addRule} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div>
                <label className="label-ss">Name</label>
                <input className="input-ss" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Related Articles" required />
              </div>
              <div>
                <label className="label-ss">Type</label>
                <select className="input-ss" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="content">Content</option>
                  <option value="product">Product</option>
                  <option value="query">Query</option>
                </select>
              </div>
              <div>
                <label className="label-ss">Source Index</label>
                <input className="input-ss" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Index name" required />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary">Add</button>
              <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-ss" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #DCE8E2" }}>
          <h2 style={{ fontSize: "1rem", margin: 0 }}>Active Rules</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #DCE8E2", background: "#F7FAF8" }}>
              <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Name</th>
              <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Type</th>
              <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Source</th>
              <th style={{ textAlign: "center", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Status</th>
              <th style={{ padding: "0.875rem 1.25rem" }} />
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #F0F5F2" }}>
                <td style={{ padding: "0.875rem 1.25rem", fontWeight: 500, color: "#071F20" }}>{r.name}</td>
                <td style={{ padding: "0.875rem 1.25rem", color: "#65736D", textTransform: "capitalize" }}>{r.type}</td>
                <td style={{ padding: "0.875rem 1.25rem", color: "#65736D" }}>{r.source}</td>
                <td style={{ padding: "0.875rem 1.25rem", textAlign: "center" }}>
                  <button onClick={() => toggleRule(r.id)} style={{ width: 44, height: 24, borderRadius: "12px", background: r.enabled ? "#16C653" : "#DCE8E2", border: "none", cursor: "pointer", position: "relative" }}>
                    <span style={{ position: "absolute", top: 2, left: r.enabled ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#FFFFFF", display: "block", transition: "left 0.2s" }} />
                  </button>
                </td>
                <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                  <button onClick={() => deleteRule(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DCE8E2" }}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
