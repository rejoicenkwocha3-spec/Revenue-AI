import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { Share2, Download } from "lucide-react";

export default async function SharedDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch originality reports shared with this user (shared_with jsonb array contains user email or id)
  const { data: sharedReports } = await supabase
    .from("originality_reports")
    .select("id, report_number, generated_at, document_id, shared_with, documents(title, similarity_score, user_id)")
    .contains("shared_with", JSON.stringify([user!.email]))
    .order("generated_at", { ascending: false });

  return (
    <>
      <DashboardHeader title="Shared Documents" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 900 }}>

        {!sharedReports || sharedReports.length === 0 ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
            <Share2 size={40} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>No shared reports yet</h3>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 0.75rem", maxWidth: 420, marginInline: "auto" }}>
              When someone shares an originality report with you, it will appear here. Reports can be shared from the document detail page.
            </p>
          </div>
        ) : (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F5F8FC" }}>
                  {["Document", "Report Number", "Similarity", "Shared On", ""].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sharedReports.map((r) => {
                  const doc = r.documents as { title?: string; similarity_score?: number } | null;
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid #F5F8FC" }}>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.9rem", color: "#102A43", fontWeight: 500 }}>
                        {doc?.title ?? "Untitled Document"}
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", color: "#64748B", fontFamily: "monospace" }}>
                        {r.report_number}
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.9rem" }}>
                        <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, color: (doc?.similarity_score ?? 0) > 30 ? "#D97706" : "#16A34A" }}>
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
        )}
      </div>
    </>
  );
}
