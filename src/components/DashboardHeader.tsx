"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";

interface DashboardHeaderProps {
  title: string;
  user?: { name?: string; email?: string };
}

export default function DashboardHeader({ title, user }: DashboardHeaderProps) {
  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? "U";

  return (
    <header
      style={{
        height: 64,
        background: "#ffffff",
        borderBottom: "1px solid #D1DCF0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: 0 }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/dashboard/notifications" style={{ color: "#64748B", display: "flex", textDecoration: "none" }}>
          <Bell size={20} />
        </Link>
        <div
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#155EEF", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.875rem",
            cursor: "pointer",
          }}
          title={user?.name ?? user?.email}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
