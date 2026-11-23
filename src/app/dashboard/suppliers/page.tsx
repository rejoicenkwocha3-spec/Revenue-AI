"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, Mail, AlertCircle } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  country: string;
  status: string;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", contact_email: "", country: "", tier: "1", notes: "" });

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: orgData } = await supabase.from("cb_organisations").select("id, name").eq("owner_id", user!.id);
    setOrgs(orgData || []);
    if (orgData && orgData.length > 0) {
      setSelectedOrg(orgData[0].id);
      const { data: sData } = await supabase.from("cb_suppliers").select("*").eq("organisation_id", orgData[0].id).order("created_at", { ascending: false });
      setSuppliers(sData || []);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("cb_suppliers").insert({
      organisation_id: selectedOrg,
      ...form,
      status: "invited",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setForm({ name: "", contact_email: "", country: "", tier: "1", notes: "" });
    setShowForm(false);
    setSaving(false);
    loadData();
  }

  const statusColor: Record<string, string> = { invited: "#8B6B10", submitted: "#174D36", reviewed: "#2A4E8A", overdue: "#DC2626" };
  const statusBg: Record<string, string> = { invited: "#FDF5E0", submitted: "#E8F2EC", reviewed: "#EAF0F8", overdue: "#FEF2F2" };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Supplier Engagement</h1>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Collect sustainability data from your supply chain to manage Scope 3 Category 1 emissions</p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "1rem", padding: "1.75rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(11,53,43,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "1.25rem" }}>Add Supplier</h3>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <AlertCircle size={14} style={{ color: "#DC2626" }} />
              <span style={{ fontSize: "0.875rem", color: "#DC2626" }}>{error}</span>
            </div>
          )}
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="label-cb">Supplier name</label>
              <input required className="input-cb" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Supplier Company Ltd" />
            </div>
            <div>
              <label className="label-cb">Contact email</label>
              <input type="email" className="input-cb" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="sustainability@supplier.com" />
            </div>
            <div>
              <label className="label-cb">Country</label>
              <input className="input-cb" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="United Kingdom" />
            </div>
            <div>
              <label className="label-cb">Supply chain tier</label>
              <select className="input-cb" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                {["1", "2", "3"].map((t) => <option key={t} value={t}>Tier {t}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label-cb">Notes</label>
              <input className="input-cb" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Category of goods or services supplied..." />
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Adding..." : "Add Supplier"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", height: "72px" }} />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3.5rem 2rem", textAlign: "center" }}>
          <Users size={40} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", marginBottom: "0.5rem" }}>No suppliers added</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>
            Add your key suppliers to begin collecting their sustainability data.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Add Supplier</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {suppliers.map((s) => (
            <div key={s.id} className="card-cb" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 42, height: 42, borderRadius: "0.625rem", background: "#E8F2EC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Users size={18} style={{ color: "#174D36" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#0B352B" }}>{s.name}</div>
                {s.contact_email && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.775rem", color: "#5A6B61", marginTop: "0.15rem" }}>
                    <Mail size={11} /> {s.contact_email}
                  </div>
                )}
              </div>
              <span style={{ background: statusBg[s.status] || "#F7F8F3", color: statusColor[s.status] || "#5A6B61", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
