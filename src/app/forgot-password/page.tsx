"use client";

import { useState } from "react";
import Link from "next/link";
import TrueAuthorLogo from "@/components/TrueAuthorLogo";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) { setError(err.message); setLoading(false); }
    else { setSent(true); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F8FC", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "2.5rem" }}>
          <TrueAuthorLogo size={32} />
          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.125rem", color: "#102A43" }}>TrueAuthor</span>
        </Link>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 60, height: 60, background: "#EEF3FD", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <CheckCircle2 size={30} color="#155EEF" />
            </div>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.625rem", color: "#102A43", margin: "0 0 0.75rem" }}>Email sent</h1>
            <p style={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 2rem" }}>
              Check <strong>{email}</strong> for a password reset link. It expires in 1 hour.
            </p>
            <Link href="/login" className="btn-primary" style={{ display: "inline-flex" }}>Back to Login</Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.75rem", color: "#102A43", margin: "0 0 0.5rem" }}>Reset your password</h1>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 2rem" }}>Enter your email and we will send you a reset link.</p>

            {error && (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#FFF5F5", border: "1px solid #FCC", borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1.25rem" }}>
                <AlertCircle size={18} color="#D44" style={{ flexShrink: 0 }} />
                <p style={{ color: "#922", fontSize: "0.9rem", margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@university.edu"
                  style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none" }}
                  onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <Link href="/login" style={{ color: "#155EEF", fontWeight: 500, fontSize: "0.9rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                <ArrowLeft size={15} /> Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
