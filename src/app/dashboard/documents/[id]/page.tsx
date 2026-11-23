import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ArrowLeft, Download, Clock, CheckCircle2, AlertTriangle, Info } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: "#F0FDF4", color: "#16A34A" },
    processing: { bg: "#EEF3FD", color: "#155EEF" },
    queued: { bg: "#FFFBEB", color: "#D97706" },
    failed: { bg: "#FFF5F5", color: "#DC2626" },
  };
  const s = map[status] ?? map.queued;
  return <span style={{ background: s.bg, color: s.color, fontSize: "0.8125rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: 100, textTransform: "capitalize" }}>{status}</span>;
}

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!doc) notFound();

  const { data: similarityReport } = await supabase
    .from("similarity_results")
    .select("*")
    .eq("document_id", id)
    .single();

  const { data: aiReport } = await supabase
    .from("ai_writing_reports")
    .select("*")
    .eq("document_id", id)
    .single();

  const { data: citationReport } = await supabase
    .from("citation_reports")
    .select("*")
    .eq("document_id", id)
    .single();

  return (
    <>
      <DashboardHeader title={doc.title ?? "Document"} user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1, maxWidth: 900 }}>

        {/* Back + meta */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <Link href="/dashboard/documents" style={{ color: "#64748B", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem" }}>
            <ArrowLeft size={16} /> Documents
          </Link>
          <span style={{ color: "#D1DCF0" }}>|</span>
          <StatusBadge status={doc.status} />
        </div>

        <h1 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.5rem", color: "#102A43", margin: "0 0 0.5rem" }}>{doc.title ?? "Untitled Document"}</h1>
        <p style={{ color: "#64748B", fontSize: "0.875rem", margin: "0 0 2rem" }}>
          Submitted {new Date(doc.created_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>

        {/* Processing notice */}
        {doc.status === "queued" || doc.status === "processing" ? (
          <div style={{ background: "#EEF3FD", border: "1px solid #BDD0F8", borderRadius: 10, padding: "1.25rem 1.5rem", display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "2rem" }}>
            <Clock size={20} color="#155EEF" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, color: "#102A43", margin: "0 0 0.25rem" }}>Analysis in progress</p>
              <p style={{ color: "#64748B", fontSize: "0.875rem", margin: 0 }}>Your document is being analysed. This typically takes 1 to 3 minutes. Refresh the page to check for updates.</p>
            </div>
          </div>
        ) : null}

        {doc.status === "failed" && (
          <div style={{ background: "#FFF5F5", border: "1px solid #FCC", borderRadius: 10, padding: "1.25rem 1.5rem", display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "2rem" }}>
            <AlertTriangle size={20} color="#D44" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, color: "#922", margin: "0 0 0.25rem" }}>Analysis failed</p>
              <p style={{ color: "#922", fontSize: "0.875rem", margin: 0 }}>{doc.error_message ?? "An error occurred during analysis. Please try resubmitting."}</p>
            </div>
          </div>
        )}

        {doc.status === "completed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "1rem" }}>
              <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.25rem", textAlign: "center", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
                <p style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>Similarity</p>
                <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "2rem", color: (doc.similarity_score ?? 0) > 30 ? "#D97706" : "#16A34A", margin: "0 0 0.25rem" }}>
                  {doc.similarity_score ?? 0}%
                </p>
                <p style={{ color: "#94A3B8", fontSize: "0.75rem", margin: 0 }}>Similarity score</p>
              </div>
              {aiReport && (
                <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.25rem", textAlign: "center", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
                  <p style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>AI Indicators</p>
                  <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.25rem", color: "#102A43", margin: "0 0 0.25rem", textTransform: "capitalize" }}>
                    {aiReport.overall_indicator ?? "—"}
                  </p>
                  <p style={{ color: "#94A3B8", fontSize: "0.75rem", margin: 0 }}>Confidence: {aiReport.confidence ?? "—"}</p>
                </div>
              )}
              {citationReport && (
                <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.25rem", textAlign: "center", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
                  <p style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>Citations</p>
                  <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "2rem", color: "#102A43", margin: "0 0 0.25rem" }}>
                    {citationReport.total_citations ?? 0}
                  </p>
                  <p style={{ color: "#94A3B8", fontSize: "0.75rem", margin: 0 }}>{citationReport.issues_count ?? 0} issue{citationReport.issues_count !== 1 ? "s" : ""}</p>
                </div>
              )}
            </div>

            {/* Similarity detail */}
            {similarityReport && (
              <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #D1DCF0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#102A43", margin: 0 }}>Similarity Analysis</h3>
                </div>
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ background: "#F5F8FC", borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1rem", display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                    <Info size={16} color="#155EEF" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                    <p style={{ color: "#64748B", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                      A similarity score indicates text that resembles sources in our comparison database. It does not confirm plagiarism. Similarity may arise from common academic phrases, properly cited quotations or coincidental phrasing.
                    </p>
                  </div>
                  {similarityReport.matched_sources && (
                    <div>
                      <p style={{ fontWeight: 600, color: "#263449", fontSize: "0.875rem", marginBottom: "0.75rem" }}>Matched sources</p>
                      {(similarityReport.matched_sources as Array<{ source: string; percentage: number; type: string }>).map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.625rem 0", borderBottom: "1px solid #F5F8FC" }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: "#263449", fontSize: "0.875rem", margin: "0 0 0.125rem" }}>{s.source}</p>
                            <p style={{ color: "#94A3B8", fontSize: "0.75rem", margin: 0, textTransform: "capitalize" }}>{s.type}</p>
                          </div>
                          <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, color: "#155EEF", fontSize: "0.875rem" }}>{s.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Writing */}
            {aiReport && (
              <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #D1DCF0" }}>
                  <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#102A43", margin: 0 }}>AI Writing Insights</h3>
                </div>
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ background: "#FFF7F5", borderRadius: 8, padding: "0.875rem 1rem", marginBottom: "1rem", display: "flex", gap: "0.625rem" }}>
                    <Info size={16} color="#FF654F" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                    <p style={{ color: "#7C3A30", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                      AI writing analysis is probabilistic and subject to false positives and false negatives. These results are contextual observations, not definitive findings of misconduct.
                    </p>
                  </div>
                  <p style={{ color: "#263449", fontSize: "0.9375rem", lineHeight: 1.7 }}>{aiReport.summary ?? "Analysis complete. Review the indicators below for detailed observations."}</p>
                </div>
              </div>
            )}

            {/* Citation report */}
            {citationReport && (
              <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #D1DCF0" }}>
                  <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#102A43", margin: 0 }}>Citation Review</h3>
                </div>
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <p style={{ color: "#263449", fontSize: "0.9375rem", lineHeight: 1.7 }}>{citationReport.summary ?? "Citation review complete."}</p>
                  {citationReport.issues && (citationReport.issues as string[]).length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, margin: "0.75rem 0 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {(citationReport.issues as string[]).map((issue, i) => (
                        <li key={i} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", color: "#263449", fontSize: "0.875rem" }}>
                          <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: "0.15rem" }} />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Download */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <Link href={`/api/reports/${id}/pdf`} className="btn-primary" style={{ display: "inline-flex", gap: "0.5rem", fontSize: "0.875rem" }}>
                <Download size={15} /> Download PDF Report
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
