"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Leaf, TrendingDown, Plus } from "lucide-react";
import Link from "next/link";

export default function CarbonFootprintPage() {
  const [totals, setTotals] = useState({ scope1: 0, scope2: 0, scope3: 0 });
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: orgs } = await supabase.from("cb_organisations").select("id, name").eq("owner_id", user!.id);
      if (orgs && orgs.length > 0) {
        setOrgName(orgs[0].name);
        const { data } = await supabase.from("cb_emissions").select("scope, amount_tco2e").eq("organisation_id", orgs[0].id);
        const t = { scope1: 0, scope2: 0, scope3: 0 };
        (data || []).forEach((e) => {
          if (e.scope === "scope1") t.scope1 += e.amount_tco2e || 0;
          else if (e.scope === "scope2") t.scope2 += e.amount_tco2e || 0;
          else if (e.scope === "scope3") t.scope3 += e.amount_tco2e || 0;
        });
        setTotals(t);
      }
      setLoading(false);
    })();
  }, []);

  const grand = totals.scope1 + totals.scope2 + totals.scope3;
  const pct = (v: number) => grand > 0 ? Math.round((v / grand) * 100) : 0;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "900px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B" }}>Carbon Footprint</h1>
          {orgName && <span style={{ background: "#E8F2EC", color: "#174D36", fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.65rem", borderRadius: "999px" }}>{orgName}</span>}
        </div>
        <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Total greenhouse gas emissions measured in tonnes of CO₂ equivalent (tCO₂e)</p>
      </div>

      {/* Grand total */}
      <div style={{ background: "linear-gradient(135deg, #174D36 0%, #0B352B 100%)", borderRadius: "1.25rem", padding: "2.5rem 2rem", marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Total Carbon Footprint</div>
        <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "3.25rem", color: "#FFFFFF", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {loading ? "..." : grand.toFixed(2)}
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", marginTop: "0.3rem" }}>tCO₂e</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: "1rem" }}>
          Formula: Activity Quantity x Emission Factor (kgCO₂e/unit) / 1000
        </div>
      </div>

      {/* Scope breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Scope 1", desc: "Direct emissions", val: totals.scope1, color: "#174D36", bg: "#E8F2EC", href: "/dashboard/scope1", badge: "badge-scope1" },
          { label: "Scope 2", desc: "Energy indirect", val: totals.scope2, color: "#8B6B10", bg: "#FDF5E0", href: "/dashboard/scope2", badge: "badge-scope2" },
          { label: "Scope 3", desc: "Value chain", val: totals.scope3, color: "#2A4E8A", bg: "#EAF0F8", href: "/dashboard/scope3", badge: "badge-scope3" },
        ].map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <div className="card-cb" style={{ cursor: "pointer", transition: "box-shadow 0.15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <span className={s.badge}>{s.label}</span>
                <span style={{ fontSize: "0.75rem", color: s.color, fontWeight: 700 }}>{pct(s.val)}%</span>
              </div>
              <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", fontVariantNumeric: "tabular-nums" }}>
                {loading ? "..." : s.val.toFixed(2)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#5A6B61", marginTop: "0.15rem" }}>tCO₂e</div>
              <div style={{ background: "#F0F5F2", borderRadius: "999px", height: "4px", marginTop: "0.75rem" }}>
                <div style={{ width: `${pct(s.val)}%`, height: "100%", background: s.color, borderRadius: "999px" }} />
              </div>
              <div style={{ fontSize: "0.75rem", color: "#9BAF9A", marginTop: "0.4rem" }}>{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* GHG Protocol info */}
      <div className="card-cb" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "0.9375rem", color: "#0B352B", marginBottom: "0.75rem" }}>GHG Protocol Methodology</h3>
        <p style={{ fontSize: "0.8375rem", color: "#5A6B61", lineHeight: 1.65, marginBottom: "0.75rem" }}>
          Emissions are calculated following the GHG Protocol Corporate Accounting and Reporting Standard. Activity data is multiplied by the corresponding emission factor to produce tCO₂e values.
        </p>
        <div style={{ background: "#F7F8F3", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.8125rem", color: "#174D36" }}>
          tCO₂e = Activity Quantity (units) × Emission Factor (kgCO₂e/unit) ÷ 1000
        </div>
      </div>

      {grand === 0 && !loading && (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "2.5rem 2rem", textAlign: "center" }}>
          <Leaf size={36} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "0.5rem" }}>No emissions recorded yet</h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>
            Start by adding your activity data to calculate your organisation's carbon footprint.
          </p>
          <Link href="/dashboard/activity-data" className="btn-primary"><Plus size={15} /> Add Activity Data</Link>
        </div>
      )}
    </div>
  );
}
