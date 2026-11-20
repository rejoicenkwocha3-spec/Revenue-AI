"use client";

import { useEffect, useState } from "react";
import { Plus, FolderOpen, MoreVertical, Search, Trash2, Edit2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  record_count: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("search_projects")
      .select("*")
      .order("created_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated."); setSaving(false); return; }

    const { error: err } = await supabase.from("search_projects").insert({
      name: name.trim(),
      description: desc.trim() || null,
      user_id: user.id,
      status: "active",
    });

    if (err) { setError(err.message); setSaving(false); return; }
    setName(""); setDesc(""); setShowNew(false);
    await load();
    setSaving(false);
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const supabase = createClient();
    await supabase.from("search_projects").delete().eq("id", id);
    await load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Search Projects</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Organise your search experiences by project.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)} style={{ fontSize: "0.9rem" }}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* New project form */}
      {showNew && (
        <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Create New Project</h2>
          {error && <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#991B1B" }}>{error}</div>}
          <form onSubmit={createProject} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label className="label-ss">Project Name</label>
              <input className="input-ss" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Search Project" required />
            </div>
            <div>
              <label className="label-ss">Description (optional)</label>
              <input className="input-ss" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What does this project search?" />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Creating..." : "Create Project"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Projects list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#65736D" }}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="card-ss" style={{ textAlign: "center", padding: "3rem" }}>
          <FolderOpen size={40} color="#DCE8E2" style={{ marginBottom: "1rem" }} />
          <h3 style={{ marginBottom: "0.5rem" }}>No projects yet</h3>
          <p style={{ color: "#65736D", marginBottom: "1.5rem" }}>Create your first search project to get started.</p>
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {projects.map((p) => (
            <div key={p.id} className="card-ss" style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: "0.625rem", background: "#E8F8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Search size={20} color="#16C653" />
                </div>
                <button onClick={() => deleteProject(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DCE8E2", padding: "0.25rem" }}>
                  <Trash2 size={15} />
                </button>
              </div>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.375rem" }}>{p.name}</h3>
              <p style={{ color: "#65736D", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "1rem" }}>
                {p.description || "No description provided."}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "2rem", background: p.status === "active" ? "#E8F8EE" : "#F3F4F6", color: p.status === "active" ? "#16C653" : "#65736D", fontWeight: 500 }}>
                  {p.status}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "#65736D" }}>
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
