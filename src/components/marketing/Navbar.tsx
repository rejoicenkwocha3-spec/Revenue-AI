"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/solutions", label: "Solutions" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur">
      <div className="container-ra flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined} className={cn("rounded-lg px-3 py-2 text-sm font-semibold", path === l.href ? "text-blue" : "text-body hover:text-ink")}>{l.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {open && (
        <nav className="border-t border-line bg-white px-5 pb-5 pt-2 md:hidden" aria-label="Mobile">
          {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 font-semibold text-ink">{l.label}</Link>)}
          <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/login" className="btn btn-outline btn-sm">Login</Link><Link href="/signup" className="btn btn-primary btn-sm">Sign Up</Link></div>
        </nav>
      )}
    </header>
  );
}
