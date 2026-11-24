import Link from "next/link";
import { FileText } from "lucide-react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { languageName } from "@/config/languages";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Transcriptions" };

export default async function TranscriptionsPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("transcriptions")
    .select("id, language, provider, full_text, word_count, created_at, project:projects(id, name), speakers:speakers(count)")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false });
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Transcriptions" description="Source transcripts created by speech recognition, with detected speakers." />
      {!data?.length ? (
        <EmptyState icon={FileText} title="No transcriptions yet" body="Start processing a project to transcribe its speech." action={{ href: "/dashboard/projects", label: "Go to projects" }} />
      ) : (
        <div className="space-y-3">
          {data.map((t) => {
            const project = t.project as unknown as { id: string; name: string } | null;
            const speakerCount = (t.speakers as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <article key={t.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold">{project?.name ?? "Project"}</h2>
                  {project && <Link href={`/dashboard/projects/${project.id}`} className="btn btn-outline btn-sm">Open in workspace</Link>}
                </div>
                <p className="mt-1 text-xs text-muted">{languageName(t.language)} · {t.word_count ?? 0} words · {speakerCount} speaker{speakerCount === 1 ? "" : "s"} · {t.provider} · {formatDate(t.created_at)}</p>
                <p className="mt-3 line-clamp-3 text-sm text-body">{t.full_text}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
