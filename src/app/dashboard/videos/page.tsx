import { Film } from "lucide-react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/app/ui";
import { MediaLibrary, type MediaItem } from "@/components/app/MediaLibrary";
import { can } from "@/lib/permissions";

export const metadata = { title: "Video Library" };

export default async function Page() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_files")
    .select("id, kind, bucket, storage_path, file_name, size_bytes, duration_seconds, width, height, created_at, project:projects(id, name)")
    .eq("org_id", ctx.orgId)
    .in("kind", ["video"])
    .order("created_at", { ascending: false });
  const items = (data ?? []).map((m) => ({ ...m, size_bytes: Number(m.size_bytes), duration_seconds: m.duration_seconds ? Number(m.duration_seconds) : null })) as unknown as MediaItem[];
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Video Library" description="Every video uploaded to this workspace." />
      {error ? <p className="card p-6 text-sm text-danger">{error.message}</p> : items.length ? (
        <MediaLibrary items={items} canDelete={can(ctx.role, "project.delete")} />
      ) : (
        <EmptyState icon={Film} title="No videos yet" body="Media appears here when you upload it to a dubbing project." action={{ href: "/dashboard/projects/new", label: "New dubbing project" }} />
      )}
    </div>
  );
}
