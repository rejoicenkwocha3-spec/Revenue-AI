"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Brain, KanbanSquare, Briefcase, ScanSearch, TrendingUp, Building2, Contact, CalendarCheck, MessageSquareText, Bot,
  BarChart3, FileText, Trophy, Target, Plug, Bell, CreditCard, Settings, X, Menu,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/intelligence", label: "Revenue Intelligence", icon: Brain },
  { section: "Pipeline" },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/dashboard/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/dashboard/deals", label: "Deal Inspection", icon: ScanSearch },
  { href: "/dashboard/forecasting", label: "Forecasting", icon: TrendingUp },
  { section: "Customers" },
  { href: "/dashboard/accounts", label: "Accounts", icon: Building2 },
  { href: "/dashboard/contacts", label: "Contacts", icon: Contact },
  { href: "/dashboard/activities", label: "Sales Activities", icon: CalendarCheck },
  { section: "AI" },
  { href: "/dashboard/assistant", label: "AI Assistant", icon: MessageSquareText },
  { href: "/dashboard/agents", label: "AI Agents", icon: Bot },
  { section: "Performance" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/performance", label: "Team Performance", icon: Trophy },
  { href: "/dashboard/targets", label: "Targets and Quotas", icon: Target },
  { section: "Workspace" },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, badge: true },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ unread, onNavigate }: { unread: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {NAV.map((item, i) => {
        if ("section" in item) return <li key={i} className="px-3 pb-1 pt-4 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#7480A6]">{item.section}</li>;
        const exact = "exact" in item && item.exact;
        const active = exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/") || (item.href === "/dashboard/settings" && pathname.startsWith("/dashboard/team"));
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
              className={cn("group flex items-center gap-3 rounded-lg px-3 py-[7px] text-[0.85rem] font-medium transition-colors", active ? "bg-white/10 text-white" : "text-[#AEB8DA] hover:bg-white/5 hover:text-white")}>
              <Icon size={16} className={cn(active ? "text-[#8FA9FF]" : "text-[#7480A6] group-hover:text-[#AEB8DA]")} />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge && unread > 0 && <span className="rounded-full bg-electric px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{unread > 99 ? "99+" : unread}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({ unread }: { unread: number }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] flex-col bg-navy lg:flex">
      <div className="flex h-16 items-center px-5"><Logo dark size={28} href="/dashboard" /></div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Application"><NavList unread={unread} /></nav>
    </aside>
  );
}

export function MobileNav({ unread }: { unread: number }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy hover:bg-canvas lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={20} /></button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-navy">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo dark size={26} href="/dashboard" />
              <button type="button" onClick={() => setOpen(false)} className="text-white" aria-label="Close navigation"><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Application"><NavList unread={unread} onNavigate={() => setOpen(false)} /></nav>
          </div>
        </div>
      )}
    </>
  );
}
