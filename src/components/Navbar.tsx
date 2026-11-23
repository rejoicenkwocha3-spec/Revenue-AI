"use client";

import { useState } from "react";
import Link from "next/link";
import TrueAuthorLogo from "./TrueAuthorLogo";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/platform", label: "Platform" },
    { href: "/solutions", label: "Solutions" },
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(245,248,252,0.94)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #D1DCF0",
      }}
    >
      <div className="container-ta" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "68px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <TrueAuthorLogo size={36} />
          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#102A43", letterSpacing: "-0.02em" }}>
            TrueAuthor
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="desktop-nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ color: "#263449", fontWeight: 500, fontSize: "0.9375rem", textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#155EEF")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#263449")}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="desktop-nav">
          <Link href="/login" className="btn-secondary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
            Log In
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
            Get Started
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "#102A43" }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div style={{ background: "#ffffff", borderTop: "1px solid #D1DCF0", padding: "1rem 1.5rem" }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ display: "block", color: "#263449", fontWeight: 500, fontSize: "1rem", textDecoration: "none", padding: "0.75rem 0", borderBottom: "1px solid #F5F8FC" }}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <Link href="/login" className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Log In</Link>
            <Link href="/signup" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>Get Started</Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
