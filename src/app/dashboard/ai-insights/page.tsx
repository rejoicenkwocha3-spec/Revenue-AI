import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { Plus, Brain, Info } from "lucide-react";

function IndicatorBadge({ indicator }: { indicator: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    low: { bg: "#F0FDF4", color: "#16A34A" },
    moderate: { bg: "#FFFBEB", color: "#D97706" },
    elevated: { bg: "#FFF5F5", color: "#DC2626" },
    insufficient: { bg: "#F5F8FC", color: "#64748B" },
  };
  const s = map[indicator] ?? map.low;
  return <span style={{ background: s.bg, color: s.color, fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 100, textTransform: "capitalize" }}>{indicator}</span>;
}

export default async function AIInsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reports } = await supabase
    .from("ai_writing_reports")
    .select("id, document_id, overall_indicator, confidence, summary, created_at, documents(title)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <DashboardHeader title="AI Writing Insights" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1 }}>
        <div style={{ background: "#FFF7F5", border: "1px solid #FFD6CF", borderRadius: 10, padding: "0.875rem 1rem", marginBottom: "1.5rem", display: "flex", gap: "0.625rem" }}>
          <Info size={16} color="#FF654F" style={{ flexShrink: 0, marginTop: "0.15rem" }} />
          <p style={{ color: "#7C3A30", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
            AI writing analysis is probabilistic. Indicators are observations based on writing patterns only. They are not evidence of misconduct and must not be used to accuse anyone of using AI without thorough additional review. False positives and false negatives are inherent to this methodology.
          </p>
        </div>

        {!reports || reports.length === 0 ? (
          <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
            <Brain size={40} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>No AI writing reports yet</h3>
            <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 1.5rem" }}>Submit a document with AI writing analysis enabled to see results here.</p>
            <Link href="/dashboard/new" className="btn-primary" style={{ display: "inline-flex" }}><Plus size={15} /> New Analysis</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reports.map((r) => (
              <div key={r.id} style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.25rem 1.5rem", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
                  <div>
                    <Link href={`/dashboard/documents/${r.document_id}`} style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#102A43", textDecoration: "none" }}>
                      {(r.documents as { title?: string } | null)?.title ?? "Untitled Document"}
                    </Link>
                    <p style={{ color: "#94A3B8", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>
                      {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <IndicatorBadge indicator={r.overall_indicator ?? "low"} />
                    <span style={{ color: "#94A3B8", fontSize: "0.75rem" }}>Confidence: {r.confidence ?? "low"}</span>
                  </div>
                </div>
                <p style={{ color: "#64748B", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>{r.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
