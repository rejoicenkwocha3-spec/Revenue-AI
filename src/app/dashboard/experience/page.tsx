"use client";

import { useState } from "react";
import { Save, Eye, Sliders } from "lucide-react";

export default function SearchExperiencePage() {
  const [config, setConfig] = useState({
    placeholder: "Search...",
    resultsPerPage: "10",
    highlightResults: true,
    showFilters: true,
    autocomplete: true,
    instantSearch: true,
    sortOptions: true,
    noResultsMessage: "No results found. Try a different search term.",
    primaryColor: "#16C653",
    borderRadius: "8",
    showSearchTime: true,
  });

  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Search Experience</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Customise the look, feel and behaviour of your search experience.</p>
        </div>
        <button className="btn-primary" onClick={save} style={{ fontSize: "0.9rem" }}>
          <Save size={16} /> {saved ? "Saved" : "Save Changes"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Search bar */}
        <div className="card-ss">
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Search Bar</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label-ss">Placeholder Text</label>
              <input className="input-ss" value={config.placeholder} onChange={(e) => setConfig({ ...config, placeholder: e.target.value })} />
            </div>
            <div>
              <label className="label-ss">Results Per Page</label>
              <select className="input-ss" value={config.resultsPerPage} onChange={(e) => setConfig({ ...config, resultsPerPage: e.target.value })}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div>
              <label className="label-ss">Border Radius (px)</label>
              <input className="input-ss" type="number" min="0" max="24" value={config.borderRadius} onChange={(e) => setConfig({ ...config, borderRadius: e.target.value })} />
            </div>
            <div>
              <label className="label-ss">Primary Colour</label>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <input type="color" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} style={{ width: 40, height: 36, borderRadius: "0.375rem", border: "1px solid #DCE8E2", cursor: "pointer" }} />
                <input className="input-ss" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} style={{ flex: 1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Behaviour */}
        <div className="card-ss">
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Search Behaviour</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { key: "instantSearch", label: "Instant Search", desc: "Show results as users type." },
              { key: "autocomplete", label: "Autocomplete", desc: "Suggest queries as the user types." },
              { key: "highlightResults", label: "Highlight Matches", desc: "Highlight matching terms in results." },
              { key: "showFilters", label: "Show Filters", desc: "Display filter facets alongside results." },
              { key: "sortOptions", label: "Sort Options", desc: "Allow users to sort results." },
              { key: "showSearchTime", label: "Show Response Time", desc: "Display query response time in results." },
            ].map((opt) => (
              <div key={opt.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#071F20" }}>{opt.label}</div>
                  <div style={{ fontSize: "0.8125rem", color: "#65736D" }}>{opt.desc}</div>
                </div>
                <button
                  onClick={() => setConfig({ ...config, [opt.key]: !config[opt.key as keyof typeof config] })}
                  style={{
                    width: 44, height: 24, borderRadius: "12px",
                    background: config[opt.key as keyof typeof config] ? "#16C653" : "#DCE8E2",
                    border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s"
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2,
                    left: config[opt.key as keyof typeof config] ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%", background: "#FFFFFF",
                    transition: "left 0.2s", display: "block"
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* No results */}
        <div className="card-ss">
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Empty State</h2>
          <div>
            <label className="label-ss">No Results Message</label>
            <input className="input-ss" value={config.noResultsMessage} onChange={(e) => setConfig({ ...config, noResultsMessage: e.target.value })} />
          </div>
        </div>

        {/* Preview */}
        <div className="card-ss">
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Eye size={17} /> Live Preview
          </h2>
          <div style={{ background: "#F7FAF8", borderRadius: `${config.borderRadius}px`, border: "1px solid #DCE8E2", padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#FFFFFF", borderRadius: `${config.borderRadius}px`, padding: "0.625rem 0.875rem", border: `1.5px solid ${config.primaryColor}`, marginBottom: "0.75rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={config.primaryColor} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ color: "#65736D", fontSize: "0.875rem" }}>{config.placeholder}</span>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#65736D", marginBottom: "0.5rem" }}>3 results found {config.showSearchTime && <span style={{ color: config.primaryColor }}>· 38ms</span>}</div>
            {["Getting Started Guide", "API Reference", "Pricing Plans"].map((r, i) => (
              <div key={r} style={{ padding: "0.625rem 0.75rem", borderRadius: `${config.borderRadius}px`, marginBottom: "0.375rem", background: i === 0 ? `${config.primaryColor}15` : "#FFFFFF", border: "1px solid #DCE8E2" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#071F20" }}>{r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
