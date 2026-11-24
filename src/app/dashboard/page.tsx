import Link from "next/link";
import { FolderKanban, CheckCircle2, Loader, Clock, Languages, HardDrive, Plus, Activity, ArrowRight } from "lucide-react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/billing";
import { PageHeader, StatCard, StatusBadge, EmptyState, Notice } from "@/components/app/ui";
import { formatBytes, formatDuration, timeAgo } from "@/lib/utils";
import { languageName } from "@/config/languages";
import { describeActivity } from "@/lib/activity-text";

export const metadata = { title: "Overview" };

const PROCESSING = ["queued", "uploading", "transcribing", "translating", "generating_voice", "synchronising", "rendering"];

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const ctx = await requireAppContext();
  const sp = await searchParams;
  const supabase = await createClient();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5, 1);
  sixMonthsAgo.setUTCHours(0, 0, 0, 0);

  const [{ data: projects }, { data: usageAll }, { data: activity }, ent] = await Promise.all([
    supabase.from("projects").select("id, name, status, target_languages, source_language, duration_seconds, updated_at, media_kind").eq("org_id", ctx.orgId).order("updated_at", { ascending: false }),
    supabase.from("usage_records").select("quantity, created_at").eq("org_id", ctx.orgId).eq("kind", "dub_minutes"),
    supabase.from("activity_logs").select("id, action, details, created_at, user_id, project_id, profiles:user_id(full_name)").eq("org_id", ctx.orgId).order("created_at", { ascending: false }).limit(8),
    getEntitlements(ctx.orgId),
  ]);

  const list = projects ?? [];
  const total = list.length;
  const completed = list.filter((p) => p.status === "completed").length;
  const processing = list.filter((p) => PROCESSING.includes(p.status)).length;
  const minutesProcessed = (usageAll ?? []).reduce((a, r) => a + Number(r.quantity), 0);
  const languages = Array.from(new Set(list.flatMap((p) => (p.target_languages as string[]) ?? [])));

  // monthly usage for the last six months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sixMonthsAgo);
    d.setUTCMonth(d.getUTCMonth() + i);
    return { key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, label: d.toLocaleString("en", { month: "short", timeZone: "UTC" }), value: 0 };
  });
  for (const r of usageAll ?? []) {
    const d = new Date(r.created_at);
    const m = months.find((x) => x.key === `${d.getUTCFullYear()}-${d.getUTCMonth()}`);
    if (m) m.value += Number(r.quantity);
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.value));
  const storagePct = Math.min(100, (ent.storageBytesUsed / Math.max(1, ent.storageBytesIncluded)) * 100);
  const minutesPct = ent.minutesIncluded ? Math.min(100, (ent.minutesUsed / ent.minutesIncluded) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Welcome, ${ctx.fullName.split(" ")[0]}`}
        description={`Here is what is happening in ${ctx.orgName}.`}
        actions={<Link href="/dashboard/projects/new" className="btn btn-primary btn-sm"><Plus size={16} /> New dubbing project</Link>}
      />
      {sp.password === "updated" && <Notice tone="success" className="mb-5">Your password has been updated.</Notice>}
      {!ent.plan && (
        <Notice tone="warning" className="mb-5">
          Your workspace has no active plan, so dubbing is {ent.minutesIncluded ? `limited to ${ent.minutesIncluded} trial minutes` : "paused"}.{" "}
          <Link href="/dashboard/billing" className="font-semibold underline">Choose a plan</Link>
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total projects" value={total} icon={FolderKanban} tone="navy" />
        <StatCard label="Completed dubs" value={completed} icon={CheckCircle2} tone="blue" />
        <StatCard label="Processing" value={processing} icon={Loader} tone="purple" sub={processing ? "Running in the background" : "Nothing in progress"} />
        <StatCard label="Minutes processed" value={minutesProcessed.toFixed(1)} icon={Clock} tone="coral" sub="All time, across every language" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <section className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Monthly usage</h2>
            <p className="text-sm text-muted tabular-nums">
              {ent.minutesUsed.toFixed(1)} of {ent.minutesIncluded} min this period
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-blue" style={{ width: `${minutesPct}%` }} />
          </div>
          <div className="mt-8 grid h-44 grid-cols-6 items-end gap-3 border-b border-line">
            {months.map((m) => (
              <div key={m.key} className="flex h-full flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold tabular-nums text-navy">{m.value ? m.value.toFixed(1) : ""}</span>
                <div className="w-full max-w-12 rounded-t-md bg-blue/85" style={{ height: `${Math.max(m.value ? 4 : 0, (m.value / maxMonth) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-6 gap-3 text-center text-xs text-muted">
            {months.map((m) => <span key={m.key}>{m.label}</span>)}
          </div>
        </section>

        <section className="grid gap-5">
          <div className="card p-6">
            <div className="flex items-center gap-2"><Languages size={18} className="text-purple" /><h2 className="text-lg font-bold">Languages used</h2></div>
            {languages.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {languages.map((l) => <span key={l} className="chip bg-lavender text-purple">{languageName(l)}</span>)}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Target languages appear here once you create a project.</p>
            )}
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-2"><HardDrive size={18} className="text-blue" /><h2 className="text-lg font-bold">Storage</h2></div>
            <p className="mt-3 text-sm tabular-nums text-body">{formatBytes(ent.storageBytesUsed)} of {formatBytes(ent.storageBytesIncluded)}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-purple" style={{ width: `${storagePct}%` }} /></div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="text-lg font-bold">Recent projects</h2>
            <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-blue">View all <ArrowRight size={14} /></Link>
          </div>
          {list.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={FolderKanban} title="No projects yet" body="Create your first dubbing project to upload media and start localizing." action={{ href: "/dashboard/projects/new", label: "Create a project" }} />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {list.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/dashboard/projects/${p.id}`} className="flex flex-wrap items-center gap-3 px-6 py-3.5 hover:bg-canvas/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy">{p.name}</p>
                      <p className="text-xs text-muted">
                        {p.source_language ? languageName(p.source_language) : "Auto detect"} to {(p.target_languages as string[]).map(languageName).join(", ") || "no targets"}
                        {p.duration_seconds ? ` · ${formatDuration(Number(p.duration_seconds))}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                    <span className="w-20 text-right text-xs text-muted">{timeAgo(p.updated_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <div className="flex items-center gap-2 border-b border-line px-6 py-4"><Activity size={17} className="text-coral" /><h2 className="text-lg font-bold">Recent activity</h2></div>
          {(activity ?? []).length === 0 ? (
            <p className="px-6 py-6 text-sm text-muted">Activity from your team appears here.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(activity ?? []).map((a) => (
                <li key={a.id} className="px-6 py-3 text-sm">
                  <p className="text-body">
                    <span className="font-semibold text-navy">{(a.profiles as unknown as { full_name: string } | null)?.full_name ?? "LinguaDub"}</span>{" "}
                    {describeActivity(a.action, a.details as Record<string, unknown>)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{timeAgo(a.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
