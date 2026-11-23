"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Plus, Upload, AlertCircle } from "lucide-react";

interface Doc {
  id: string;
  name: string;
  document_type: string;
  file_size: number;
  created_at: string;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", document_type: "evidence" });

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: orgs } = await supabase.from("cb_organisations").select("id").eq("owner_id", user!.id);
      if (orgs && orgs.length > 0) {
        setOrgId(orgs[0].id);
        const { data } = await supabase.from("cb_documents").select("*").eq("organisation_id", orgs[0].id).order("created_at", { ascending: false });
        setDocs(data || []);
      }
      setLoading(false);
    })();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("cb_documents").insert({ organisation_id: orgId, name: form.name, document_type: form.document_type });
    if (err) { setError(err.message); setSaving(false); return; }
    setForm({ name: "", document_type: "evidence" });
    setShowForm(false);
    setSaving(false);
    const { data } = await supabase.from("cb_documents").select("*").eq("organisation_id", orgId).order("created_at", { ascending: false });
    setDocs(data || []);
  }

  const typeLabels: Record<string, string> = {
    evidence: "Evidence",
    policy: "Policy",
    report: "Report",
    contract: "Contract",
    certificate: "Certificate",
    other: "Other",
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Documents</h1>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Store evidence, policies and reports supporting your sustainability disclosures</p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Document
        </button>
      </div>

      {showForm && (
        <div className="card-cb" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "1.25rem" }}>Add Document Record</h3>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <AlertCircle size={14} style={{ color: "#DC2626" }} /> <span style={{ fontSize: "0.875rem", color: "#DC2626" }}>{error}</span>
            </div>
          )}
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label-cb">Document name</label>
              <input required className="input-cb" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 2024 Annual Energy Audit Report" />
            </div>
            <div>
              <label className="label-cb">Document type</label>
              <select className="input-cb" value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}>
                {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ background: "#F7F8F3", border: "1.5px dashed #DDE8E2", borderRadius: "0.75rem", padding: "1.5rem", textAlign: "center" }}>
              <Upload size={22} style={{ color: "#9BAF9A", margin: "0 auto 0.5rem", display: "block" }} />
              <p style={{ fontSize: "0.8125rem", color: "#9BAF9A", margin: 0 }}>File upload coming soon. Record the document name and type now.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Record"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: "#FFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", height: "60px" }} />)}
        </div>
      ) : docs.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3.5rem 2rem", textAlign: "center" }}>
          <FileText size={40} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", marginBottom: "0.5rem" }}>No documents added</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>Record evidence files, policies and reports to support your disclosures.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Add Document</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {docs.map((d) => (
            <div key={d.id} className="card-cb" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 42, height: 42, borderRadius: "0.625rem", background: "#E8F2EC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={18} style={{ color: "#174D36" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#0B352B" }}>{d.name}</div>
                <div style={{ fontSize: "0.775rem", color: "#9BAF9A", marginTop: "0.1rem" }}>{new Date(d.created_at).toLocaleDateString("en-GB")}</div>
              </div>
              <span style={{ background: "#F7F8F3", color: "#5A6B61", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.65rem", borderRadius: "999px" }}>{typeLabels[d.document_type] || d.document_type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
