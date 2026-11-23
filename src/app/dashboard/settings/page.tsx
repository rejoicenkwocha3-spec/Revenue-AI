"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email || "");
      setFullName(user?.user_metadata?.full_name || "");
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      await supabase.from("cb_profiles").upsert({ full_name: fullName }, { onConflict: "id" });
      setMessage({ type: "success", text: "Profile updated successfully." });
    }
    setSaving(false);
  }

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "640px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.625rem", color: "#0B352B", marginBottom: "0.25rem" }}>Settings</h1>
        <p style={{ color: "#5A6B61", fontSize: "0.875rem" }}>Manage your account and preferences</p>
      </div>

      <div className="card-cb" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B", marginBottom: "1.25rem" }}>Profile</h2>

        {message && (
          <div style={{
            background: message.type === "success" ? "#E8F2EC" : "#FEF2F2",
            border: `1px solid ${message.type === "success" ? "#A8C9B2" : "#FCA5A5"}`,
            borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1.25rem",
            display: "flex", gap: "0.5rem", alignItems: "center",
            fontSize: "0.875rem",
            color: message.type === "success" ? "#174D36" : "#DC2626",
          }}>
            {message.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="label-cb">Full name</label>
            <input className="input-cb" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="label-cb">Email address</label>
            <input className="input-cb" value={email} disabled style={{ background: "#F7F8F3", color: "#9BAF9A" }} />
            <p style={{ fontSize: "0.75rem", color: "#9BAF9A", marginTop: "0.25rem" }}>Email cannot be changed from this page.</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>

      <div className="card-cb">
        <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B", marginBottom: "0.75rem" }}>Security</h2>
        <p style={{ color: "#5A6B61", fontSize: "0.875rem", marginBottom: "1rem" }}>To change your password, sign out and use the Forgot Password flow on the login page.</p>
        <a href="/forgot-password" className="btn-ghost" style={{ fontSize: "0.875rem", display: "inline-flex" }}>Reset password</a>
      </div>
    </div>
  );
}
