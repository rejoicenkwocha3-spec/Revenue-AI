import Link from "next/link";
import { Captions } from "lucide-react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { DownloadButton } from "@/components/app/DownloadButton";
import { languageName } from "@/config/languages";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Subtitles" };

export default async function SubtitlesPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const { data } = await supabase.from("subtitles").select("id, language, is_source, format, storage_path, timing_offset_ms, created_at, project:projects(id, name)").eq("org_id", ctx.orgId).order("created_at", { ascending: false });
  const groups = new Map<string, { project: { id: string; name: string }; language: string; isSource: boolean; offset: number; files: { format: string; path: string }[]; created: string }>();
  for (const s of data ?? []) {
    const project = s.project as unknown as { id: string; name: string };
    const k = `${project.id}:${s.language}`;
    const g = groups.get(k) ?? { project, language: s.language as string, isSource: s.is_source as boolean, offset: s.timing_offset_ms as number, files: [] as { format: string; path: string }[], created: s.created_at as string };
    g.files.push({ format: s.format, path: s.storage_path });
    groups.set(k, g);
  }
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Subtitles" description="SRT and VTT files generated from original and translated dialogue. Edit text and timing in the project workspace." />
      {!groups.size ? (
        <EmptyState icon={Captions} title="No subtitles yet" body="Subtitles are generated when a dub is created." action={{ href: "/dashboard/projects", label: "Go to projects" }} />
      ) : (
        <div className="card divide-y divide-line">
          {Array.from(groups.values()).map((g) => (
            <div key={`${g.project.id}${g.language}`} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy">{g.project.name}</p>
                <p className="text-xs text-muted">{languageName(g.language)}{g.isSource ? " (original)" : ""}{g.offset ? ` · offset ${g.offset} ms` : ""} · {formatDate(g.created)}</p>
              </div>
              {g.files.map((f) => <DownloadButton key={f.format} bucket="generated" path={f.path} label={f.format.toUpperCase()} />)}
              <Link href={`/dashboard/projects/${g.project.id}`} className="btn btn-ghost btn-sm">Edit</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
