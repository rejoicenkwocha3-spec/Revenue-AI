import Link from "next/link";
import { Languages } from "lucide-react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { languageName } from "@/config/languages";

export const metadata = { title: "Translations" };

export default async function TranslationsPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const [{ data: rows }, { data: projects }] = await Promise.all([
    supabase.from("translation_segments").select("project_id, target_language, status, provider").eq("org_id", ctx.orgId),
    supabase.from("projects").select("id, name").eq("org_id", ctx.orgId),
  ]);
  const names = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const groups = new Map<string, { projectId: string; lang: string; total: number; approved: number; edited: number; provider: string | null }>();
  for (const r of rows ?? []) {
    const k = `${r.project_id}:${r.target_language}`;
    const g = groups.get(k) ?? { projectId: r.project_id, lang: r.target_language, total: 0, approved: 0, edited: 0, provider: r.provider };
    g.total++;
    if (r.status === "approved") g.approved++;
    if (r.status === "edited") g.edited++;
    groups.set(k, g);
  }
  const list = Array.from(groups.values());
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Translations" description="Review progress for every translated script. Open a project to edit and approve lines." />
      {!list.length ? (
        <EmptyState icon={Languages} title="No translations yet" body="Translations are created after a project is transcribed." action={{ href: "/dashboard/projects", label: "Go to projects" }} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Project</th><th className="px-4 py-3 font-semibold">Language</th><th className="px-4 py-3 font-semibold">Review progress</th><th className="px-4 py-3 font-semibold">Engine</th><th className="px-4 py-3" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((g) => (
                <tr key={`${g.projectId}${g.lang}`}>
                  <td className="px-4 py-3 font-semibold text-navy">{names.get(g.projectId)}</td>
                  <td className="px-4 py-3">{languageName(g.lang)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-success" style={{ width: `${(g.approved / g.total) * 100}%` }} /></div>
                      <span className="text-xs tabular-nums text-muted">{g.approved} of {g.total} approved{g.edited ? `, ${g.edited} edited` : ""}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{g.provider ?? ""}</td>
                  <td className="px-4 py-3 text-right"><Link href={`/dashboard/projects/${g.projectId}`} className="text-sm font-semibold text-blue hover:underline">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
