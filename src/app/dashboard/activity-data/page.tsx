"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, AlertCircle, ClipboardList } from "lucide-react";

interface ActivityRecord {
  id: string;
  description: string;
  scope: string;
  category: string;
  quantity: number;
  unit: string;
  emission_factor: number;
  amount_tco2e: number;
  activity_date: string;
}

const SCOPES = [
  { value: "scope1", label: "Scope 1 — Direct" },
  { value: "scope2", label: "Scope 2 — Energy" },
  { value: "scope3", label: "Scope 3 — Value chain" },
];

const CATEGORIES: Record<string, string[]> = {
  scope1: ["Fuel combustion (natural gas)", "Fuel combustion (diesel)", "Company vehicles (petrol)", "Company vehicles (diesel)", "Refrigerant leakage", "Industrial process", "On-site combustion"],
  scope2: ["Purchased electricity", "District heating", "District cooling", "Purchased steam"],
  scope3: ["Business travel (air)", "Business travel (rail)", "Employee commuting", "Purchased goods and services", "Capital goods", "Waste", "Water", "Upstream transport", "Downstream transport", "Investments"],
};

const UNITS = ["kWh", "MWh", "GJ", "litres", "m³", "kg", "tonnes", "km", "miles", "night", "passenger-km", "tonne-km"];

export default function ActivityDataPage() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    description: "", scope: "scope1", category: "", quantity: "", unit: "kWh",
    emission_factor: "", ef_source: "", activity_date: new Date().toISOString().split("T")[0],
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedOrg) loadRecords(selectedOrg);
  }, [selectedOrg]);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: orgData } = await supabase.from("cb_organisations").select("id, name").eq("owner_id", user!.id);
    setOrgs(orgData || []);
    if (orgData && orgData.length > 0) {
      setSelectedOrg(orgData[0].id);
      await loadRecords(orgData[0].id);
    }
    setLoading(false);
  }

  async function loadRecords(orgId: string) {
    const { data } = await supabase
      .from("cb_emissions")
      .select("*")
      .eq("organisation_id", orgId)
      .order("activity_date", { ascending: false })
      .limit(50);
    setRecords(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg) { setError("Select an organisation first."); return; }
    setSaving(true);
    setError("");

    const qty = parseFloat(form.quantity);
    const ef = parseFloat(form.emission_factor);
    const amount_tco2e = (qty * ef) / 1000;

    const { error: err } = await supabase.from("cb_emissions").insert({
      organisation_id: selectedOrg,
      description: form.description,
      scope: form.scope,
      category: form.category,
      quantity: qty,
      unit: form.unit,
      emission_factor: ef,
      ef_source: form.ef_source,
      amount_tco2e,
      activity_date: form.activity_date,
    });

    if (err) { setError(err.message); setSaving(false); return; }
    setForm({ description: "", scope: "scope1", category: "", quantity: "", unit: "kWh", emission_factor: "", ef_source: "", activity_date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
    setSaving(false);
    loadRecords(selectedOrg);
  }

  const scopeColor: Record<string, string> = { scope1: "#174D36", scope2: "#8B6B10", scope3: "#2A4E8A" };
  const scopeBg: Record<string, string> = { scope1: "#E8F2EC", scope2: "#FDF5E0", scope3: "#EAF0F8" };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Activity Data</h1>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Enter activity data to calculate greenhouse gas emissions</p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Activity
        </button>
      </div>

      {/* Org selector */}
      {orgs.length > 1 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="label-cb">Organisation</label>
          <select className="input-cb" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} style={{ maxWidth: "320px" }}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "1rem", padding: "1.75rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(11,53,43,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "1.25rem" }}>New Activity Record</h3>
          <div style={{ background: "#FDF5E0", border: "1px solid #F0E0A8", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#5A3A00" }}>
            Emissions are calculated as: Activity Quantity × Emission Factor ÷ 1000 = tCO₂e
          </div>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <AlertCircle size={14} style={{ color: "#DC2626" }} /> <span style={{ fontSize: "0.875rem", color: "#DC2626" }}>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label-cb">Description</label>
              <input required className="input-cb" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Natural gas boiler — Head Office" />
            </div>
            <div>
              <label className="label-cb">Scope</label>
              <select required className="input-cb" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value, category: "" })}>
                {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label-cb">Category</label>
              <select className="input-cb" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {(CATEGORIES[form.scope] || []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-cb">Activity date</label>
              <input type="date" required className="input-cb" value={form.activity_date} onChange={(e) => setForm({ ...form, activity_date: e.target.value })} />
            </div>
            <div>
              <label className="label-cb">Quantity</label>
              <input type="number" required min="0" step="any" className="input-cb" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="label-cb">Unit</label>
              <select required className="input-cb" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label-cb">Emission factor (kgCO₂e per unit)</label>
              <input type="number" required min="0" step="any" className="input-cb" value={form.emission_factor} onChange={(e) => setForm({ ...form, emission_factor: e.target.value })} placeholder="0.000" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label-cb">Emission factor source</label>
              <input className="input-cb" value={form.ef_source} onChange={(e) => setForm({ ...form, ef_source: e.target.value })} placeholder="e.g. DEFRA 2024, IPCC AR6, EPA 2023" />
            </div>
            {form.quantity && form.emission_factor && (
              <div style={{ gridColumn: "1/-1", background: "#E8F2EC", border: "1px solid #A8C9B2", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#174D36", fontWeight: 500 }}>
                Calculated result: {((parseFloat(form.quantity) * parseFloat(form.emission_factor)) / 1000).toFixed(4)} tCO₂e
              </div>
            )}
            <div style={{ gridColumn: "1/-1", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setError(""); }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Activity"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Records table */}
      {!loading && records.length === 0 && !showForm ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3.5rem 2rem", textAlign: "center" }}>
          <ClipboardList size={40} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", marginBottom: "0.5rem" }}>No activity data yet</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>
            Add your first activity record to begin calculating emissions.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Add Activity</button>
        </div>
      ) : records.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F7F8F3", borderBottom: "1px solid #DDE8E2" }}>
                  {["Description", "Scope", "Category", "Quantity", "EF (kgCO₂e/unit)", "Result (tCO₂e)", "Date"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#5A6B61", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < records.length - 1 ? "1px solid #F0F5F2" : "none" }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8375rem", color: "#242B27", maxWidth: "200px" }}>{r.description}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ background: scopeBg[r.scope], color: scopeColor[r.scope], fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px" }}>
                        {r.scope.replace("scope", "Scope ")}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#5A6B61" }}>{r.category}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#242B27", fontVariantNumeric: "tabular-nums" }}>{r.quantity?.toLocaleString()} {r.unit}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#242B27", fontVariantNumeric: "tabular-nums" }}>{r.emission_factor}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8375rem", fontWeight: 600, color: "#174D36", fontVariantNumeric: "tabular-nums" }}>{r.amount_tco2e?.toFixed(4)}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#5A6B61", whiteSpace: "nowrap" }}>{new Date(r.activity_date).toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
