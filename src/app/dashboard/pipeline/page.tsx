import Link from "next/link";
import { KanbanSquare, Rows3, Plus } from "lucide-react";
import { pageData } from "@/lib/page";
import { opportunityRows } from "@/lib/rows";
import { optionsFrom } from "@/lib/options";
import { funnel, summarize, stageConversion } from "@/lib/revenue/metrics";
import { periodFor } from "@/lib/revenue/periods";
import { can } from "@/lib/permissions";
import { money, pct } from "@/lib/format";
import { PageHeader, StatCard, Card } from "@/components/app/ui";
import { FormButton } from "@/components/app/forms";
import { opportunityFields } from "@/components/app/fieldsets";
import { Board } from "./Board";
import { OpportunityTable } from "../opportunities/OpportunityTable";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "board" } = await searchParams;
  const { ctx, data, health } = await pageData();
  const rows = opportunityRows(data, health, ctx);
  const opts = optionsFrom(data);
  const s = summarize(data, periodFor("quarter", data.now, data.fiscalStartMonth));
  const stalled = [...health.values()].filter((h) => h.factors.some((f) => f.code === "stalled")).length;
  const conv = stageConversion(data).filter((c) => c.rate != null);
  const openStages = data.stages.filter((st) => st.kind === "open");
  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <PageHeader title="Pipeline" description="Every open deal by stage. Drag cards to move deals; the pipeline, forecast and health scores update immediately."
        actions={<>
          <div className="inline-flex rounded-lg border border-line-strong bg-white p-0.5 text-sm">
            <Link href="/dashboard/pipeline?view=board" className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold", view === "board" ? "bg-navy text-white" : "text-body")}><KanbanSquare size={14} />Board</Link>
            <Link href="/dashboard/pipeline?view=table" className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold", view === "table" ? "bg-navy text-white" : "text-body")}><Rows3 size={14} />Table</Link>
          </div>
          {can(ctx.role, "crm.write") && <FormButton label="New opportunity" icon={<Plus size={15} />} title="New opportunity" endpoint="/api/opportunities" fields={opportunityFields({ ...opts, stages: opts.stages.filter((x) => openStages.some((st) => st.id === x.value)), canAssign: can(ctx.role, "deal.manage_any") })} initial={{ forecast_category: "pipeline", deal_type: "new_business", owner_id: ctx.userId }} submitLabel="Create opportunity" />}
          {can(ctx.role, "pipeline.configure") && <Link href="/dashboard/settings/pipeline" className="btn btn-outline btn-sm">Stages</Link>}
        </>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Open pipeline" value={money(s.pipelineValue, data.currency, true)} sub={`${s.openDeals} deals`} />
        <StatCard label="Weighted pipeline" value={money(s.weightedPipeline, data.currency, true)} sub="Amount × probability" />
        <StatCard label="Pipeline health" value={s.openDeals ? pct(([...health.values()].filter((h) => h.health === "healthy").length / s.openDeals) * 100) : "No deals"} sub="Share of deals scored healthy" />
        <StatCard label="Stalled deals" value={stalled} sub="Beyond expected stage time" />
        <StatCard label="Win rate this quarter" value={pct(s.winRate)} sub="Won of decided deals" />
      </section>
      {view === "table" ? (
        <OpportunityTable rows={rows} currency={data.currency} stages={data.stages.map((x) => x.name)} owners={[...new Set(rows.map((r) => r.owner))]} />
      ) : (
        <Board currency={data.currency} stages={openStages.map((x) => ({ id: x.id, name: x.name, kind: x.kind, probability: x.probability }))} deals={rows.filter((r) => r.status === "open")} />
      )}
      <Card title="Pipeline conversion" description="Share of closed deals that reached each stage and were won. Based on each closed deal's final stage, so it approximates true stage to stage conversion.">
        {conv.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {conv.map((c) => <div key={c.stage} className="rounded-lg bg-canvas p-3"><p className="text-xs text-muted">{c.stage}</p><p className="font-display text-xl font-extrabold text-navy">{pct(c.rate)}</p><p className="text-xs text-muted">{c.won} won of {c.reached}</p></div>)}
          </div>
        ) : <p className="text-sm text-muted">Conversion rates appear once deals are closed won or lost.</p>}
        <p className="mt-4 text-xs text-muted">Value by stage: {funnel(data).map((f) => `${f.stage} ${money(f.value, data.currency, true)}`).join(" · ")}</p>
      </Card>
    </div>
  );
}
