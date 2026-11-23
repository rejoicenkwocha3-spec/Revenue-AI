"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, Plus, Edit2, MapPin, ChevronRight, AlertCircle } from "lucide-react";

interface Organisation {
  id: string;
  name: string;
  industry: string;
  country: string;
  reporting_year: number;
  created_at: string;
}

export default function OrganisationsPage() {
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", industry: "", country: "", reporting_year: new Date().getFullYear() });

  const supabase = createClient();

  useEffect(() => {
    loadOrgs();
  }, []);

  async function loadOrgs() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("cb_organisations")
      .select("*")
      .eq("owner_id", user!.id)
      .order("created_at", { ascending: false });
    setOrgs(data || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error: err } = await supabase.from("cb_organisations").insert({
      owner_id: user!.id,
      ...form,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setForm({ name: "", industry: "", country: "", reporting_year: new Date().getFullYear() });
    setShowForm(false);
    setSaving(false);
    loadOrgs();
  }

  const industries = ["Agriculture", "Construction", "Energy", "Finance", "Healthcare", "Hospitality", "Manufacturing", "Professional Services", "Real Estate", "Retail", "Technology", "Transport and Logistics", "Waste Management", "Other"];

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Organisations</h1>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Manage the organisations you are measuring emissions for</p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Organisation
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "1rem", padding: "1.75rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(11,53,43,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "1.25rem" }}>New Organisation</h3>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <AlertCircle size={14} style={{ color: "#DC2626" }} />
              <span style={{ fontSize: "0.875rem", color: "#DC2626" }}>{error}</span>
            </div>
          )}
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label-cb">Organisation name</label>
              <input required className="input-cb" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corporation" />
            </div>
            <div>
              <label className="label-cb">Industry</label>
              <select className="input-cb" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                <option value="">Select industry</option>
                {industries.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label-cb">Country</label>
              <input className="input-cb" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="United Kingdom" />
            </div>
            <div>
              <label className="label-cb">Reporting year</label>
              <input type="number" className="input-cb" value={form.reporting_year} onChange={(e) => setForm({ ...form, reporting_year: parseInt(e.target.value) })} min={2000} max={2100} />
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Creating..." : "Create Organisation"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[1,2].map((i) => <div key={i} style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", height: "80px", animation: "pulse 1.5s infinite" }} />)}
        </div>
      ) : orgs.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3.5rem 2rem", textAlign: "center" }}>
          <Building2 size={40} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", marginBottom: "0.5rem" }}>No organisations yet</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>
            Create your first organisation to begin measuring emissions.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Create Organisation
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {orgs.map((org) => (
            <div key={org.id} className="card-cb" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: "0.625rem", background: "#E8F2EC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Building2 size={20} style={{ color: "#174D36" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#0B352B" }}>{org.name}</div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                  {org.industry && <span style={{ fontSize: "0.75rem", color: "#5A6B61" }}>{org.industry}</span>}
                  {org.country && (
                    <span style={{ display: "flex", gap: "0.25rem", alignItems: "center", fontSize: "0.75rem", color: "#5A6B61" }}>
                      <MapPin size={11} /> {org.country}
                    </span>
                  )}
                  <span style={{ fontSize: "0.75rem", color: "#5A6B61" }}>Reporting year: {org.reporting_year}</span>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "#DDE8E2" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
