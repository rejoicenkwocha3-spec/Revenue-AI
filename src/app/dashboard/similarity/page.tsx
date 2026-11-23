import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { Plus, BarChart2 } from "lucide-react";

export default async function SimilarityReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: results } = await supabase
    .from("similarity_results")
    .select("id, document_id, similarity_score, created_at, documents(title)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <DashboardHeader title="Similarity Reports" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1 }}>
        {!results || results.length === 0 ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
            <BarChart2 size={40} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>No similarity reports yet</h3>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 1.5rem" }}>Submit a document to generate your first similarity report.</p>
            <Link href="/dashboard/new" className="btn-primary" style={{ display: "inline-flex" }}><Plus size={15} /> New Analysis</Link>
          </div>
        ) : (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F5F8FC" }}>
                  {["Document", "Similarity Score", "Date", ""].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #F5F8FC" }}>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.9rem", color: "#102A43", fontWeight: 500 }}>
                      {(r.documents as { title?: string } | null)?.title ?? "Untitled"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem" }}>
                      <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: (r.similarity_score ?? 0) > 30 ? "#D97706" : "#16A34A" }}>
                        {r.similarity_score ?? 0}%
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", color: "#64748B" }}>
                      {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem" }}>
                      <Link href={`/dashboard/documents/${r.document_id}`} style={{ color: "#155EEF", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
