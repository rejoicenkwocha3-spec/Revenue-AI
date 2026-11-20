"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Search, MousePointerClick, AlertCircle, TrendingUp } from "lucide-react";

const volumeByDay = [
  { date: "Nov 14", queries: 980 },
  { date: "Nov 15", queries: 1240 },
  { date: "Nov 16", queries: 1890 },
  { date: "Nov 17", queries: 2100 },
  { date: "Nov 18", queries: 1750 },
  { date: "Nov 19", queries: 2340 },
  { date: "Nov 20", queries: 1120 },
];

const topQueries = [
  { query: "pricing plans", volume: 342, ctr: "68%", trend: "+12%" },
  { query: "getting started", volume: 287, ctr: "72%", trend: "+8%" },
  { query: "api documentation", volume: 234, ctr: "61%", trend: "-4%" },
  { query: "integrations list", volume: 198, ctr: "54%", trend: "+19%" },
  { query: "export data", volume: 156, ctr: "49%", trend: "+3%" },
  { query: "team permissions", volume: 134, ctr: "58%", trend: "+7%" },
  { query: "billing upgrade", volume: 112, ctr: "71%", trend: "+22%" },
  { query: "search widget embed", volume: 98, ctr: "45%", trend: "-2%" },
];

const zeroResults = [
  { query: "enterprise sso", volume: 45 },
  { query: "bulk delete api", volume: 38 },
  { query: "custom domain", volume: 31 },
  { query: "gdpr export", volume: 24 },
  { query: "white label", volume: 19 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");

  const stats = [
    { label: "Total Queries", value: "11,420", change: "+12%", icon: Search },
    { label: "Click-Through Rate", value: "63.4%", change: "+4%", icon: MousePointerClick },
    { label: "Zero Result Rate", value: "3.2%", change: "-1%", icon: AlertCircle },
    { label: "Avg Position (CTR)", value: "2.1", change: "-0.3", icon: TrendingUp },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Search Analytics</h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Understand how users are searching your content.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              style={{
                padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: "1px solid #DCE8E2",
                background: dateRange === r ? "#063B38" : "#FFFFFF",
                color: dateRange === r ? "#FFFFFF" : "#65736D",
                fontSize: "0.875rem", fontWeight: 500, cursor: "pointer"
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {stats.map((s) => (
          <div key={s.label} className="card-ss">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "#65736D" }}>{s.label}</span>
              <s.icon size={17} color="#16C653" />
            </div>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.75rem", color: "#071F20", marginBottom: "0.25rem" }}>{s.value}</div>
            <div style={{ fontSize: "0.8125rem", color: "#16C653" }}>{s.change} vs previous period</div>
          </div>
        ))}
      </div>

      {/* Volume chart */}
      <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Search Volume</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={volumeByDay} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="ssGradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16C653" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16C653" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#65736D" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#65736D" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #DCE8E2" }} />
            <Area type="monotone" dataKey="queries" stroke="#16C653" strokeWidth={2} fill="url(#ssGradA)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        {/* Top queries */}
        <div className="card-ss">
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Top Queries</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #DCE8E2" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#65736D", fontWeight: 500 }}>Query</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#65736D", fontWeight: 500 }}>Volume</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#65736D", fontWeight: 500 }}>CTR</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#65736D", fontWeight: 500 }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {topQueries.map((q) => (
                <tr key={q.query} style={{ borderBottom: "1px solid #F0F5F2" }}>
                  <td style={{ padding: "0.75rem", color: "#071F20", fontWeight: 500 }}>{q.query}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", color: "#65736D" }}>{q.volume}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", color: "#16C653", fontWeight: 600 }}>{q.ctr}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", color: q.trend.startsWith("+") ? "#16C653" : "#EF4444", fontSize: "0.8125rem" }}>{q.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Zero results */}
        <div className="card-ss">
          <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Zero Result Queries</h2>
          <p style={{ color: "#65736D", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>Queries that returned no results. Consider adding content for these topics.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {zeroResults.map((z) => (
              <div key={z.query} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.875rem", background: "#F7FAF8", borderRadius: "0.5rem" }}>
                <span style={{ fontSize: "0.875rem", color: "#071F20", fontWeight: 500 }}>{z.query}</span>
                <span style={{ fontSize: "0.8125rem", color: "#F59E0B", fontWeight: 600 }}>{z.volume}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
