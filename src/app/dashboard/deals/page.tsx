import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { pageData } from "@/lib/page";
import { accountName, memberName, stageMap } from "@/lib/revenue/metrics";
import { money } from "@/lib/format";
import { PageHeader, Card, HealthBadge, Badge, StatCard, EmptyState } from "@/components/app/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Deal Inspection" };

export default async function DealsPage({ searchParams }: { searchParams: Promise<{ health?: string; owner?: string }> }) {
  const sp = await searchParams;
  const { data, health } = await pageData();
  const stages = stageMap(data);
  let list = [...health.values()].map((h) => ({ h, o: data.opportunities.find((o) => o.id === h.opportunityId)! }));
  const counts = { healthy: list.filter((x) => x.h.health === "healthy").length, watch: list.filter((x) => x.h.health === "watch").length, at_risk: list.filter((x) => x.h.health === "at_risk").length };
  const missing = list.filter((x) => x.h.factors.some((f) => f.kind === "missing_information")).length;
  if (sp.health) list = list.filter((x) => x.h.health === sp.health);
  if (sp.owner) list = list.filter((x) => x.o.owner_id === sp.owner);
  list.sort((a, b) => a.h.score - b.h.score || b.o.amount - a.o.amount);
  const tab = (key: string, label: string, n?: number) => (
    <Link href={key ? `/dashboard/deals?health=${key}` : "/dashboard/deals"} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", (sp.health ?? "") === key ? "bg-navy text-white" : "bg-white text-body ring-1 ring-line hover:text-ink")}>{label}{n != null && <span className="ml-1.5 opacity-70">{n}</span>}</Link>
  );
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Deal Inspection" description="Every open deal scored from its activity, stakeholders, stage timing, close date and logged conversations. Missing information is shown separately from risks." />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Healthy" value={counts.healthy} tone="green" />
        <StatCard label="Watch" value={counts.watch} tone="amber" />
        <StatCard label="At risk" value={counts.at_risk} tone="red" />
        <StatCard label="Deals missing information" value={missing} tone="blue" />
      </section>
      <div className="flex flex-wrap gap-2">{tab("", "All open")}{tab("at_risk", "At risk", counts.at_risk)}{tab("watch", "Watch", counts.watch)}{tab("healthy", "Healthy", counts.healthy)}</div>
      <Card bodyClass="p-0">
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map(({ h, o }) => (
              <li key={o.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
                <div className="min-w-0">
                  <Link href={`/dashboard/deals/${o.id}`} className="font-semibold text-ink hover:text-blue">{o.name}</Link>
                  <p className="truncate text-xs text-muted">{accountName(data, o.account_id)} · {memberName(data, o.owner_id)} · {stages.get(o.stage_id ?? "")?.name} · closes {o.close_date ?? "date not set"}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {h.factors.slice(0, 3).map((f) => <Badge key={f.code} tone={f.kind === "missing_information" ? "info" : f.severity}>{f.title}</Badge>)}
                  {h.factors.length === 0 && <span className="text-xs text-muted">No issues detected</span>}
                </div>
                <div className="flex items-center gap-3 md:justify-end">
                  <span className="font-display font-extrabold tabular-nums text-navy">{money(o.amount, data.currency)}</span>
                  <HealthBadge health={h.health} score={h.score} />
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon={ScanSearch} title="No deals to inspect" body="Open deals appear here with a health score and the evidence behind it." />}
      </Card>
    </div>
  );
}
