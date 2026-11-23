import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { Plus, FileText, Trash2 } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: "#F0FDF4", color: "#16A34A" },
    processing: { bg: "#EEF3FD", color: "#155EEF" },
    queued: { bg: "#FFFBEB", color: "#D97706" },
    failed: { bg: "#FFF5F5", color: "#DC2626" },
  };
  const s = map[status] ?? map.queued;
  return <span style={{ background: s.bg, color: s.color, fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 100, textTransform: "capitalize" }}>{status}</span>;
}

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, status, similarity_score, created_at, options")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <DashboardHeader title="My Documents" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: 0 }}>
            {documents?.length ?? 0} document{documents?.length !== 1 ? "s" : ""}
          </p>
          <Link href="/dashboard/new" className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1.25rem", display: "inline-flex", gap: "0.5rem" }}>
            <Plus size={15} /> New Analysis
          </Link>
        </div>

        {!documents || documents.length === 0 ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
            <FileText size={40} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>No documents yet</h3>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 1.5rem" }}>Submit your first document for analysis.</p>
            <Link href="/dashboard/new" className="btn-primary" style={{ display: "inline-flex" }}>
              <Plus size={15} /> New Analysis
            </Link>
          </div>
        ) : (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F5F8FC" }}>
                  {["Title", "Status", "Similarity", "AI Check", "Citations", "Submitted", ""].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} style={{ borderTop: "1px solid #F5F8FC" }}>
                    <td style={{ padding: "0.875rem 1.25rem", maxWidth: 240 }}>
                      <Link href={`/dashboard/documents/${doc.id}`} style={{ color: "#102A43", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#155EEF")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#102A43")}
                      >
                        {doc.title ?? "Untitled Document"}
                      </Link>
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem" }}><StatusBadge status={doc.status ?? "queued"} /></td>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.9rem", color: "#263449" }}>
                      {doc.similarity_score !== null && doc.similarity_score !== undefined ? `${doc.similarity_score}%` : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", color: "#64748B" }}>
                      {doc.options?.checkAI ? "Yes" : "No"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", color: "#64748B" }}>
                      {doc.options?.checkCitations ? "Yes" : "No"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", color: "#64748B", whiteSpace: "nowrap" }}>
                      {new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem" }}>
                      <Link href={`/dashboard/documents/${doc.id}`} style={{ color: "#155EEF", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }}>
                        View
                      </Link>
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
