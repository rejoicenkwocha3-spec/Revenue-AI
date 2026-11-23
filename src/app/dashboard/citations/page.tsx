import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { Plus, Quote, AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function CitationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reports } = await supabase
    .from("citation_reports")
    .select("id, document_id, total_citations, issues_count, issues, citation_style, summary, created_at, documents(title)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <DashboardHeader title="Citation Checker" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1 }}>
        {!reports || reports.length === 0 ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
            <Quote size={40} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>No citation reports yet</h3>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 1.5rem" }}>Submit a document with citation checking enabled.</p>
            <Link href="/dashboard/new" className="btn-primary" style={{ display: "inline-flex" }}><Plus size={15} /> New Analysis</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reports.map((r) => (
              <div key={r.id} style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #D1DCF0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Link href={`/dashboard/documents/${r.document_id}`} style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#102A43", textDecoration: "none" }}>
                      {(r.documents as { title?: string } | null)?.title ?? "Untitled"}
                    </Link>
                    <p style={{ color: "#94A3B8", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>
                      {r.citation_style !== "unknown" ? `Detected style: ${r.citation_style} · ` : ""}{r.total_citations ?? 0} citation{r.total_citations !== 1 ? "s" : ""} · {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span style={{ background: (r.issues_count ?? 0) > 0 ? "#FFFBEB" : "#F0FDF4", color: (r.issues_count ?? 0) > 0 ? "#D97706" : "#16A34A", fontSize: "0.8125rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: 100 }}>
                    {(r.issues_count ?? 0) > 0 ? `${r.issues_count} issue${r.issues_count !== 1 ? "s" : ""}` : "No issues"}
                  </span>
                </div>
                <div style={{ padding: "1rem 1.5rem" }}>
                  <p style={{ color: "#64748B", fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 0.75rem" }}>{r.summary}</p>
                  {r.issues && (r.issues as string[]).length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {(r.issues as string[]).map((issue, i) => (
                        <li key={i} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", color: "#263449", fontSize: "0.875rem", lineHeight: 1.5 }}>
                          <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: "0.15rem" }} />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
