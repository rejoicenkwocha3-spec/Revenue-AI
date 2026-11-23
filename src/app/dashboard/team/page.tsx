"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Mail, Shield } from "lucide-react";

export default function TeamPage() {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || "");
      setUserName(user?.user_metadata?.full_name || "Account Owner");
    });
  }, []);

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "800px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Team</h1>
        <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Manage team members and their access to your ClimateBooks account</p>
      </div>

      <div className="card-cb" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B", marginBottom: "1rem" }}>Current Members</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem", background: "#F7F8F3", borderRadius: "0.75rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#174D36", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#D9AD55", fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem" }}>
              {userName.charAt(0).toUpperCase() || "O"}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#0B352B" }}>{userName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.775rem", color: "#5A6B61", marginTop: "0.1rem" }}>
              <Mail size={11} /> {userEmail}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#E8F2EC", color: "#174D36", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
            <Shield size={11} /> Owner
          </div>
        </div>
      </div>

      <div className="card-cb" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
        <UserPlus size={40} style={{ color: "#DDE8E2", margin: "0 auto 1rem", display: "block" }} />
        <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.0625rem", color: "#0B352B", marginBottom: "0.5rem" }}>Invite team members</h3>
        <p style={{ color: "#5A6B61", fontSize: "0.875rem", maxWidth: "380px", margin: "0 auto 1.5rem" }}>
          Team invitations and role-based access control are available on the Professional and Enterprise plans.
        </p>
        <a href="/pricing" className="btn-gold">View Plans</a>
      </div>
    </div>
  );
}
