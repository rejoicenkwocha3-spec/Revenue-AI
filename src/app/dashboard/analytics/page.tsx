"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<{ scope1: number; scope2: number; scope3: number }>({ scope1: 0, scope2: 0, scope3: 0 });
  const [monthly, setMonthly] = useState<{ month: string; scope1: number; scope2: number; scope3: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: orgs } = await supabase.from("cb_organisations").select("id").eq("owner_id", user!.id);
    const orgIds = (orgs || []).map((o) => o.id);
    if (orgIds.length === 0) { setLoading(false); return; }

    const { data: emissions } = await supabase.from("cb_emissions").select("scope, amount_tco2e, activity_date").in("organisation_id", orgIds);

    const agg = { scope1: 0, scope2: 0, scope3: 0 };
    const byMonth: Record<string, { scope1: number; scope2: number; scope3: number }> = {};

    (emissions || []).forEach((e) => {
      const key = e.scope as keyof typeof agg;
      if (key in agg) agg[key] += e.amount_tco2e || 0;
      const month = e.activity_date?.substring(0, 7) || "unknown";
      if (!byMonth[month]) byMonth[month] = { scope1: 0, scope2: 0, scope3: 0 };
      if (key in byMonth[month]) byMonth[month][key] += e.amount_tco2e || 0;
    });

    setData(agg);
    const sorted = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, vals]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        ...vals,
      }));
    setMonthly(sorted);
    setLoading(false);
  }

  const total = data.scope1 + data.scope2 + data.scope3;
  const pieData = [
    { name: "Scope 1", value: parseFloat(data.scope1.toFixed(2)), color: "#174D36" },
    { name: "Scope 2", value: parseFloat(data.scope2.toFixed(2)), color: "#D9AD55" },
    { name: "Scope 3", value: parseFloat(data.scope3.toFixed(2)), color: "#2A4E8A" },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "1200px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Emissions Analytics</h1>
        <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Visualise emissions across scopes, months and categories</p>
      </div>

      {/* Total */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total", value: total, color: "#0B352B" },
          { label: "Scope 1", value: data.scope1, color: "#174D36" },
          { label: "Scope 2", value: data.scope2, color: "#8B6B10" },
          { label: "Scope 3", value: data.scope3, color: "#2A4E8A" },
        ].map((s) => (
          <div key={s.label} className="stat-tile">
            <div style={{ fontSize: "0.8125rem", color: "#5A6B61", marginBottom: "0.5rem" }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.5rem", color: s.color, fontVariantNumeric: "tabular-nums" }}>
              {loading ? "—" : s.value.toFixed(1)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#5A6B61" }}>tCO₂e</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Monthly bar chart */}
        <div className="card-cb">
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B", marginBottom: "1.25rem" }}>Monthly Emissions (tCO₂e)</h3>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F5F2" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5A6B61" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5A6B61" }} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #DDE8E2", borderRadius: "0.5rem", fontSize: "0.8rem" }}
                  formatter={(val: unknown) => [typeof val === "number" ? `${val.toFixed(2)} tCO₂e` : ""]}
                />
                <Bar dataKey="scope1" name="Scope 1" stackId="a" fill="#174D36" radius={[0, 0, 0, 0]} />
                <Bar dataKey="scope2" name="Scope 2" stackId="a" fill="#D9AD55" radius={[0, 0, 0, 0]} />
                <Bar dataKey="scope3" name="Scope 3" stackId="a" fill="#2A4E8A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A6B61", fontSize: "0.875rem" }}>
              Add activity data to see monthly trends
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card-cb">
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B", marginBottom: "1.25rem" }}>Emissions by Scope</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #DDE8E2", borderRadius: "0.5rem", fontSize: "0.8rem" }}
                    formatter={(val: unknown) => [typeof val === "number" ? `${val.toFixed(2)} tCO₂e` : ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "2px", background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.8rem", color: "#5A6B61" }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#242B27", fontVariantNumeric: "tabular-nums" }}>
                      {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A6B61", fontSize: "0.875rem" }}>
              No emissions data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
