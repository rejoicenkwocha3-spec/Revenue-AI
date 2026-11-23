import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { FileBarChart2, Download, Plus } from "lucide-react";

export default async function SavedReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reports } = await supabase
    .from("originality_reports")
    .select("id, report_number, generated_at, document_id, documents(title, similarity_score)")
    .eq("user_id", user!.id)
    .order("generated_at", { ascending: false });

  return (
    <>
      <DashboardHeader title="Saved Reports" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 900 }}>

        {!reports || reports.length === 0 ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
            <FileBarChart2 size={40} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>No reports yet</h3>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 1.5rem" }}>Completed analyses generate originality reports. Submit your first document to get started.</p>
            <Link href="/dashboard/new" className="btn-primary" style={{ display: "inline-flex" }}>
              <Plus size={15} style={{ marginRight: "0.5rem" }} /> New Analysis
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 1.25rem" }}>
              {reports.length} report{reports.length !== 1 ? "s" : ""} generated
            </p>
            <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F5F8FC" }}>
                    {["Document", "Report Number", "Similarity", "Generated", ""].map((h) => (
                      <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const doc = r.documents as { title?: string; similarity_score?: number } | null;
                    return (
                      <tr key={r.id} style={{ borderTop: "1px solid #F5F8FC" }}>
                        <td style={{ padding: "0.875rem 1.25rem" }}>
                          <Link href={`/dashboard/documents/${r.document_id}`} style={{ color: "#102A43", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
                            onMouseOver={(e) => (e.currentTarget.style.color = "#155EEF")}
                            onMouseOut={(e) => (e.currentTarget.style.color = "#102A43")}>
                            {doc?.title ?? "Untitled Document"}
                          </Link>
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8125rem", color: "#64748B", fontFamily: "monospace" }}>
                          {r.report_number}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem" }}>
                          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: (doc?.similarity_score ?? 0) > 30 ? "#D97706" : "#16A34A" }}>
                            {doc?.similarity_score ?? 0}%
                          </span>
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", color: "#64748B" }}>
                          {new Date(r.generated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem" }}>
                          <Link href={`/api/reports/${r.document_id}/pdf`} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "#155EEF", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }}>
                            <Download size={14} /> Download
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
