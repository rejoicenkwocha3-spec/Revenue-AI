"use client";

import { useEffect, useState } from "react";
import { Plus, Globe, FileText, Database, Upload, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  record_count: number;
  created_at: string;
  url: string | null;
}

const SOURCE_TYPES = [
  { value: "url", label: "Website URL", icon: Globe, desc: "Crawl a URL and index its content automatically." },
  { value: "sitemap", label: "Sitemap URL", icon: Globe, desc: "Index all pages listed in an XML sitemap." },
  { value: "csv", label: "CSV Upload", icon: FileText, desc: "Upload a CSV file with structured content." },
  { value: "json", label: "JSON Upload", icon: Database, desc: "Upload a JSON file with structured records." },
  { value: "manual", label: "Manual Entry", icon: Upload, desc: "Enter content manually through the editor." },
];

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [type, setType] = useState("url");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("data_sources").select("*").order("created_at", { ascending: false });
    setSources(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated."); setSaving(false); return; }

    const { error: err } = await supabase.from("data_sources").insert({
      name: name.trim(),
      type,
      url: url.trim() || null,
      user_id: user.id,
      status: "pending",
      record_count: 0,
    });

    if (err) { setError(err.message); setSaving(false); return; }
    setName(""); setUrl(""); setShowNew(false);
    await load();
    setSaving(false);
  }

  async function deleteSource(id: string) {
    if (!confirm("Remove this data source?")) return;
    const supabase = createClient();
    await supabase.from("data_sources").delete().eq("id", id);
    await load();
  }

  function statusIcon(status: string) {
    if (status === "indexed") return <CheckCircle2 size={14} color="#16C653" />;
    if (status === "error") return <AlertCircle size={14} color="#EF4444" />;
    return <Loader2 size={14} color="#F59E0B" />;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Data Sources</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Connect and manage the content SearchSprout indexes.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)} style={{ fontSize: "0.9rem" }}>
          <Plus size={16} /> Add Source
        </button>
      </div>

      {showNew && (
        <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Add Data Source</h2>
          {error && <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#991B1B" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.625rem", marginBottom: "1.25rem" }}>
            {SOURCE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                style={{
                  padding: "0.875rem", borderRadius: "0.625rem", textAlign: "left",
                  border: `1.5px solid ${type === t.value ? "#16C653" : "#DCE8E2"}`,
                  background: type === t.value ? "#E8F8EE" : "#FFFFFF",
                  cursor: "pointer"
                }}
              >
                <t.icon size={18} color={type === t.value ? "#16C653" : "#65736D"} style={{ marginBottom: "0.5rem" }} />
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#071F20" }}>{t.label}</div>
              </button>
            ))}
          </div>

          <form onSubmit={addSource} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label className="label-ss">Source Name</label>
              <input className="input-ss" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Product Catalog" required />
            </div>
            {(type === "url" || type === "sitemap") && (
              <div>
                <label className="label-ss">{type === "url" ? "URL" : "Sitemap URL"}</label>
                <input className="input-ss" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required />
              </div>
            )}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Adding..." : "Add Source"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#65736D" }}>Loading data sources...</div>
      ) : sources.length === 0 ? (
        <div className="card-ss" style={{ textAlign: "center", padding: "3rem" }}>
          <Database size={40} color="#DCE8E2" style={{ marginBottom: "1rem" }} />
          <h3 style={{ marginBottom: "0.5rem" }}>No data sources yet</h3>
          <p style={{ color: "#65736D", marginBottom: "1.5rem" }}>Add your first data source to start indexing content.</p>
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Add Source
          </button>
        </div>
      ) : (
        <div className="card-ss" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #DCE8E2", background: "#F7FAF8" }}>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Name</th>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Type</th>
                <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Status</th>
                <th style={{ textAlign: "right", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Records</th>
                <th style={{ textAlign: "right", padding: "0.875rem 1.25rem", color: "#65736D", fontWeight: 500 }}>Added</th>
                <th style={{ padding: "0.875rem 1.25rem" }} />
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #F0F5F2" }}>
                  <td style={{ padding: "0.875rem 1.25rem", fontWeight: 500, color: "#071F20" }}>{s.name}</td>
                  <td style={{ padding: "0.875rem 1.25rem", color: "#65736D", textTransform: "capitalize" }}>{s.type}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: s.status === "indexed" ? "#16C653" : s.status === "error" ? "#EF4444" : "#F59E0B", fontSize: "0.8125rem", fontWeight: 500 }}>
                      {statusIcon(s.status)} {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "right", color: "#65736D" }}>{(s.record_count || 0).toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "right", color: "#65736D" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                    <button onClick={() => deleteSource(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DCE8E2" }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
