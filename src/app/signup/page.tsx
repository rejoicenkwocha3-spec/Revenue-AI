"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TrueAuthorLogo from "@/components/TrueAuthorLogo";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, role: form.role } },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F8FC", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: 460 }}>
          <div style={{ width: 64, height: 64, background: "#EEF3FD", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <CheckCircle2 size={32} color="#155EEF" />
          </div>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.75rem", color: "#102A43", margin: "0 0 0.75rem" }}>Check your email</h1>
          <p style={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 2rem" }}>
            We sent a verification link to <strong>{form.email}</strong>. Click the link to activate your TrueAuthor account.
          </p>
          <Link href="/login" className="btn-primary" style={{ display: "inline-flex" }}>Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F5F8FC" }}>
      <div style={{ flex: "0 0 460px", background: "linear-gradient(150deg, #102A43 0%, #155EEF 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "3rem", color: "white" }} className="auth-left">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "3rem" }}>
          <TrueAuthorLogo size={36} variant="white" />
          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.25rem", color: "white" }}>TrueAuthor</span>
        </Link>
        <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.875rem", color: "white", lineHeight: 1.2, margin: "0 0 1rem" }}>
          Start Analysing Your Writing Today
        </h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 2rem" }}>
          Create a free TrueAuthor account and run your first originality analysis in minutes.
        </p>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>Free account includes</p>
          {["5 document analyses", "Similarity checking", "Originality reports", "Citation checker", "Grammar analysis"].map((item) => (
            <div key={item} style={{ display: "flex", gap: "0.625rem", alignItems: "center", color: "rgba(255,255,255,0.85)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              <CheckCircle2 size={14} color="#FF654F" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.75rem", color: "#102A43", margin: "0 0 0.5rem" }}>Create your account</h1>
          <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 2rem" }}>
            Already have an account? <Link href="/login" style={{ color: "#155EEF", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>

          {error && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#FFF5F5", border: "1px solid #FCC", borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1.25rem" }}>
              <AlertCircle size={18} color="#D44" style={{ flexShrink: 0 }} />
              <p style={{ color: "#922", fontSize: "0.9rem", margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>Full name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Your full name"
                style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none" }}
                onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>Email address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="you@university.edu"
                style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none" }}
                onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>I am a</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none" }}
                onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="researcher">Researcher</option>
                <option value="administrator">Administrator</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="At least 8 characters"
                  style={{ width: "100%", padding: "0.75rem 2.75rem 0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none" }}
                  onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center", opacity: loading ? 0.7 : 1, marginTop: "0.25rem" }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p style={{ color: "#94A3B8", fontSize: "0.8125rem", textAlign: "center", marginTop: "1.25rem", lineHeight: 1.6 }}>
            By creating an account you agree to TrueAuthor&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .auth-left { display: none !important; } }
      `}</style>
    </div>
  );
}
