"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronDown, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function DashboardHeader() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", authUser.id).single();
      setUser({ name: profile?.full_name || authUser.email?.split("@")[0] || "User", email: authUser.email || "" });
    }
    load();
  }, []);

  return (
    <header style={{ height: "60px", background: "#FFFFFF", borderBottom: "1px solid #DCE8E2", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", flexShrink: 0 }}>
      <div style={{ fontSize: "0.875rem", color: "#65736D" }}>
        SearchSprout Dashboard
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#65736D", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "0.5rem" }}>
          <Bell size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#063B38", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={16} color="#16C653" />
          </div>
          {user && (
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#071F20" }}>{user.name}</span>
          )}
          <ChevronDown size={14} color="#65736D" />
        </div>
      </div>
    </header>
  );
}
