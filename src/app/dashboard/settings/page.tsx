"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setFullName(profile?.full_name || "");
      setEmail(user.email || "");
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated."); setSaving(false); return; }

    const { error: err } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName.trim(), updated_at: new Date().toISOString() });
    if (err) { setError(err.message); setSaving(false); return; }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "#65736D" }}>Loading settings...</div>;

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#071F20", margin: "0 0 0.25rem" }}>Settings</h1>
        <p style={{ color: "#65736D", fontSize: "0.9375rem", margin: 0 }}>Manage your account and profile settings.</p>
      </div>

      <div style={{ maxWidth: "560px" }}>
        <div className="card-ss" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>Profile</h2>
          {error && <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#991B1B" }}>{error}</div>}
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label-ss">Full Name</label>
              <input className="input-ss" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="label-ss">Email Address</label>
              <input className="input-ss" value={email} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
              <p style={{ fontSize: "0.8125rem", color: "#65736D", marginTop: "0.375rem" }}>Email cannot be changed here. Contact support to update your email.</p>
            </div>
            <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: "flex-start", opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={15} className="spin" /> Saving...</> : saved ? "Saved" : <><Save size={15} /> Save Changes</>}
            </button>
          </form>
        </div>

        <div className="card-ss">
          <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Danger Zone</h2>
          <p style={{ color: "#65736D", fontSize: "0.9375rem", marginBottom: "1rem" }}>
            Deleting your account is permanent. All your projects, indexes and data will be removed.
          </p>
          <button style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #EF4444", background: "transparent", color: "#EF4444", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
            Delete Account
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
