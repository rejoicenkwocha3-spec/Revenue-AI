"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import TrueAuthorLogo from "./TrueAuthorLogo";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, FileText, Plus, BarChart2, Brain, PenTool,
  Quote, SpellCheck, MessageSquare, Bookmark, Share2,
  Users, Bell, CreditCard, Settings, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";

const nav = [
  { group: "Main", items: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/documents", icon: FileText, label: "My Documents" },
    { href: "/dashboard/new", icon: Plus, label: "New Analysis" },
  ]},
  { group: "Analysis", items: [
    { href: "/dashboard/similarity", icon: BarChart2, label: "Similarity Reports" },
    { href: "/dashboard/ai-insights", icon: Brain, label: "AI Writing Insights" },
    { href: "/dashboard/authorship", icon: PenTool, label: "Authorship Insights" },
    { href: "/dashboard/citations", icon: Quote, label: "Citation Checker" },
    { href: "/dashboard/grammar", icon: SpellCheck, label: "Grammar Checker" },
    { href: "/dashboard/writing-assistant", icon: MessageSquare, label: "Writing Assistant" },
  ]},
  { group: "Documents", items: [
    { href: "/dashboard/saved-reports", icon: Bookmark, label: "Saved Reports" },
    { href: "/dashboard/shared", icon: Share2, label: "Shared Documents" },
    { href: "/dashboard/team", icon: Users, label: "Team" },
  ]},
  { group: "Account", items: [
    { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
    { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ]},
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: collapsed ? 68 : 240,
        minHeight: "100vh",
        background: "#102A43",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ padding: collapsed ? "1.25rem 0" : "1.25rem 1rem", display: "flex", alignItems: "center", gap: "0.625rem", borderBottom: "1px solid rgba(255,255,255,0.08)", justifyContent: collapsed ? "center" : "flex-start" }}>
        <TrueAuthorLogo size={32} variant="white" />
        {!collapsed && <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "white", whiteSpace: "nowrap" }}>TrueAuthor</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0", overflowY: "auto" }}>
        {nav.map((group) => (
          <div key={group.group} style={{ marginBottom: "0.25rem" }}>
            {!collapsed && (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.75rem 1rem 0.375rem" }}>
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: collapsed ? "0.625rem 0" : "0.625rem 1rem",
                    justifyContent: collapsed ? "center" : "flex-start",
                    color: active ? "white" : "rgba(255,255,255,0.55)",
                    background: active ? "rgba(21,94,239,0.3)" : "transparent",
                    borderLeft: active ? "3px solid #155EEF" : "3px solid transparent",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontWeight: active ? 600 : 400,
                    whiteSpace: "nowrap",
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseOver={(e) => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
                  onMouseOut={(e) => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
                >
                  <item.icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "0.75rem 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: collapsed ? "0.625rem 0" : "0.625rem 1rem",
            justifyContent: collapsed ? "center" : "flex-start",
            color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer",
            width: "100%", fontSize: "0.875rem", whiteSpace: "nowrap",
            transition: "color 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && "Log Out"}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: collapsed ? "0.625rem 0" : "0.625rem 1rem",
            justifyContent: collapsed ? "center" : "flex-start",
            color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer",
            width: "100%", fontSize: "0.8125rem", whiteSpace: "nowrap",
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
