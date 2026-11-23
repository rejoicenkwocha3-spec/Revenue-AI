"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Plus, Download, AlertCircle } from "lucide-react";

interface Report {
  id: string;
  name: string;
  framework: string;
  reporting_year: number;
  status: string;
  created_at: string;
}

const FRAMEWORKS = ["GHG Protocol", "CDP", "CSRD / ESRS", "ISSB", "SECR", "Internal Report"];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", framework: "GHG Protocol", reporting_year: new Date().getFullYear() });

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: orgData } = await supabase.from("cb_organisations").select("id, name").eq("owner_id", user!.id);
    setOrgs(orgData || []);
    if (orgData && orgData.length > 0) {
      setSelectedOrg(orgData[0].id);
      const { data: reportData } = await supabase.from("cb_reports").select("*").eq("organisation_id", orgData[0].id).order("created_at", { ascending: false });
      setReports(reportData || []);
    }
    setLoading(false);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg) return;
    setGenerating(true);
    setError("");

    const { data: emissions } = await supabase.from("cb_emissions").select("scope, amount_tco2e").eq("organisation_id", selectedOrg);
    const summary = { scope1: 0, scope2: 0, scope3: 0, total: 0 };
    (emissions || []).forEach((e) => {
      if (e.scope === "scope1") summary.scope1 += e.amount_tco2e;
      if (e.scope === "scope2") summary.scope2 += e.amount_tco2e;
      if (e.scope === "scope3") summary.scope3 += e.amount_tco2e;
    });
    summary.total = summary.scope1 + summary.scope2 + summary.scope3;

    const { error: err } = await supabase.from("cb_reports").insert({
      organisation_id: selectedOrg,
      name: form.name || `${form.framework} Report ${form.reporting_year}`,
      framework: form.framework,
      reporting_year: form.reporting_year,
      status: "draft",
      scope1_total: summary.scope1,
      scope2_total: summary.scope2,
      scope3_total: summary.scope3,
      total_emissions: summary.total,
    });

    if (err) { setError(err.message); setGenerating(false); return; }
    setForm({ name: "", framework: "GHG Protocol", reporting_year: new Date().getFullYear() });
    setShowForm(false);
    setGenerating(false);
    loadData();
  }

  const statusColor: Record<string, string> = {
    draft: "#8B6B10",
    final: "#174D36",
    submitted: "#2A4E8A",
  };
  const statusBg: Record<string, string> = {
    draft: "#FDF5E0",
    final: "#E8F2EC",
    submitted: "#EAF0F8",
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Reports</h1>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Generate sustainability reports aligned with recognised disclosure frameworks</p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Generate Report
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "1rem", padding: "1.75rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(11,53,43,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "1.25rem" }}>Generate New Report</h3>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <AlertCircle size={14} style={{ color: "#DC2626" }} />
              <span style={{ fontSize: "0.875rem", color: "#DC2626" }}>{error}</span>
            </div>
          )}
          <form onSubmit={handleGenerate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="label-cb">Report name (optional)</label>
              <input className="input-cb" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Annual GHG Report 2025" />
            </div>
            <div>
              <label className="label-cb">Reporting framework</label>
              <select required className="input-cb" value={form.framework} onChange={(e) => setForm({ ...form, framework: e.target.value })}>
                {FRAMEWORKS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="label-cb">Reporting year</label>
              <input type="number" required className="input-cb" value={form.reporting_year} onChange={(e) => setForm({ ...form, reporting_year: parseInt(e.target.value) })} min={2000} max={2100} />
            </div>
            {orgs.length > 1 && (
              <div>
                <label className="label-cb">Organisation</label>
                <select className="input-cb" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: "1/-1", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={generating}>{generating ? "Generating..." : "Generate Report"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[1,2].map((i) => <div key={i} style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", height: "80px" }} />)}
        </div>
      ) : reports.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3.5rem 2rem", textAlign: "center" }}>
          <FileText size={40} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", marginBottom: "0.5rem" }}>No reports yet</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>Generate your first sustainability report from your emissions data.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Generate Report</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {reports.map((r) => (
            <div key={r.id} className="card-cb" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: "0.625rem", background: "#E8F2EC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={20} style={{ color: "#174D36" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#0B352B" }}>{r.name}</span>
                  <span style={{ background: statusBg[r.status] || "#F7F8F3", color: statusColor[r.status] || "#5A6B61", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                    {r.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.775rem", color: "#5A6B61" }}>
                  {r.framework} · {r.reporting_year} · Created {new Date(r.created_at).toLocaleDateString("en-GB")}
                </div>
              </div>
              <button
                className="btn-ghost"
                style={{ fontSize: "0.75rem", padding: "0.375rem 0.875rem", display: "flex", gap: "0.375rem", alignItems: "center" }}
                onClick={() => alert("PDF export requires document generation service integration.")}
              >
                <Download size={13} /> Export
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
