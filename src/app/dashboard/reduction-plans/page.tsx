"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingDown, Plus, AlertCircle, CheckCircle2 } from "lucide-react";

interface Initiative {
  id: string;
  name: string;
  description: string;
  scope: string;
  status: string;
  estimated_reduction_tco2e: number;
  target_date: string;
  created_at: string;
}

export default function ReductionPlansPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState("");
  const [form, setForm] = useState({ name: "", description: "", scope: "scope1", status: "planned", estimated_reduction_tco2e: "", target_date: "" });

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: orgs } = await supabase.from("cb_organisations").select("id").eq("owner_id", user!.id);
    if (orgs && orgs.length > 0) {
      setOrgId(orgs[0].id);
      const { data } = await supabase.from("cb_reduction_initiatives").select("*").eq("organisation_id", orgs[0].id).order("created_at", { ascending: false });
      setInitiatives(data || []);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("cb_reduction_initiatives").insert({
      organisation_id: orgId,
      name: form.name,
      description: form.description,
      scope: form.scope,
      status: form.status,
      estimated_reduction_tco2e: form.estimated_reduction_tco2e ? parseFloat(form.estimated_reduction_tco2e) : null,
      target_date: form.target_date || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setForm({ name: "", description: "", scope: "scope1", status: "planned", estimated_reduction_tco2e: "", target_date: "" });
    setShowForm(false);
    setSaving(false);
    loadData();
  }

  const statusColors: Record<string, [string, string]> = {
    planned: ["#FDF5E0", "#8B6B10"],
    "in-progress": ["#EAF0F8", "#2A4E8A"],
    completed: ["#E8F2EC", "#174D36"],
    cancelled: ["#FEF2F2", "#DC2626"],
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Reduction Plans</h1>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Track decarbonisation initiatives and their estimated impact on your carbon footprint</p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Initiative
        </button>
      </div>

      {showForm && (
        <div className="card-cb" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "1.25rem" }}>New Reduction Initiative</h3>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <AlertCircle size={14} style={{ color: "#DC2626" }} />
              <span style={{ fontSize: "0.875rem", color: "#DC2626" }}>{error}</span>
            </div>
          )}
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label-cb">Initiative name</label>
              <input required className="input-cb" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Switch to renewable electricity" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label-cb">Description</label>
              <input className="input-cb" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the initiative..." />
            </div>
            <div>
              <label className="label-cb">Scope</label>
              <select className="input-cb" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                <option value="scope1">Scope 1 — Direct</option>
                <option value="scope2">Scope 2 — Energy</option>
                <option value="scope3">Scope 3 — Value chain</option>
              </select>
            </div>
            <div>
              <label className="label-cb">Status</label>
              <select className="input-cb" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="planned">Planned</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label-cb">Estimated reduction (tCO₂e)</label>
              <input type="number" min="0" step="0.01" className="input-cb" value={form.estimated_reduction_tco2e} onChange={(e) => setForm({ ...form, estimated_reduction_tco2e: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="label-cb">Target date</label>
              <input type="date" className="input-cb" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Add Initiative"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: "#FFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", height: "72px" }} />)}
        </div>
      ) : initiatives.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3.5rem 2rem", textAlign: "center" }}>
          <TrendingDown size={40} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", marginBottom: "0.5rem" }}>No reduction plans added</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "380px", margin: "0 auto 1.5rem" }}>
            Create your first decarbonisation initiative to begin tracking your path to lower emissions.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Add Initiative</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {initiatives.map((ini) => {
            const [sbg, sfg] = statusColors[ini.status] || ["#F7F8F3", "#5A6B61"];
            return (
              <div key={ini.id} className="card-cb">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#0B352B" }}>{ini.name}</span>
                      <span className={ini.scope === "scope1" ? "badge-scope1" : ini.scope === "scope2" ? "badge-scope2" : "badge-scope3"}>{ini.scope}</span>
                    </div>
                    {ini.description && <p style={{ fontSize: "0.8125rem", color: "#5A6B61", margin: 0 }}>{ini.description}</p>}
                    {ini.target_date && (
                      <div style={{ fontSize: "0.75rem", color: "#9BAF9A", marginTop: "0.3rem" }}>
                        Target: {new Date(ini.target_date).toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
                    <span style={{ background: sbg, color: sfg, fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: "999px" }}>{ini.status}</span>
                    {ini.estimated_reduction_tco2e && (
                      <span style={{ fontSize: "0.775rem", color: "#174D36", fontWeight: 600 }}>
                        -{ini.estimated_reduction_tco2e.toFixed(2)} tCO₂e
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
