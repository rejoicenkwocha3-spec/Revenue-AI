"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ClimateBookLogo from "@/components/ClimateBookLogo";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8F3", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "1rem", padding: "2.5rem 2rem", maxWidth: "420px", width: "100%", textAlign: "center", boxShadow: "0 2px 12px rgba(11,53,43,0.07)" }}>
          <div style={{ width: 56, height: 56, background: "#E8F2EC", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <CheckCircle2 size={28} style={{ color: "#174D36" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 900, fontSize: "1.375rem", color: "#0B352B", marginBottom: "0.75rem" }}>
            Check your inbox
          </h2>
          <p style={{ color: "#5A6B61", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "1.5rem" }}>
            We sent a verification email to <strong>{email}</strong>. Click the link in the email to activate your ClimateBooks account.
          </p>
          <Link href="/login" className="btn-primary" style={{ display: "inline-flex" }}>
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8F3", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #DDE8E2", background: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <ClimateBookLogo size={32} />
          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1rem", color: "#0B352B" }}>ClimateBooks</span>
        </Link>
        <span style={{ fontSize: "0.875rem", color: "#5A6B61" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#174D36", fontWeight: 600, textDecoration: "none" }}>Log in</Link>
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{ fontFamily: "var(--font-manrope)", fontSize: "1.75rem", fontWeight: 900, color: "#0B352B", marginBottom: "0.4rem" }}>
              Start your climate programme
            </h1>
            <p style={{ color: "#5A6B61", fontSize: "0.9rem" }}>Create your ClimateBooks account for free</p>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #DDE8E2", borderRadius: "1rem", padding: "2rem", boxShadow: "0 2px 12px rgba(11,53,43,0.07)" }}>
            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <AlertCircle size={15} style={{ color: "#DC2626", flexShrink: 0, marginTop: "0.1rem" }} />
                <span style={{ color: "#DC2626", fontSize: "0.875rem" }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              <div>
                <label className="label-cb">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-cb"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="label-cb">Work email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-cb"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="label-cb">Password</label>
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#5A6B61" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: "100%", marginTop: "0.25rem", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.8rem", color: "#5A6B61", lineHeight: 1.5 }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
