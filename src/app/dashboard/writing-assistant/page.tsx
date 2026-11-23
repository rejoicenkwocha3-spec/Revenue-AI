import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function WritingAssistantPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <DashboardHeader title="Writing Assistant" user={{ name: user?.user_metadata?.full_name, email: user?.email }} />
      <div style={{ padding: "2rem", flex: 1 }}>
        <div style={{ background: "#ffffff", border: "1px solid #D1DCF0", borderRadius: 12, padding: "4rem 2rem", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.125rem", color: "#102A43", margin: "0 0 0.5rem" }}>Writing Assistant</h3>
          <p style={{ color: "#64748B", fontSize: "0.9375rem", margin: "0 0 1.5rem" }}>This feature is coming soon. Submit a document to begin.</p>
          <Link href="/dashboard/new" className="btn-primary" style={{ display: "inline-flex" }}><Plus size={15} style={{ marginRight: "0.5rem" }} /> New Analysis</Link>
        </div>
      </div>
    </>
  );
}
