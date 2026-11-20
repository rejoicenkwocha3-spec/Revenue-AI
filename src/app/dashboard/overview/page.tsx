"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, TrendingUp, Zap, MousePointerClick, AlertCircle, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const volumeData = [
  { day: "Mon", queries: 1240 },
  { day: "Tue", queries: 1890 },
  { day: "Wed", queries: 2100 },
  { day: "Thu", queries: 1750 },
  { day: "Fri", queries: 2340 },
  { day: "Sat", queries: 1120 },
  { day: "Sun", queries: 980 },
];

const topQueries = [
  { query: "pricing plans", clicks: 342, ctr: "68%" },
  { query: "getting started", clicks: 287, ctr: "72%" },
  { query: "api documentation", clicks: 234, ctr: "61%" },
  { query: "integrations list", clicks: 198, ctr: "54%" },
  { query: "export data", clicks: 156, ctr: "49%" },
];

export default function OverviewPage() {
  const [user, setUser] = useState<{ full_name?: string } | null>(null);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", authUser.id).single();
        setUser({ full_name: profile?.full_name });
      }
      const { count } = await supabase.from("search_projects").select("*", { count: "exact", head: true });
      setProjectCount(count || 0);
    }
    load();
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "there";

  const stats = [
    { label: "Total Queries (7d)", value: "11,420", change: "+12%", icon: Search, color: "#16C653" },
    { label: "Avg Response Time", value: "42ms", change: "-8%", icon: Zap, color: "#16C653" },
    { label: "Click-Through Rate", value: "63.4%", change: "+4%", icon: MousePointerClick, color: "#16C653" },
    { label: "Zero Result Rate", value: "3.2%", change: "-1%", icon: AlertCircle, color: "#F59E0B" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>
            Good morning, {firstName}
          </h1>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>
            Here is a summary of your search performance.
          </p>
        </div>
        <Link href="/dashboard/projects" className="btn-primary" style={{ fontSize: "0.9rem" }}>
          <Plus size={16} /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {stats.map((s) => (
          <div key={s.label} className="card-ss">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "#65736D" }}>{s.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: "#E8F8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.75rem", color: "#071F20", marginBottom: "0.25rem" }}>{s.value}</div>
            <div style={{ fontSize: "0.8125rem", color: s.change.startsWith("+") ? "#16C653" : s.change.startsWith("-") && s.label.includes("Zero") ? "#16C653" : "#F59E0B" }}>
              {s.change} vs last week
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Volume chart */}
        <div className="card-ss">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", margin: 0 }}>Search Volume (Last 7 Days)</h2>
            <Link href="/dashboard/analytics" style={{ fontSize: "0.8125rem", color: "#16C653", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={volumeData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="ssGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16C653" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16C653" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#65736D" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#65736D" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #DCE8E2" }} />
              <Area type="monotone" dataKey="queries" stroke="#16C653" strokeWidth={2} fill="url(#ssGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick links */}
        <div className="card-ss">
          <h2 style={{ fontSize: "1rem", margin: "0 0 1.25rem" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[
              { label: "Create a project", href: "/dashboard/projects" },
              { label: "Add data source", href: "/dashboard/data-sources" },
              { label: "View analytics", href: "/dashboard/analytics" },
              { label: "Get API key", href: "/dashboard/api-keys" },
              { label: "Configure search", href: "/dashboard/experience" },
            ].map((a) => (
              <Link key={a.href} href={a.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: "1px solid #DCE8E2", textDecoration: "none", color: "#071F20", fontSize: "0.875rem", fontWeight: 500, transition: "background 0.15s" }}>
                {a.label}
                <ArrowUpRight size={14} color="#65736D" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Top queries */}
      <div className="card-ss">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", margin: 0 }}>Top Search Queries</h2>
          <Link href="/dashboard/analytics" style={{ fontSize: "0.8125rem", color: "#16C653", textDecoration: "none" }}>View all</Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #DCE8E2" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#65736D", fontWeight: 500 }}>Query</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#65736D", fontWeight: 500 }}>Clicks</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#65736D", fontWeight: 500 }}>CTR</th>
              </tr>
            </thead>
            <tbody>
              {topQueries.map((q) => (
                <tr key={q.query} style={{ borderBottom: "1px solid #F0F5F2" }}>
                  <td style={{ padding: "0.75rem", color: "#071F20", fontWeight: 500 }}>{q.query}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", color: "#65736D" }}>{q.clicks}</td>
                  <td style={{ padding: "0.75rem", textAlign: "right", color: "#16C653", fontWeight: 600 }}>{q.ctr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
