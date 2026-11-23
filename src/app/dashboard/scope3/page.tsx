"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Factory, Plus } from "lucide-react";
import Link from "next/link";

interface Emission {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  emission_factor: number;
  amount_tco2e: number;
  activity_date: string;
}

const SCOPE3_CATEGORIES = [
  "Purchased goods and services",
  "Capital goods",
  "Fuel and energy-related activities",
  "Upstream transportation and distribution",
  "Waste generated in operations",
  "Business travel",
  "Employee commuting",
  "Upstream leased assets",
  "Downstream transportation and distribution",
  "Processing of sold products",
  "Use of sold products",
  "End-of-life treatment of sold products",
  "Downstream leased assets",
  "Franchises",
  "Investments",
];

export default function Scope3Page() {
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: orgs } = await supabase.from("cb_organisations").select("id").eq("owner_id", user!.id);
      if (orgs && orgs.length > 0) {
        const { data } = await supabase.from("cb_emissions").select("*").eq("organisation_id", orgs[0].id).eq("scope", "scope3").order("activity_date", { ascending: false });
        const rows = data || [];
        setEmissions(rows);
        setTotal(rows.reduce((s, e) => s + (e.amount_tco2e || 0), 0));
        const cat: Record<string, number> = {};
        rows.forEach((e) => { cat[e.category] = (cat[e.category] || 0) + (e.amount_tco2e || 0); });
        setByCategory(cat);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B" }}>Scope 3 Emissions</h1>
            <span className="badge-scope3">Value Chain</span>
          </div>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Indirect value chain emissions across all 15 GHG Protocol Scope 3 categories</p>
        </div>
        <Link href="/dashboard/activity-data" className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
          <Plus size={15} /> Add Scope 3 Data
        </Link>
      </div>

      <div style={{ background: "#1A3A6B", borderRadius: "1rem", padding: "1.5rem 2rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Total Scope 3 Emissions</div>
          <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "2.25rem", color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>
            {total.toFixed(2)}
            <span style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(255,255,255,0.6)", marginLeft: "0.5rem" }}>tCO₂e</span>
          </div>
        </div>
        <Factory size={48} style={{ color: "rgba(100,150,255,0.3)" }} />
      </div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="card-cb" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B", marginBottom: "1rem" }}>Emissions by Category</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {Object.entries(byCategory).sort(([, a], [, b]) => b - a).map(([cat, val]) => (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.3rem" }}>
                  <span style={{ color: "#242B27" }}>{cat}</span>
                  <span style={{ color: "#2A4E8A", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{val.toFixed(3)} tCO₂e</span>
                </div>
                <div style={{ background: "#EAF0F8", borderRadius: "999px", height: "5px" }}>
                  <div style={{ width: total > 0 ? `${(val / total) * 100}%` : "0%", height: "100%", borderRadius: "999px", background: "#2A4E8A" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories grid */}
      <div style={{ background: "#EAF0F8", border: "1px solid #C5D8F0", borderRadius: "1rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9rem", color: "#1A3A6B", marginBottom: "0.75rem" }}>All 15 Scope 3 Categories</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.4rem" }}>
          {SCOPE3_CATEGORIES.map((cat, i) => (
            <div key={cat} style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.775rem", color: "#242B27" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#2A4E8A", width: 18, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
              {cat}
            </div>
          ))}
        </div>
      </div>

      {!loading && emissions.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center" }}>
          <Factory size={36} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "0.5rem" }}>No Scope 3 data recorded</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "400px", margin: "0 auto 1.5rem" }}>
            Add value chain emission records across any of the 15 Scope 3 categories.
          </p>
          <Link href="/dashboard/activity-data" className="btn-primary"><Plus size={15} /> Add Scope 3 Data</Link>
        </div>
      ) : emissions.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F7F8F3", borderBottom: "1px solid #DDE8E2" }}>
                  {["Description", "Category", "Quantity", "EF", "tCO₂e", "Date"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#5A6B61" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emissions.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: i < emissions.length - 1 ? "1px solid #F0F5F2" : "none" }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8375rem", color: "#242B27" }}>{e.description}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#5A6B61" }}>{e.category}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#242B27", fontVariantNumeric: "tabular-nums" }}>{e.quantity?.toLocaleString()} {e.unit}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#5A6B61", fontVariantNumeric: "tabular-nums" }}>{e.emission_factor}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8375rem", fontWeight: 600, color: "#2A4E8A", fontVariantNumeric: "tabular-nums" }}>{e.amount_tco2e?.toFixed(4)}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#5A6B61" }}>{new Date(e.activity_date).toLocaleDateString("en-GB")}</td>
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
