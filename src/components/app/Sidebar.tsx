"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FolderKanban, PlusCircle, Film, AudioLines, Library, Fingerprint, FileText, Languages, Captions,
  Download, Users, Bell, CreditCard, Settings, X, Menu,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "My Projects", icon: FolderKanban, exact: true },
  { href: "/dashboard/projects/new", label: "New Dubbing Project", icon: PlusCircle, exact: true },
  { section: "Media" },
  { href: "/dashboard/videos", label: "Video Library", icon: Film },
  { href: "/dashboard/audio", label: "Audio Library", icon: AudioLines },
  { section: "Voices" },
  { href: "/dashboard/voices", label: "Voice Library", icon: Library },
  { href: "/dashboard/voice-cloning", label: "Voice Cloning", icon: Fingerprint },
  { section: "Localization" },
  { href: "/dashboard/transcriptions", label: "Transcriptions", icon: FileText },
  { href: "/dashboard/translations", label: "Translations", icon: Languages },
  { href: "/dashboard/subtitles", label: "Subtitles", icon: Captions },
  { href: "/dashboard/exports", label: "Export History", icon: Download },
  { section: "Workspace" },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, badge: true },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ unread, onNavigate }: { unread: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {NAV.map((item, i) => {
        if ("section" in item) {
          return (
            <li key={i} className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7E87B0]">
              {item.section}
            </li>
          );
        }
        const exact = "exact" in item && item.exact;
        const active = exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const projectWorkspace = item.href === "/dashboard/projects" && /^\/dashboard\/projects\/(?!new)[^/]+/.test(pathname);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active || projectWorkspace ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-[0.875rem] font-medium transition-colors",
                active || projectWorkspace ? "bg-white/10 text-white" : "text-[#B4BBDA] hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon size={17} className={cn(active || projectWorkspace ? "text-[#9DB8FF]" : "text-[#7E87B0] group-hover:text-[#B4BBDA]")} />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge && unread > 0 && (
                <span className="rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{unread > 99 ? "99+" : unread}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({ unread }: { unread: number }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-navy lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo dark size={28} href="/dashboard" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Application">
        <NavList unread={unread} />
      </nav>
    </aside>
  );
}

export function MobileNav({ unread }: { unread: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy hover:bg-canvas lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
        <Menu size={20} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-navy">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo dark size={26} href="/dashboard" />
              <button type="button" onClick={() => setOpen(false)} className="text-white" aria-label="Close navigation"><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Application">
              <NavList unread={unread} onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
