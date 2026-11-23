import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BarChart3, Leaf, Zap, Factory, TrendingDown, ArrowUpRight, AlertCircle, Plus } from "lucide-react";

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real data
  const { data: organisations } = await supabase
    .from("cb_organisations")
    .select("id, name")
    .eq("owner_id", user!.id)
    .limit(5);

  const { data: emissions } = await supabase
    .from("cb_emissions")
    .select("scope, amount_tco2e, activity_date")
    .in("organisation_id", (organisations || []).map((o) => o.id));

  const { data: targets } = await supabase
    .from("cb_climate_targets")
    .select("name, target_year, reduction_pct, status")
    .in("organisation_id", (organisations || []).map((o) => o.id))
    .limit(3);

  // Aggregate
  const scope1 = (emissions || []).filter((e) => e.scope === "scope1").reduce((s, e) => s + (e.amount_tco2e || 0), 0);
  const scope2 = (emissions || []).filter((e) => e.scope === "scope2").reduce((s, e) => s + (e.amount_tco2e || 0), 0);
  const scope3 = (emissions || []).filter((e) => e.scope === "scope3").reduce((s, e) => s + (e.amount_tco2e || 0), 0);
  const total = scope1 + scope2 + scope3;
  const hasData = total > 0;

  const stats = [
    { label: "Total Emissions", value: hasData ? total.toFixed(1) : "—", unit: "tCO₂e", icon: Leaf, color: "#174D36", bg: "#E8F2EC", change: null },
    { label: "Scope 1", value: hasData ? scope1.toFixed(1) : "—", unit: "tCO₂e", icon: BarChart3, color: "#174D36", bg: "#E8F2EC", scope: "scope1" },
    { label: "Scope 2", value: hasData ? scope2.toFixed(1) : "—", unit: "tCO₂e", icon: Zap, color: "#8B6B10", bg: "#FDF5E0", scope: "scope2" },
    { label: "Scope 3", value: hasData ? scope3.toFixed(1) : "—", unit: "tCO₂e", icon: Factory, color: "#2A4E8A", bg: "#EAF0F8", scope: "scope3" },
  ];

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>
            Emissions Overview
          </h1>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>
            {organisations && organisations.length > 0
              ? `Showing data for ${organisations.length} organisation${organisations.length > 1 ? "s" : ""}`
              : "Set up your first organisation to begin tracking emissions"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/dashboard/activity-data" className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
            <Plus size={15} /> Add Activity Data
          </Link>
        </div>
      </div>

      {/* No org state */}
      {(!organisations || organisations.length === 0) && (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8E2", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 52, height: 52, background: "#E8F2EC", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <BarChart3 size={24} style={{ color: "#174D36" }} />
          </div>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", marginBottom: "0.5rem" }}>
            Create your first organisation
          </h3>
          <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "400px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            Set up your organisation to begin measuring Scope 1, 2 and 3 emissions and generating climate reports.
          </p>
          <Link href="/dashboard/organisations" className="btn-primary">
            <Plus size={15} /> Create Organisation
          </Link>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-tile">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "#5A6B61", fontWeight: 500 }}>{s.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: "0.4rem", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.75rem", color: s.color, fontVariantNumeric: "tabular-nums" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#5A6B61", marginTop: "0.25rem" }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Chart + targets grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Emissions bar chart */}
        <div className="card-cb">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B" }}>Emissions by Scope</h3>
            {!hasData && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#5A6B61" }}>
                <AlertCircle size={13} style={{ color: "#D9AD55" }} />
                No data yet
              </div>
            )}
          </div>
          {hasData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "Scope 1 — Direct", value: scope1, color: "#174D36" },
                { label: "Scope 2 — Energy", value: scope2, color: "#D9AD55" },
                { label: "Scope 3 — Value chain", value: scope3, color: "#2A4E8A" },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.8125rem", color: "#5A6B61" }}>{item.label}</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0B352B", fontVariantNumeric: "tabular-nums" }}>
                      {item.value.toFixed(1)} tCO₂e
                    </span>
                  </div>
                  <div style={{ background: "#F0F5F2", borderRadius: "999px", height: "8px" }}>
                    <div style={{ width: total > 0 ? `${(item.value / total) * 100}%` : "0%", height: "100%", borderRadius: "999px", background: item.color, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: "#F7F8F3", borderRadius: "0.75rem", padding: "2rem", textAlign: "center", color: "#5A6B61", fontSize: "0.875rem" }}>
              Add activity data to see your emissions breakdown
            </div>
          )}
        </div>

        {/* Climate targets */}
        <div className="card-cb">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B" }}>Climate Targets</h3>
            <Link href="/dashboard/climate-targets" style={{ color: "#174D36", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.2rem" }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {targets && targets.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {targets.map((t) => (
                <div key={t.name} style={{ padding: "0.75rem", background: "#F7F8F3", borderRadius: "0.5rem" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0B352B", marginBottom: "0.25rem" }}>{t.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#5A6B61" }}>{t.reduction_pct}% reduction by {t.target_year}</div>
                  <div style={{ marginTop: "0.5rem", background: "#DDE8E2", borderRadius: "999px", height: "5px" }}>
                    <div style={{ width: "20%", height: "100%", borderRadius: "999px", background: "#174D36" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <TrendingDown size={28} style={{ color: "#DDE8E2", margin: "0 auto 0.75rem" }} />
              <p style={{ fontSize: "0.8125rem", color: "#5A6B61", marginBottom: "1rem" }}>No targets set yet</p>
              <Link href="/dashboard/climate-targets" className="btn-ghost" style={{ fontSize: "0.75rem", padding: "0.4rem 0.875rem" }}>
                Set a target
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Add Scope 1 data", href: "/dashboard/scope1", color: "#174D36" },
          { label: "Add Scope 2 data", href: "/dashboard/scope2", color: "#8B6B10" },
          { label: "Add Scope 3 data", href: "/dashboard/scope3", color: "#2A4E8A" },
          { label: "Generate report", href: "/dashboard/reports", color: "#174D36" },
          { label: "AI Assistant", href: "/dashboard/ai-assistant", color: "#174D36" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.875rem 1rem",
              background: "#FFFFFF",
              border: "1px solid #DDE8E2",
              borderRadius: "0.75rem",
              textDecoration: "none",
              color: "#242B27",
              fontSize: "0.8125rem",
              fontWeight: 500,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#8BAF91")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = "#DDE8E2")}
          >
            {item.label}
            <ArrowUpRight size={14} style={{ color: item.color }} />
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 2fr 1fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          div[style*="padding: 2rem 2.5rem"] { padding: 1.25rem !important; }
        }
      `}</style>
    </div>
  );
}
