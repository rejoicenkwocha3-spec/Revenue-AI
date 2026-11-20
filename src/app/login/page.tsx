"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import SearchSproutLogo from "@/components/SearchSproutLogo";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/overview");
    router.refresh();
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
            Welcome back
          </h1>
          <p style={{ textAlign: "center", color: "#65736D", fontSize: "0.9375rem", margin: "0 0 2rem" }}>
            Log in to your SearchSprout account
          </p>

          {error && (
            <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.9rem", color: "#991B1B" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                <label className="label-ss" style={{ margin: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: "0.8125rem", color: "#16C653", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-ss"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
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
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.9rem", color: "#65736D", margin: "1.5rem 0 0" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "#16C653", fontWeight: 600, textDecoration: "none" }}>
              Sign up free
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
