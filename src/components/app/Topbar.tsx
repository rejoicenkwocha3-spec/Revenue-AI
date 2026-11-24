import Link from "next/link";
import { Bell, LogOut, MessageSquareText } from "lucide-react";
import { MobileNav } from "./Sidebar";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { ROLE_LABELS } from "@/lib/permissions";
import type { AppContext } from "@/lib/session";

export function Topbar({ ctx, unread }: { ctx: AppContext; unread: number }) {
  const initials = ctx.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
      <MobileNav unread={unread} />
      <WorkspaceSwitcher current={ctx.orgId} memberships={ctx.memberships} />
      <div className="ml-auto flex items-center gap-2">
        <Link href="/dashboard/assistant" className="btn btn-outline btn-sm hidden sm:inline-flex"><MessageSquareText size={15} />Ask Revenue AI</Link>
        <Link href="/dashboard/notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-body hover:bg-canvas hover:text-navy" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell size={19} />
          {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-electric ring-2 ring-white" />}
        </Link>
        <Link href="/dashboard/settings" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-canvas">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue">{initials || "U"}</span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-semibold leading-tight text-navy">{ctx.fullName}</span>
            <span className="block text-xs leading-tight text-muted">{ROLE_LABELS[ctx.role]}</span>
          </span>
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-body hover:bg-canvas hover:text-navy" aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
