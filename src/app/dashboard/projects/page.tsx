import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { ProjectsTable } from "./ProjectsTable";
import { can } from "@/lib/permissions";

export const metadata = { title: "My Projects" };

export default async function ProjectsPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, status, status_detail, source_language, target_languages, duration_seconds, media_kind, approval_status, updated_at, created_at")
    .eq("org_id", ctx.orgId)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="My Projects"
        description="Every dubbing project in this workspace, with its live processing status."
        actions={can(ctx.role, "project.create") ? <Link href="/dashboard/projects/new" className="btn btn-primary btn-sm"><Plus size={16} /> New dubbing project</Link> : null}
      />
      {error ? (
        <div className="card p-6 text-sm text-danger">Could not load projects: {error.message}</div>
      ) : !projects?.length ? (
        <EmptyState icon={FolderKanban} title="No projects yet" body="Create a project, upload a video or audio file and choose the languages you want to dub into." action={can(ctx.role, "project.create") ? { href: "/dashboard/projects/new", label: "Create your first project" } : undefined} />
      ) : (
        <ProjectsTable projects={projects} canEdit={can(ctx.role, "project.edit")} canDelete={can(ctx.role, "project.delete")} />
      )}
    </div>
  );
}
