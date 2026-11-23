"use client";

import { useState } from "react";
import Link from "next/link";
import ClimateBookLogo from "./ClimateBookLogo";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(247,248,243,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #DDE8E2",
      }}
    >
      <div className="container-cb" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "68px" }}>
        {/* Logo + wordmark */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <ClimateBookLogo size={36} />
          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#0B352B", letterSpacing: "-0.02em" }}>
            ClimateBooks
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="desktop-nav">
          {[
            { label: "Platform", href: "/platform" },
            { label: "Solutions", href: "/solutions" },
            { label: "Features", href: "/features" },
            { label: "Pricing", href: "/pricing" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ fontWeight: 500, fontSize: "0.9375rem", color: "#242B27", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#174D36")}
              onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#242B27")}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="desktop-nav">
          <Link href="/login" className="btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
            Log in
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: "0.5rem 1.125rem", fontSize: "0.875rem" }}>
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#242B27", display: "none" }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{ background: "#F7F8F3", borderTop: "1px solid #DDE8E2", padding: "1rem 1.5rem 1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {[
              { label: "Platform", href: "/platform" },
              { label: "Solutions", href: "/solutions" },
              { label: "Features", href: "/features" },
              { label: "Pricing", href: "/pricing" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{ fontWeight: 500, fontSize: "1rem", color: "#242B27", textDecoration: "none" }}
              >
                {item.label}
              </Link>
            ))}
            <div style={{ borderTop: "1px solid #DDE8E2", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <Link href="/login" className="btn-ghost" onClick={() => setOpen(false)}>Log in</Link>
              <Link href="/signup" className="btn-primary" onClick={() => setOpen(false)}>Get Started</Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
