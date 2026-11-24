"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/platform", label: "Platform" },
  { href: "/solutions", label: "Solutions" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-200",
        scrolled || open ? "border-b border-line bg-white/95 backdrop-blur" : "border-b border-transparent bg-canvas/0",
      )}
    >
      <nav className="container-ld flex h-[68px] items-center justify-between gap-6" aria-label="Main">
        <Logo />
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-[0.9375rem] font-medium transition-colors",
                    active ? "text-navy" : "text-body hover:text-navy",
                  )}
                >
                  {l.label}
                  {active && <span className="mx-auto mt-1 block h-0.5 w-4 rounded-full bg-blue" />}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Start Dubbing</Link>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-line bg-white md:hidden">
          <ul className="container-ld flex flex-col py-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className={cn("block rounded-lg px-2 py-3 text-base font-medium", pathname === l.href ? "text-blue" : "text-navy")}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 grid grid-cols-2 gap-2 pb-2">
              <Link href="/login" onClick={() => setOpen(false)} className="btn btn-outline">Log in</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="btn btn-primary">Start Dubbing</Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
