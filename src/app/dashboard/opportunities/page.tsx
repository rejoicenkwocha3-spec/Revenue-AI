import { Plus, Briefcase } from "lucide-react";
import { pageData } from "@/lib/page";
import { opportunityRows } from "@/lib/rows";
import { optionsFrom } from "@/lib/options";
import { can } from "@/lib/permissions";
import { PageHeader, Card, EmptyState } from "@/components/app/ui";
import { FormButton } from "@/components/app/forms";
import { opportunityFields } from "@/components/app/fieldsets";
import { OpportunityTable } from "./OpportunityTable";
import { AutoOpen } from "./AutoOpen";

export const metadata = { title: "Opportunities" };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ new?: string; health?: string }> }) {
  const sp = await searchParams;
  const { ctx, data, health } = await pageData();
  const rows = opportunityRows(data, health, ctx);
  const opts = optionsFrom(data);
  const fields = opportunityFields({ ...opts, stages: opts.stages.filter((x) => data.stages.find((s) => s.id === x.value)?.kind === "open"), canAssign: can(ctx.role, "deal.manage_any") });
  const canCreate = can(ctx.role, "crm.write");
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Opportunities" description="Create, assign and track every deal. Open a deal for full detail, stakeholders, activity and AI inspection."
        actions={canCreate && <FormButton label="New opportunity" icon={<Plus size={15} />} title="New opportunity" endpoint="/api/opportunities" fields={fields} initial={{ forecast_category: "pipeline", deal_type: "new_business", owner_id: ctx.userId }} submitLabel="Create opportunity" />} />
      {canCreate && sp.new === "1" && <AutoOpen fields={fields} ownerId={ctx.userId} />}
      {rows.length ? (
        <OpportunityTable rows={rows} currency={data.currency} stages={data.stages.map((s) => s.name)} owners={[...new Set(rows.map((r) => r.owner))]} initialHealth={sp.health ?? ""} />
      ) : (
        <Card><EmptyState icon={Briefcase} title="No opportunities yet" body="Create your first opportunity or connect Salesforce, HubSpot or Pipedrive to import your pipeline." action={{ href: "/dashboard/integrations", label: "Connect a CRM" }} /></Card>
      )}
    </div>
  );
}
