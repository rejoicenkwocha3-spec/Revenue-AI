import { Download } from "lucide-react";
import { pageData } from "@/lib/page";
import { can } from "@/lib/permissions";
import { memberName } from "@/lib/revenue/metrics";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, Card, Restricted } from "@/components/app/ui";
import { SettingsTabs } from "@/components/app/SettingsTabs";

export const metadata = { title: "Audit log" };

export default async function AuditPage() {
  const { ctx, data, supabase } = await pageData();
  if (!can(ctx.role, "audit.view")) return <div className="mx-auto max-w-5xl space-y-5"><PageHeader title="Settings" /><SettingsTabs current="audit" role={ctx.role} /><Restricted what="view the audit log" /></div>;
  const { data: logs } = await supabase.from("audit_logs").select("*").eq("org_id", ctx.orgId).order("created_at", { ascending: false }).limit(200);
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title="Settings" description="A complete record of changes by people, agents, integrations and billing." actions={<a href="/api/reports/export?type=audit" className="btn btn-outline btn-sm"><Download size={14} />Export</a>} />
      <SettingsTabs current="audit" role={ctx.role} />
      <Card bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[860px]">
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>{(logs ?? []).map((l) => <tr key={l.id}><td className="whitespace-nowrap text-muted">{formatDateTime(l.created_at)}</td><td className="whitespace-nowrap">{l.actor_type === "agent" ? `Agent: ${l.agent_key}${l.user_id ? ` (run by ${memberName(data, l.user_id)})` : ""}` : l.actor_type === "user" ? memberName(data, l.user_id) : l.actor_type}</td><td className="font-medium text-ink">{l.action}</td><td className="max-w-[420px] truncate font-mono text-xs text-muted" title={JSON.stringify(l.details)}>{JSON.stringify(l.details)}</td></tr>)}
              {(logs ?? []).length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted">No audit entries yet.</td></tr>}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
