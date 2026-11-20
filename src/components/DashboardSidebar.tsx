"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, Database, Layers, Sliders, MessageSquare,
  Star, BarChart3, Settings2, KeyRound, Plug, Users, CreditCard, Settings,
  LogOut, ChevronLeft, ChevronRight
} from "lucide-react";
import SearchSproutLogo from "./SearchSproutLogo";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const nav = [
  { href: "/dashboard/overview", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/projects", icon: FolderOpen, label: "Search Projects" },
  { href: "/dashboard/data-sources", icon: Database, label: "Data Sources" },
  { href: "/dashboard/indexes", icon: Layers, label: "Search Indexes" },
  { href: "/dashboard/experience", icon: Sliders, label: "Search Experience" },
  { href: "/dashboard/ai-assistant", icon: MessageSquare, label: "AI Assistant" },
  { href: "/dashboard/recommendations", icon: Star, label: "Recommendations" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/merchandising", icon: Settings2, label: "Merchandising" },
  { href: "/dashboard/api-keys", icon: KeyRound, label: "API Keys" },
  { href: "/dashboard/integrations", icon: Plug, label: "Integrations" },
  { href: "/dashboard/team", icon: Users, label: "Team" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      style={{
        width: collapsed ? "64px" : "240px",
        minHeight: "100vh",
        background: "#071F20",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s",
        flexShrink: 0,
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: collapsed ? "1.25rem 0.75rem" : "1.25rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
        {!collapsed && (
          <Link href="/dashboard/overview" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <SearchSproutLogo size={28} />
            <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#FFFFFF" }}>SearchSprout</span>
          </Link>
        )}
        {collapsed && <SearchSproutLogo size={28} />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "0.375rem", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", flexShrink: 0 }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem", overflowY: "auto" }}>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5625rem 0.75rem",
                borderRadius: "0.5rem",
                marginBottom: "0.125rem",
                textDecoration: "none",
                background: active ? "rgba(22,198,83,0.15)" : "transparent",
                color: active ? "#16C653" : "rgba(255,255,255,0.65)",
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 400,
                transition: "background 0.15s, color 0.15s",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <item.icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.5625rem 0.75rem", borderRadius: "0.5rem",
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.5)", fontSize: "0.875rem",
            width: "100%", justifyContent: collapsed ? "center" : "flex-start",
            transition: "color 0.15s"
          }}
        >
          <LogOut size={17} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
