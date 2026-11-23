"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Zap, Plus } from "lucide-react";
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

export default function Scope2Page() {
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: orgs } = await supabase.from("cb_organisations").select("id").eq("owner_id", user!.id);
      if (orgs && orgs.length > 0) {
        const { data } = await supabase.from("cb_emissions").select("*").eq("organisation_id", orgs[0].id).eq("scope", "scope2").order("activity_date", { ascending: false });
        setEmissions(data || []);
        setTotal((data || []).reduce((s, e) => s + (e.amount_tco2e || 0), 0));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B" }}>Scope 2 Emissions</h1>
            <span className="badge-scope2">Energy</span>
          </div>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Indirect emissions from purchased electricity, heating and cooling</p>
        </div>
        <Link href="/dashboard/activity-data" className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
          <Plus size={15} /> Add Scope 2 Data
        </Link>
      </div>

      <div style={{ background: "#7A5A00", borderRadius: "1rem", padding: "1.5rem 2rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Total Scope 2 Emissions</div>
          <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "2.25rem", color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>
            {total.toFixed(2)}
            <span style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(255,255,255,0.6)", marginLeft: "0.5rem" }}>tCO₂e</span>
          </div>
        </div>
        <Zap size={48} style={{ color: "rgba(217,173,85,0.4)" }} />
      </div>

      <div style={{ background: "#FDF5E0", border: "1px solid #F0E0A8", borderRadius: "1rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9rem", color: "#5A3A00", marginBottom: "0.75rem" }}>Scope 2 Sources</div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {["Purchased electricity", "District heating", "District cooling", "Purchased steam"].map((s) => (
            <span key={s} style={{ background: "#FDF5E0", border: "1px solid #F0E0A8", color: "#8B6B10", fontSize: "0.75rem", fontWeight: 500, padding: "0.3rem 0.75rem", borderRadius: "999px" }}>{s}</span>
          ))}
        </div>
      </div>

      {!loading && emissions.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center" }}>
          <Zap size={36} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "0.5rem" }}>No Scope 2 data recorded</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>
            Add energy consumption records for electricity, heating and cooling.
          </p>
          <Link href="/dashboard/activity-data" className="btn-primary"><Plus size={15} /> Add Scope 2 Data</Link>
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
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8375rem", fontWeight: 600, color: "#8B6B10", fontVariantNumeric: "tabular-nums" }}>{e.amount_tco2e?.toFixed(4)}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#5A6B61" }}>{new Date(e.activity_date).toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#FDF5E0", borderTop: "2px solid #F0E0A8" }}>
                  <td colSpan={4} style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 600, color: "#5A3A00" }}>Total</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 700, color: "#8B6B10", fontVariantNumeric: "tabular-nums" }}>{total.toFixed(4)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
