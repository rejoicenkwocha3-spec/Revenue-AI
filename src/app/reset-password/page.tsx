"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TrueAuthorLogo from "@/components/TrueAuthorLogo";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); }
    else { setDone(true); setTimeout(() => router.push("/login"), 2500); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F8FC", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "2.5rem" }}>
          <TrueAuthorLogo size={32} />
          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#102A43" }}>TrueAuthor</span>
        </Link>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 60, height: 60, background: "#EEF3FD", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <CheckCircle2 size={30} color="#155EEF" />
            </div>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.625rem", color: "#102A43", margin: "0 0 0.75rem" }}>Password updated</h1>
            <p style={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.7 }}>Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.75rem", color: "#102A43", margin: "0 0 0.5rem" }}>Set new password</h1>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 2rem" }}>Enter and confirm your new password below.</p>

            {error && (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#FFF5F5", border: "1px solid #FCC", borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1.25rem" }}>
                <AlertCircle size={18} color="#D44" style={{ flexShrink: 0 }} />
                <p style={{ color: "#922", fontSize: "0.9rem", margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {[{ label: "New password", val: password, setter: setPassword }, { label: "Confirm password", val: confirm, setter: setConfirm }].map(({ label, val, setter }) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} value={val} onChange={(e) => setter(e.target.value)} required placeholder="At least 8 characters"
                      style={{ width: "100%", padding: "0.75rem 2.75rem 0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none" }}
                      onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                      onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
