"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import SearchSproutLogo from "@/components/SearchSproutLogo";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7FAF8", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#E8F8EE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <CheckCircle2 size={30} color="#16C653" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>Check your email</h1>
          <p style={{ color: "#65736D", lineHeight: 1.65, marginBottom: "1.5rem" }}>
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your SearchSprout account.
          </p>
          <Link href="/login" className="btn-primary" style={{ justifyContent: "center" }}>
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7FAF8", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
            <SearchSproutLogo size={40} />
            <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.25rem", color: "#071F20" }}>SearchSprout</span>
          </Link>
        </div>

        <div className="card-ss" style={{ padding: "2.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem", textAlign: "center" }}>
            Start building for free
          </h1>
          <p style={{ textAlign: "center", color: "#65736D", fontSize: "0.9375rem", margin: "0 0 2rem" }}>
            Create your SearchSprout account
          </p>

          {error && (
            <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.9rem", color: "#991B1B" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label-ss">Full name</label>
              <input
                type="text"
                className="input-ss"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="label-ss">Email address</label>
              <input
                type="email"
                className="input-ss"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label-ss">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-ss"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#65736D" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.8125rem", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}
            >
              {loading && <Loader2 size={18} className="spin" />}
              {loading ? "Creating account..." : "Create free account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#65736D", margin: "1.25rem 0 0", lineHeight: 1.5 }}>
            By signing up, you agree to our{" "}
            <span style={{ color: "#16C653" }}>Terms of Service</span> and{" "}
            <span style={{ color: "#16C653" }}>Privacy Policy</span>.
          </p>

          <p style={{ textAlign: "center", fontSize: "0.9rem", color: "#65736D", margin: "1rem 0 0" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#16C653", fontWeight: 600, textDecoration: "none" }}>
              Log in
            </Link>
          </p>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    </div>
  );
}
