import { pageData } from "@/lib/page";
import { can } from "@/lib/permissions";
import { PageHeader, Restricted } from "@/components/app/ui";
import { SettingsTabs } from "@/components/app/SettingsTabs";
import { StageEditor } from "./StageEditor";

export const metadata = { title: "Pipeline stages" };

export default async function PipelineSettings() {
  const { ctx, data } = await pageData();
  const canEdit = can(ctx.role, "pipeline.configure");
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Settings" description="Pipeline stages drive the Kanban board, default probabilities, stall detection and forecasting." />
      <SettingsTabs current="pipeline" role={ctx.role} />
      {!canEdit && <Restricted what="change pipeline stages" />}
      <StageEditor canEdit={canEdit} initial={data.stages.map((s) => ({ ...s, deals: data.opportunities.filter((o) => o.stage_id === s.id).length }))} />
    </div>
  );
}
