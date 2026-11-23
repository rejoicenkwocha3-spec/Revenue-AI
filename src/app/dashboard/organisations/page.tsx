"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import { createClient } from "@/lib/supabase/client";
import { Building2, AlertCircle } from "lucide-react";

export default function CreateOrganisationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("university");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Create organisation
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: org, error: orgErr } = await supabase
      .from("organisations")
      .insert({ name: name.trim(), type, slug: `${slug}-${Date.now()}`, owner_id: user.id })
      .select("id")
      .single();

    if (orgErr || !org) {
      setError(orgErr?.message ?? "Failed to create organisation.");
      setLoading(false);
      return;
    }

    // Add user as owner member
    await supabase.from("organisation_members").insert({
      organisation_id: org.id,
      user_id: user.id,
      role: "owner",
      invited_by: user.id,
    });

    // Update profile
    await supabase.from("profiles").update({ organisation_id: org.id }).eq("id", user.id);

    router.push("/dashboard/team");
  }

  return (
    <>
      <DashboardHeader title="Create Organisation" />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 48, height: 48, background: "#EEF3FD", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={24} color="#155EEF" />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.25rem", color: "#102A43", margin: 0 }}>Create an Organisation</h2>
            <p style={{ color: "#64748B", fontSize: "0.875rem", margin: 0 }}>Invite team members, manage departments and collect submissions.</p>
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#FFF5F5", border: "1px solid #FCC", borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1.5rem" }}>
            <AlertCircle size={18} color="#D44" style={{ flexShrink: 0 }} />
            <p style={{ color: "#922", fontSize: "0.9rem", margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>Organisation name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. University of Example"
              style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none" }}
              onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
              onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#263449", marginBottom: "0.375rem" }}>Organisation type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #D1DCF0", borderRadius: 8, fontSize: "0.9375rem", color: "#263449", background: "#ffffff", outline: "none" }}
              onFocus={(e) => (e.target.style.border = "1.5px solid #155EEF")}
              onBlur={(e) => (e.target.style.border = "1.5px solid #D1DCF0")}>
              <option value="university">University</option>
              <option value="college">College</option>
              <option value="school">Secondary School</option>
              <option value="research_institution">Research Institution</option>
              <option value="publisher">Publisher</option>
              <option value="corporate">Corporate Organisation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating..." : "Create Organisation"}
          </button>
        </form>
      </div>
    </>
  );
}
