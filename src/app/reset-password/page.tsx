"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ClimateBookLogo from "@/components/ClimateBookLogo";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/dashboard/overview"), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8F3", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #DDE8E2", background: "#FFFFFF" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", width: "fit-content" }}>
          <ClimateBookLogo size={32} />
          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B" }}>ClimateBooks</span>
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "1rem", padding: "2rem", boxShadow: "0 2px 12px rgba(11,53,43,0.07)" }}>
            {done ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, background: "#E8F2EC", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                  <CheckCircle2 size={26} style={{ color: "#174D36" }} />
                </div>
                <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.375rem", color: "#0B352B", marginBottom: "0.5rem" }}>Password updated</h2>
                <p style={{ color: "#5A6B61", fontSize: "0.9rem" }}>Redirecting you to your dashboard...</p>
              </div>
            ) : (
              <>
                <h1 style={{ fontFamily: "var(--font-manrope)", fontSize: "1.5rem", fontWeight: 900, color: "#0B352B", marginBottom: "0.5rem" }}>Set a new password</h1>
                <p style={{ color: "#5A6B61", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Choose a password with at least 8 characters.</p>

                {error && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1.25rem", display: "flex", gap: "0.5rem" }}>
                    <AlertCircle size={15} style={{ color: "#DC2626", flexShrink: 0 }} />
                    <span style={{ color: "#DC2626", fontSize: "0.875rem" }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label className="label-cb">New password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-cb"
                        placeholder="At least 8 characters"
                        style={{ paddingRight: "2.75rem" }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#5A6B61" }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label-cb">Confirm password</label>
                    <input
                      type="password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="input-cb"
                      placeholder="Repeat your password"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Updating..." : "Update password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
