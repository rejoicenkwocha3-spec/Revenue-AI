import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { Plus, PenTool, Info } from "lucide-react";

export default async function AuthorshipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, status, created_at")
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  return (
    <>
      <DashboardHeader title="Authorship Insights" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 800 }}>
        <div style={{ background: "#EEF3FD", border: "1px solid #BDD0F8", borderRadius: 10, padding: "0.875rem 1rem", marginBottom: "1.5rem", display: "flex", gap: "0.625rem" }}>
          <Info size={16} color="#155EEF" style={{ flexShrink: 0, marginTop: "0.15rem" }} />
          <p style={{ color: "#1A3A6B", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
            Authorship analysis compares writing style consistency across multiple documents. It requires at least two completed documents to generate a comparison. Findings are presented as supporting observations only. TrueAuthor does not confirm or verify authorship.
          </p>
        </div>

        {!docs || docs.length < 2 ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
            <PenTool size={40} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>
              {docs && docs.length === 1 ? "One more document needed" : "No completed documents yet"}
            </h3>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 1.5rem", maxWidth: 400, marginInline: "auto" }}>
              Authorship analysis requires at least two completed document analyses to compare writing style patterns.
            </p>
            <Link href="/dashboard/new" className="btn-primary" style={{ display: "inline-flex" }}><Plus size={15} /> New Analysis</Link>
          </div>
        ) : (
          <div>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 1rem" }}>
              Select documents to compare
            </h2>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", marginBottom: "1.25rem" }}>
              Select two or more completed documents to initiate an authorship style comparison.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {docs.map((doc) => (
                <label key={doc.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 10, padding: "1rem 1.25rem", cursor: "pointer" }}>
                  <input type="checkbox" style={{ width: 16, height: 16, accentColor: "#155EEF" }} />
                  <div>
                    <p style={{ fontWeight: 600, color: "#102A43", fontSize: "0.9375rem", margin: 0 }}>{doc.title ?? "Untitled"}</p>
                    <p style={{ color: "#94A3B8", fontSize: "0.8125rem", margin: 0 }}>
                      {new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p style={{ color: "#94A3B8", fontSize: "0.875rem" }}>
              Full authorship comparison analysis is available in the Professional and Institution plans.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
