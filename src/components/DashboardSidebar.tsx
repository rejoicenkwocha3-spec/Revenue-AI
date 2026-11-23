"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ClimateBookLogo from "./ClimateBookLogo";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Building2, Leaf, Flame, Zap, Factory,
  ClipboardList, Database, BarChart3, FileText, Target,
  TrendingDown, Users, MessageSquare, FolderOpen, Bell,
  CreditCard, Settings, LogOut, ChevronRight
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Organisations", href: "/dashboard/organisations", icon: Building2 },
  { label: "Carbon Footprint", href: "/dashboard/carbon-footprint", icon: Leaf },
  { label: "Scope 1 Emissions", href: "/dashboard/scope1", icon: Flame },
  { label: "Scope 2 Emissions", href: "/dashboard/scope2", icon: Zap },
  { label: "Scope 3 Emissions", href: "/dashboard/scope3", icon: Factory },
  { label: "Activity Data", href: "/dashboard/activity-data", icon: ClipboardList },
  { label: "Emission Factors", href: "/dashboard/emission-factors", icon: Database },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Climate Targets", href: "/dashboard/climate-targets", icon: Target },
  { label: "Reduction Plans", href: "/dashboard/reduction-plans", icon: TrendingDown },
  { label: "Suppliers", href: "/dashboard/suppliers", icon: Users },
  { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: MessageSquare },
  { label: "Documents", href: "/dashboard/documents", icon: FolderOpen },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside style={{
      width: "240px",
      minHeight: "100vh",
      background: "#0B352B",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid rgba(139,175,145,0.15)", flexShrink: 0 }}>
        <Link href="/dashboard/overview" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <ClimateBookLogo size={32} />
          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "0.9375rem", color: "#FFFFFF" }}>ClimateBooks</span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.625rem", display: "flex", flexDirection: "column", gap: "0.125rem", overflowY: "auto" }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                fontSize: "0.8125rem",
                fontWeight: active ? 600 : 400,
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)";
                }
              }}
            >
              <item.icon size={15} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
              {active && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "0.75rem 0.625rem", borderTop: "1px solid rgba(139,175,145,0.15)", flexShrink: 0 }}>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.8125rem",
            fontWeight: 400,
            width: "100%",
            transition: "color 0.1s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)")}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
