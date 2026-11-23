"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ClimateBookLogo from "@/components/ClimateBookLogo";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
            {sent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, background: "#E8F2EC", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                  <CheckCircle2 size={26} style={{ color: "#174D36" }} />
                </div>
                <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.375rem", color: "#0B352B", marginBottom: "0.75rem" }}>Reset link sent</h2>
                <p style={{ color: "#5A6B61", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "1.5rem" }}>
                  Check your inbox at <strong>{email}</strong> for a password reset link.
                </p>
                <Link href="/login" className="btn-ghost" style={{ display: "inline-flex" }}>Back to login</Link>
              </div>
            ) : (
              <>
                <h1 style={{ fontFamily: "var(--font-manrope)", fontSize: "1.5rem", fontWeight: 900, color: "#0B352B", marginBottom: "0.5rem" }}>Forgot your password?</h1>
                <p style={{ color: "#5A6B61", fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                  Enter your email address and we will send you a link to reset your password.
                </p>

                {error && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1.25rem", display: "flex", gap: "0.5rem" }}>
                    <AlertCircle size={15} style={{ color: "#DC2626", flexShrink: 0 }} />
                    <span style={{ color: "#DC2626", fontSize: "0.875rem" }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label className="label-cb">Email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-cb"
                      placeholder="you@company.com"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
                  <Link href="/login" style={{ color: "#174D36", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
