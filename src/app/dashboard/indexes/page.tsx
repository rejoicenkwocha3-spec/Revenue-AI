"use client";

import { useEffect, useState } from "react";
import { Plus, Layers, Search, Trash2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Index {
  id: string;
  name: string;
  record_count: number;
  status: string;
  created_at: string;
  searchable_attributes: string[];
}

export default function IndexesPage() {
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [attrs, setAttrs] = useState("title, description, content");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("search_indexes").select("*").order("created_at", { ascending: false });
    setIndexes(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createIndex(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from("search_indexes").insert({
      name: name.trim(),
      user_id: user.id,
      status: "active",
      record_count: 0,
      searchable_attributes: attrs.split(",").map((a) => a.trim()),
    });

    if (!error) { setName(""); setAttrs("title, description, content"); setShowNew(false); await load(); }
    setSaving(false);
  }

  async function deleteIndex(id: string) {
    if (!confirm("Delete this index and all its records?")) return;
    const supabase = createClient();
    await supabase.from("search_indexes").delete().eq("id", id);
    await load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Search Indexes</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Create and manage indexes that power your search experiences.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)} style={{ fontSize: "0.9rem" }}>
          <Plus size={16} /> New Index
        </button>
      </div>

      {showNew && (
        <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Create Index</h2>
          <form onSubmit={createIndex} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label className="label-ss">Index Name</label>
              <input className="input-ss" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. products" required />
            </div>
            <div>
              <label className="label-ss">Searchable Attributes (comma-separated)</label>
              <input className="input-ss" value={attrs} onChange={(e) => setAttrs(e.target.value)} placeholder="title, description, tags" />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Creating..." : "Create Index"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#65736D" }}>Loading indexes...</div>
      ) : indexes.length === 0 ? (
        <div className="card-ss" style={{ textAlign: "center", padding: "3rem" }}>
          <Layers size={40} color="#DCE8E2" style={{ marginBottom: "1rem" }} />
          <h3 style={{ marginBottom: "0.5rem" }}>No indexes yet</h3>
          <p style={{ color: "#65736D", marginBottom: "1.5rem" }}>Create your first search index to start storing and searching records.</p>
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Create Index
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {indexes.map((idx) => (
            <div key={idx.id} className="card-ss">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: "0.625rem", background: "#E8F8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Layers size={20} color="#16C653" />
                </div>
                <button onClick={() => deleteIndex(idx.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DCE8E2" }}>
                  <Trash2 size={15} />
                </button>
              </div>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{idx.name}</h3>
              <div style={{ fontSize: "0.8125rem", color: "#65736D", marginBottom: "1rem" }}>
                {(idx.record_count || 0).toLocaleString()} records
              </div>
              {idx.searchable_attributes && idx.searchable_attributes.length > 0 && (
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  {idx.searchable_attributes.slice(0, 4).map((a) => (
                    <span key={a} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", background: "#F7FAF8", border: "1px solid #DCE8E2", color: "#65736D" }}>{a}</span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "2rem", background: "#E8F8EE", color: "#16C653", fontWeight: 500 }}>
                  {idx.status}
                </span>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "#16C653", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem" }}>
                  <RefreshCw size={13} /> Reindex
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
