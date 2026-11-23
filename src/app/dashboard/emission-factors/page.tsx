"use client";

import { useState } from "react";
import { Search, Info } from "lucide-react";

interface EF {
  source: string;
  activity: string;
  unit: string;
  kgco2e: number;
  year: number;
  scope: string;
  notes: string;
}

const EF_DATA: EF[] = [
  { source: "DESNZ UK", activity: "Natural gas (gross CV)", unit: "kWh", kgco2e: 0.18254, year: 2024, scope: "Scope 1", notes: "UK grid factor, gross calorific value" },
  { source: "DESNZ UK", activity: "Grid electricity (UK)", unit: "kWh", kgco2e: 0.20493, year: 2024, scope: "Scope 2", notes: "UK grid average, location-based" },
  { source: "DESNZ UK", activity: "Diesel (road transport)", unit: "litre", kgco2e: 2.6889, year: 2024, scope: "Scope 1", notes: "Combustion only" },
  { source: "DESNZ UK", activity: "Petrol (road transport)", unit: "litre", kgco2e: 2.1512, year: 2024, scope: "Scope 1", notes: "Combustion only" },
  { source: "DESNZ UK", activity: "Aviation fuel (Jet A-1)", unit: "litre", kgco2e: 2.5455, year: 2024, scope: "Scope 1", notes: "Combustion, no uplift" },
  { source: "DESNZ UK", activity: "Short-haul flight economy", unit: "passenger-km", kgco2e: 0.15297, year: 2024, scope: "Scope 3", notes: "Includes radiative forcing (RF)" },
  { source: "DESNZ UK", activity: "Long-haul flight economy", unit: "passenger-km", kgco2e: 0.14788, year: 2024, scope: "Scope 3", notes: "Includes radiative forcing (RF)" },
  { source: "DESNZ UK", activity: "Average car (petrol)", unit: "km", kgco2e: 0.17049, year: 2024, scope: "Scope 1", notes: "Average petrol car" },
  { source: "DESNZ UK", activity: "Average car (diesel)", unit: "km", kgco2e: 0.16294, year: 2024, scope: "Scope 1", notes: "Average diesel car" },
  { source: "DESNZ UK", activity: "Average car (electric)", unit: "km", kgco2e: 0.04613, year: 2024, scope: "Scope 2", notes: "UK average electricity mix" },
  { source: "DESNZ UK", activity: "Rail travel (national)", unit: "passenger-km", kgco2e: 0.03549, year: 2024, scope: "Scope 3", notes: "National rail, UK" },
  { source: "DESNZ UK", activity: "Bus travel", unit: "passenger-km", kgco2e: 0.10278, year: 2024, scope: "Scope 3", notes: "Average local bus" },
  { source: "DESNZ UK", activity: "Refrigerant R-410A", unit: "kg", kgco2e: 2088, year: 2024, scope: "Scope 1", notes: "Direct leakage" },
  { source: "DESNZ UK", activity: "Refrigerant R-134a", unit: "kg", kgco2e: 1430, year: 2024, scope: "Scope 1", notes: "Direct leakage" },
  { source: "EPA US", activity: "Natural gas (US)", unit: "MMBtu", kgco2e: 53.07, year: 2023, scope: "Scope 1", notes: "US EPA eGRID factor" },
  { source: "EPA US", activity: "Grid electricity (US average)", unit: "MWh", kgco2e: 386.1, year: 2023, scope: "Scope 2", notes: "US national average" },
  { source: "IEA", activity: "Grid electricity (EU average)", unit: "kWh", kgco2e: 0.2275, year: 2022, scope: "Scope 2", notes: "IEA EU-27 average" },
  { source: "IEA", activity: "Grid electricity (global avg)", unit: "kWh", kgco2e: 0.4594, year: 2022, scope: "Scope 2", notes: "IEA world average" },
  { source: "GHG Protocol", activity: "Waste to landfill (mixed)", unit: "tonne", kgco2e: 467, year: 2023, scope: "Scope 3", notes: "Category 5 estimate" },
  { source: "GHG Protocol", activity: "Paper (office)", unit: "tonne", kgco2e: 907, year: 2023, scope: "Scope 3", notes: "Life-cycle, Category 1" },
];

const SCOPES = ["All scopes", "Scope 1", "Scope 2", "Scope 3"];
const SOURCES = ["All sources", "DESNZ UK", "EPA US", "IEA", "GHG Protocol"];

export default function EmissionFactorsPage() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("All scopes");
  const [source, setSource] = useState("All sources");

  const filtered = EF_DATA.filter((ef) => {
    const q = query.toLowerCase();
    const matchQ = !q || ef.activity.toLowerCase().includes(q) || ef.unit.toLowerCase().includes(q);
    const matchScope = scope === "All scopes" || ef.scope === scope;
    const matchSource = source === "All sources" || ef.source === source;
    return matchQ && matchScope && matchSource;
  });

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Emission Factors</h1>
        <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Reference emission factors from recognised sources. These are used to calculate your emissions from activity data.</p>
      </div>

      <div style={{ background: "#FDF5E0", border: "1px solid #F0E0A8", borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <Info size={15} style={{ color: "#8B6B10", flexShrink: 0, marginTop: "1px" }} />
        <p style={{ fontSize: "0.8125rem", color: "#5A3A00", lineHeight: 1.6, margin: 0 }}>
          Emission factors shown are for reference. Always verify against the latest published source for your reporting year. ClimateBooks does not invent emission factors. Sources: DESNZ (UK), EPA (US), IEA, GHG Protocol.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9BAF9A" }} />
          <input className="input-cb" placeholder="Search activities..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: "2.25rem" }} />
        </div>
        <select className="input-cb" style={{ flex: "0 0 auto" }} value={scope} onChange={(e) => setScope(e.target.value)}>
          {SCOPES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input-cb" style={{ flex: "0 0 auto" }} value={source} onChange={(e) => setSource(e.target.value)}>
          {SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "0.875rem", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F7F8F3", borderBottom: "1px solid #DDE8E2" }}>
                {["Activity", "Scope", "kgCO₂e / unit", "Unit", "Year", "Source", "Notes"].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#5A6B61", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#9BAF9A", fontSize: "0.875rem" }}>No emission factors match your filters.</td></tr>
              ) : filtered.map((ef, i) => (
                <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F0F5F2" : "none" }}>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8375rem", color: "#242B27", maxWidth: "220px" }}>{ef.activity}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span className={ef.scope === "Scope 1" ? "badge-scope1" : ef.scope === "Scope 2" ? "badge-scope2" : "badge-scope3"}>{ef.scope}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#174D36", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{ef.kgco2e}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#5A6B61" }}>{ef.unit}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#5A6B61" }}>{ef.year}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.775rem", color: "#5A6B61", whiteSpace: "nowrap" }}>{ef.source}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.775rem", color: "#9BAF9A", maxWidth: "180px" }}>{ef.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #F0F5F2", fontSize: "0.75rem", color: "#9BAF9A" }}>
          Showing {filtered.length} of {EF_DATA.length} factors
        </div>
      </div>
    </div>
  );
}
