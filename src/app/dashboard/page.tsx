import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { FileText, BarChart2, Brain, Plus, ArrowRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";

function StatCard({ label, value, sub, color = "#155EEF" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.25rem 1.5rem", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
      <p style={{ color: "#64748B", fontSize: "0.8125rem", fontWeight: 500, margin: "0 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.875rem", color, margin: "0 0 0.25rem" }}>{value}</p>
      {sub && <p style={{ color: "#94A3B8", fontSize: "0.8125rem", margin: 0 }}>{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: "#F0FDF4", color: "#16A34A" },
    processing: { bg: "#EEF3FD", color: "#155EEF" },
    queued: { bg: "#FFFBEB", color: "#D97706" },
    failed: { bg: "#FFF5F5", color: "#DC2626" },
  };
  const s = map[status] ?? map.queued;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 100, textTransform: "capitalize" }}>{status}</span>
  );
}

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, status, similarity_score, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: totalDocs } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: completedDocs } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("status", "completed");

  const { data: avgData } = await supabase
    .from("documents")
    .select("similarity_score")
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .not("similarity_score", "is", null);

  const avgSim = avgData && avgData.length > 0
    ? Math.round(avgData.reduce((a, d) => a + (d.similarity_score ?? 0), 0) / avgData.length)
    : null;

  const thisMonth = new Date();
  thisMonth.setDate(1);
  const { count: monthDocs } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .gte("created_at", thisMonth.toISOString());

  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <>
      <DashboardHeader title="Overview" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1 }}>

        {/* Welcome */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: "1.5rem", color: "#102A43", margin: "0 0 0.375rem" }}>
            Welcome back, {name}
          </h2>
          <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: 0 }}>
            Here is an overview of your writing analysis activity.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <StatCard label="Total Documents" value={totalDocs ?? 0} sub="All time" />
          <StatCard label="Avg Similarity" value={avgSim !== null ? `${avgSim}%` : "—"} sub="Completed reports" color="#2864DC" />
          <StatCard label="This Month" value={monthDocs ?? 0} sub="Documents analysed" color="#102A43" />
          <StatCard label="Completed Reports" value={completedDocs ?? 0} sub="Ready to view" color="#16A34A" />
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { href: "/dashboard/new", icon: Plus, label: "New Analysis", desc: "Upload a document and run a full analysis", color: "#155EEF" },
            { href: "/dashboard/documents", icon: FileText, label: "My Documents", desc: "View all submitted documents and reports", color: "#2864DC" },
            { href: "/dashboard/similarity", icon: BarChart2, label: "Similarity Reports", desc: "Review completed similarity reports", color: "#102A43" },
            { href: "/dashboard/ai-insights", icon: Brain, label: "AI Writing Insights", desc: "Review AI writing indicator results", color: "#FF654F" },
          ].map((a) => (
            <Link key={a.href} href={a.href} style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "1.25rem", textDecoration: "none", display: "flex", flexDirection: "column", gap: "0.625rem", boxShadow: "0 1px 4px rgba(16,42,67,0.06)", transition: "box-shadow 0.2s" }}
              onMouseOver={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(21,94,239,0.1)")}
              onMouseOut={(e) => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(16,42,67,0.06)")}
            >
              <div style={{ width: 40, height: 40, background: "#EEF3FD", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <a.icon size={20} color={a.color} />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9375rem", color: "#102A43", margin: "0 0 0.25rem" }}>{a.label}</p>
                <p style={{ color: "#64748B", fontSize: "0.8125rem", margin: 0, lineHeight: 1.5 }}>{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent documents */}
        <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(16,42,67,0.06)" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #D1DCF0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#102A43", margin: 0 }}>Recent Documents</h3>
            <Link href="/dashboard/documents" style={{ color: "#155EEF", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {!documents || documents.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <FileText size={36} color="#D1DCF0" style={{ marginBottom: "1rem" }} />
              <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1rem", color: "#102A43", margin: "0 0 0.5rem" }}>No documents yet</p>
              <p style={{ color: "#64748B", fontSize: "0.9rem", margin: "0 0 1.25rem" }}>Submit your first document for analysis.</p>
              <Link href="/dashboard/new" className="btn-primary" style={{ display: "inline-flex", fontSize: "0.875rem" }}>
                <Plus size={15} /> New Analysis
              </Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F5F8FC" }}>
                  {["Title", "Status", "Similarity", "Submitted"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1.5rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} style={{ borderTop: "1px solid #F5F8FC" }}>
                    <td style={{ padding: "0.875rem 1.5rem", fontSize: "0.9rem", color: "#102A43", fontWeight: 500 }}>
                      <Link href={`/dashboard/documents/${doc.id}`} style={{ color: "#102A43", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#155EEF")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#102A43")}
                      >
                        {doc.title ?? "Untitled Document"}
                      </Link>
                    </td>
                    <td style={{ padding: "0.875rem 1.5rem" }}><StatusBadge status={doc.status ?? "queued"} /></td>
                    <td style={{ padding: "0.875rem 1.5rem", fontSize: "0.9rem", color: "#263449" }}>
                      {doc.similarity_score !== null && doc.similarity_score !== undefined ? `${doc.similarity_score}%` : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1.5rem", fontSize: "0.875rem", color: "#64748B" }}>
                      {new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
