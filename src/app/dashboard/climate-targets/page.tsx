"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Target, Plus, AlertCircle } from "lucide-react";

interface ClimateTarget {
  id: string;
  name: string;
  target_type: string;
  baseline_year: number;
  target_year: number;
  reduction_pct: number;
  status: string;
  created_at: string;
}

export default function ClimateTargetsPage() {
  const [targets, setTargets] = useState<ClimateTarget[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", target_type: "net-zero", baseline_year: 2020, target_year: 2050, reduction_pct: 50, notes: "",
  });

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: orgData } = await supabase.from("cb_organisations").select("id, name").eq("owner_id", user!.id);
    setOrgs(orgData || []);
    if (orgData && orgData.length > 0) {
      setSelectedOrg(orgData[0].id);
      const { data: tData } = await supabase.from("cb_climate_targets").select("*").eq("organisation_id", orgData[0].id).order("target_year");
      setTargets(tData || []);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("cb_climate_targets").insert({
      organisation_id: selectedOrg,
      ...form,
      status: "active",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setForm({ name: "", target_type: "net-zero", baseline_year: 2020, target_year: 2050, reduction_pct: 50, notes: "" });
    setShowForm(false);
    setSaving(false);
    loadData();
  }

  const typeLabels: Record<string, string> = {
    "net-zero": "Net Zero",
    "sbti": "Science-Based Target",
    "carbon-neutral": "Carbon Neutral",
    "reduction": "Emission Reduction",
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Climate Targets</h1>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Set and track your organisation's emission reduction goals</p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Set Target
        </button>
      </div>

      {/* Important disclaimer */}
      <div style={{ background: "#FDF5E0", border: "1px solid #F0E0A8", borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1.5rem", fontSize: "0.825rem", color: "#5A3A00", lineHeight: 1.6 }}>
        <strong>Note:</strong> Setting a target does not constitute net zero or carbon neutrality. ClimateBooks tracks your targets and progress based on the emissions data you record. Actual achievement of a target requires verified reductions supported by measured activity data.
      </div>

      {showForm && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "1rem", padding: "1.75rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(11,53,43,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "1.25rem" }}>New Climate Target</h3>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <AlertCircle size={14} style={{ color: "#DC2626" }} />
              <span style={{ fontSize: "0.875rem", color: "#DC2626" }}>{error}</span>
            </div>
          )}
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label-cb">Target name</label>
              <input required className="input-cb" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Net Zero by 2050" />
            </div>
            <div>
              <label className="label-cb">Target type</label>
              <select className="input-cb" value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })}>
                {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label-cb">Reduction target (%)</label>
              <input type="number" required min={1} max={100} className="input-cb" value={form.reduction_pct} onChange={(e) => setForm({ ...form, reduction_pct: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label-cb">Baseline year</label>
              <input type="number" required min={1990} max={2030} className="input-cb" value={form.baseline_year} onChange={(e) => setForm({ ...form, baseline_year: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label-cb">Target year</label>
              <input type="number" required min={2025} max={2100} className="input-cb" value={form.target_year} onChange={(e) => setForm({ ...form, target_year: parseInt(e.target.value) })} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label-cb">Notes</label>
              <input className="input-cb" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Methodology, scope, commitments..." />
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Set Target"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[1,2].map((i) => <div key={i} style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", height: "100px" }} />)}
        </div>
      ) : targets.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3.5rem 2rem", textAlign: "center" }}>
          <Target size={40} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", marginBottom: "0.5rem" }}>No targets set</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>
            Set a reduction target to begin tracking progress toward your climate goals.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Set Target</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {targets.map((t) => (
            <div key={t.id} className="card-cb">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B" }}>{t.name}</span>
                    <span style={{ background: "#E8F2EC", color: "#174D36", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                      {typeLabels[t.target_type] || t.target_type}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.775rem", color: "#5A6B61" }}>
                    Baseline {t.baseline_year} → Target {t.target_year} · {t.reduction_pct}% reduction
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.5rem", color: "#174D36" }}>
                  {t.reduction_pct}%
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#5A6B61", marginBottom: "0.4rem" }}>
                  <span>Progress toward target</span>
                  <span>Data needed</span>
                </div>
                <div style={{ background: "#F0F5F2", borderRadius: "999px", height: "7px" }}>
                  <div style={{ width: "5%", height: "100%", borderRadius: "999px", background: "#174D36" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
