"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

type Tab = "profile" | "preferences";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  border: "1.5px solid #D1DCF0",
  borderRadius: 8,
  fontSize: "0.9375rem",
  color: "#263449",
  background: "#ffffff",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#263449",
  marginBottom: "0.375rem",
};

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, string> } | null>(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("student");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyAnalysis, setNotifyAnalysis] = useState(true);
  const [notifyTeam, setNotifyTeam] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMsg, setPrefMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setFullName(user.user_metadata?.full_name ?? "");
      setRole(user.user_metadata?.role ?? "student");
    });
  }, [router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, role },
    });
    if (!error) {
      await supabase.from("profiles").update({ full_name: fullName, role }).eq("id", user!.id);
    }
    setProfileMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Profile updated." });
    setProfileSaving(false);
  }

  async function savePreferences(e: React.FormEvent) {
    e.preventDefault();
    setPrefSaving(true);
    setPrefMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      notification_preferences: { email: notifyEmail, analysis: notifyAnalysis, team: notifyTeam },
    }).eq("id", user!.id);
    setPrefMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Preferences saved." });
    setPrefSaving(false);
  }

  if (!user) return null;

  return (
    <>
      <DashboardHeader title="Settings" user={{ name: user.user_metadata?.full_name, email: user.email }} />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 680 }}>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 10, padding: "0.25rem", width: "fit-content" }}>
          {(["profile", "preferences"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "0.5rem 1.25rem", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", background: tab === t ? "#155EEF" : "transparent", color: tab === t ? "#ffffff" : "#64748B", transition: "background 0.15s" }}>
              {t === "profile" ? "Profile" : "Preferences"}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.0625rem", color: "#102A43", margin: 0 }}>Profile Information</h2>

              <div>
                <label style={labelStyle}>Full name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")} />
              </div>

              <div>
                <label style={labelStyle}>Email address</label>
                <input type="email" value={user.email ?? ""} disabled
                  style={{ ...inputStyle, background: "#F5F8FC", color: "#94A3B8", cursor: "not-allowed" }} />
                <p style={{ color: "#94A3B8", fontSize: "0.8rem", margin: "0.375rem 0 0" }}>Email cannot be changed here. Contact support to update your email address.</p>
              </div>

              <div>
                <label style={labelStyle}>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}
                  onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}>
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="researcher">Researcher</option>
                  <option value="administrator">Administrator</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ paddingTop: "0.5rem", borderTop: "1px solid #F5F8FC" }}>
                <label style={labelStyle}>Password</label>
                <Link href="/reset-password" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "#155EEF", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>
                  Change password <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {profileMsg && (
              <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", padding: "0.75rem 1rem", borderRadius: 8, background: profileMsg.ok ? "#F0FDF4" : "#FFF5F5", border: `1px solid ${profileMsg.ok ? "#BBF7D0" : "#FCC"}` }}>
                {profileMsg.ok ? <CheckCircle2 size={16} color="#16A34A" /> : <AlertCircle size={16} color="#D44" />}
                <span style={{ fontSize: "0.875rem", color: profileMsg.ok ? "#166534" : "#922" }}>{profileMsg.text}</span>
              </div>
            )}

            <button type="submit" disabled={profileSaving} className="btn-primary" style={{ maxWidth: 160, justifyContent: "center", opacity: profileSaving ? 0.7 : 1 }}>
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        )}

        {tab === "preferences" && (
          <form onSubmit={savePreferences} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.0625rem", color: "#102A43", margin: 0 }}>Notification Preferences</h2>
              {[
                { label: "Email notifications", desc: "Receive email updates about your account and analyses", val: notifyEmail, set: setNotifyEmail },
                { label: "Analysis complete notifications", desc: "Get notified when a document analysis finishes", val: notifyAnalysis, set: setNotifyAnalysis },
                { label: "Team activity notifications", desc: "Get notified about team invitations and shared reports", val: notifyTeam, set: setNotifyTeam },
              ].map(({ label, desc, val, set }) => (
                <label key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", padding: "0.75rem 0", borderBottom: "1px solid #F5F8FC" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#263449", margin: "0 0 0.25rem" }}>{label}</p>
                    <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>{desc}</p>
                  </div>
                  <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#155EEF", flexShrink: 0, marginLeft: "1rem", marginTop: "0.125rem" }} />
                </label>
              ))}
            </div>

            {prefMsg && (
              <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", padding: "0.75rem 1rem", borderRadius: 8, background: prefMsg.ok ? "#F0FDF4" : "#FFF5F5", border: `1px solid ${prefMsg.ok ? "#BBF7D0" : "#FCC"}` }}>
                {prefMsg.ok ? <CheckCircle2 size={16} color="#16A34A" /> : <AlertCircle size={16} color="#D44" />}
                <span style={{ fontSize: "0.875rem", color: prefMsg.ok ? "#166534" : "#922" }}>{prefMsg.text}</span>
              </div>
            )}

            <button type="submit" disabled={prefSaving} className="btn-primary" style={{ maxWidth: 200, justifyContent: "center", opacity: prefSaving ? 0.7 : 1 }}>
              {prefSaving ? "Saving..." : "Save Preferences"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
