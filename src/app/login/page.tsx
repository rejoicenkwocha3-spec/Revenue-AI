"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TrueAuthorLogo from "@/components/TrueAuthorLogo";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F5F8FC" }}>
      {/* Left panel */}
      <div style={{ flex: "0 0 460px", background: "linear-gradient(150deg, #102A43 0%, #155EEF 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "3rem", color: "white" }} className="auth-left">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "3rem" }}>
          <TrueAuthorLogo size={36} variant="white" />
          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.25rem", color: "white" }}>TrueAuthor</span>
        </Link>
        <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.875rem", color: "white", lineHeight: 1.2, margin: "0 0 1rem" }}>
          Original Work.<br />Authentic Thinking.<br />Trusted Results.
        </h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 2.5rem" }}>
          Log in to your TrueAuthor account to access your documents, reports and writing analysis tools.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {["Similarity checking and originality reports", "AI writing insights with responsible analysis", "Citation review and grammar feedback"].map((item) => (
            <div key={item} style={{ display: "flex", gap: "0.75rem", alignItems: "center", color: "rgba(255,255,255,0.85)", fontSize: "0.9375rem" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF654F", flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.75rem", color: "#102A43", margin: "0 0 0.5rem" }}>Welcome back</h1>
          <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 2rem" }}>
            New to TrueAuthor? <Link href="/signup" style={{ color: "#155EEF", fontWeight: 600, textDecoration: "none" }}>Create an account</Link>
          </p>

          {error && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#FFF5F5", border: "1px solid #FCC", borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1.25rem" }}>
              <AlertCircle size={18} color="#D44" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
              <p style={{ color: "#922", fontSize: "0.9rem", margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@university.edu"
                style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none", transition: "border 0.2s" }}
                onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#263449" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: "0.875rem", color: "#155EEF", fontWeight: 500, textDecoration: "none" }}>Forgot password?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  style={{ width: "100%", padding: "0.75rem 2.75rem 0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none", transition: "border 0.2s" }}
                  onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0 }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .auth-left { display: none !important; } }
      `}</style>
    </div>
  );
}
