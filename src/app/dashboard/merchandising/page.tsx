"use client";

import { useState } from "react";
import { Plus, ArrowUp, ArrowDown, Pin, Trash2, Settings2 } from "lucide-react";

interface Rule {
  id: string;
  query: string;
  action: string;
  target: string;
  position?: number;
}

const defaultRules: Rule[] = [
  { id: "1", query: "pricing", action: "pin", target: "Pricing Plans", position: 1 },
  { id: "2", query: "help", action: "redirect", target: "/help-center" },
  { id: "3", query: "trial", action: "promote", target: "Start Free Trial", position: 1 },
];

export default function MerchandisingPage() {
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [showNew, setShowNew] = useState(false);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("pin");
  const [target, setTarget] = useState("");
  const [position, setPosition] = useState("1");

  function addRule(e: React.FormEvent) {
    e.preventDefault();
    setRules((prev) => [...prev, {
      id: Date.now().toString(), query, action, target,
      position: action !== "redirect" ? parseInt(position) : undefined
    }]);
    setQuery(""); setTarget(""); setShowNew(false);
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  const actionColors: Record<string, string> = {
    pin: "#16C653",
    promote: "#063B38",
    demote: "#F59E0B",
    redirect: "#65736D",
    hide: "#EF4444",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Search Merchandising</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Control search result ranking with query-specific rules.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)} style={{ fontSize: "0.9rem" }}>
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {/* Rule types */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.875rem", marginBottom: "2rem" }}>
        {[
          { action: "pin", label: "Pin Results", desc: "Lock a result to the top position for specific queries.", icon: Pin },
          { action: "promote", label: "Promote", desc: "Boost a result higher in rankings for a query.", icon: ArrowUp },
          { action: "demote", label: "Demote", desc: "Push a result lower in rankings for a query.", icon: ArrowDown },
          { action: "redirect", label: "Redirect", desc: "Send users to a specific URL for a query.", icon: Settings2 },
        ].map((t) => (
          <div key={t.action} className="card-ss" style={{ cursor: "pointer" }} onClick={() => { setAction(t.action); setShowNew(true); }}>
            <t.icon size={20} color={actionColors[t.action]} style={{ marginBottom: "0.5rem" }} />
            <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>{t.label}</div>
            <div style={{ fontSize: "0.8125rem", color: "#65736D", lineHeight: 1.5 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Create Merchandising Rule</h2>
          <form onSubmit={addRule} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div>
                <label className="label-ss">Search Query</label>
                <input className="input-ss" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. pricing" required />
              </div>
              <div>
                <label className="label-ss">Action</label>
                <select className="input-ss" value={action} onChange={(e) => setAction(e.target.value)}>
                  <option value="pin">Pin to position</option>
                  <option value="promote">Promote result</option>
                  <option value="demote">Demote result</option>
                  <option value="redirect">Redirect to URL</option>
                  <option value="hide">Hide result</option>
                </select>
              </div>
              <div>
                <label className="label-ss">{action === "redirect" ? "Redirect URL" : "Result Title"}</label>
                <input className="input-ss" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={action === "redirect" ? "/pricing" : "Result title or ID"} required />
              </div>
              {action !== "redirect" && (
                <div>
                  <label className="label-ss">Position</label>
                  <input className="input-ss" type="number" min="1" value={position} onChange={(e) => setPosition(e.target.value)} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary">Add Rule</button>
              <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-ss" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #DCE8E2" }}>
          <h2 style={{ fontSize: "1rem", margin: 0 }}>Active Rules ({rules.length})</h2>
        </div>
        {rules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#65736D" }}>No rules configured. Add a rule to customise search rankings.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #DCE8E2", background: "#F7FAF8" }}>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Query</th>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Action</th>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Target</th>
                <th style={{ textAlign: "right", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Position</th>
                <th style={{ padding: "0.875rem 1.25rem" }} />
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #F0F5F2" }}>
                  <td style={{ padding: "0.875rem 1.25rem", fontWeight: 500, color: "#071F20" }}>{r.query}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "2rem", background: "#E8F8EE", color: actionColors[r.action], fontWeight: 600 }}>{r.action}</span>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem", color: "#65736D" }}>{r.target}</td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "right", color: "#65736D" }}>{r.position ?? "-"}</td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                    <button onClick={() => removeRule(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DCE8E2" }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
