import Link from "next/link";
import { Download } from "lucide-react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { DownloadButton } from "@/components/app/DownloadButton";
import { languageName } from "@/config/languages";
import { formatBytes, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Export History" };

export default async function ExportsPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("export_records")
    .select("id, target_language, kind, format, storage_path, size_bytes, created_at, project:projects(id, name)")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .limit(300);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Export History" description="Every rendered file. Download links are private and expire after ten minutes." />
      {!data?.length ? (
        <EmptyState icon={Download} title="No exports yet" body="Exports appear here when a dub finishes rendering." action={{ href: "/dashboard/projects", label: "Go to projects" }} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Project</th><th className="px-4 py-3 font-semibold">Language</th><th className="px-4 py-3 font-semibold">Format</th><th className="px-4 py-3 font-semibold">Size</th><th className="px-4 py-3 font-semibold">Created</th><th className="px-4 py-3" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {data.map((e) => {
                const p = e.project as unknown as { id: string; name: string } | null;
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-3">{p ? <Link href={`/dashboard/projects/${p.id}`} className="font-semibold text-navy hover:text-blue">{p.name}</Link> : ""}</td>
                    <td className="px-4 py-3">{languageName(e.target_language)}</td>
                    <td className="px-4 py-3"><span className="rounded bg-canvas px-2 py-0.5 text-xs font-bold uppercase text-navy">{e.format}</span></td>
                    <td className="px-4 py-3 tabular-nums">{formatBytes(Number(e.size_bytes))}</td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(e.created_at)}</td>
                    <td className="px-4 py-3 text-right"><DownloadButton bucket="exports" path={e.storage_path} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
