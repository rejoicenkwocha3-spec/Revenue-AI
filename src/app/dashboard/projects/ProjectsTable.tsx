"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, Pencil, Trash2, Search, Film, AudioLines } from "lucide-react";
import { StatusBadge } from "@/components/app/ui";
import { Modal } from "@/components/app/Modal";
import { api } from "@/lib/client-api";
import { languageName } from "@/config/languages";
import { formatDuration, timeAgo } from "@/lib/utils";

interface P {
  id: string; name: string; status: string; status_detail: string | null; source_language: string | null; target_languages: string[];
  duration_seconds: number | null; media_kind: string | null; approval_status: string; updated_at: string;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Processing" },
  { key: "review", label: "In review" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
  { key: "draft", label: "Drafts" },
];
const ACTIVE = ["queued", "uploading", "transcribing", "translating", "generating_voice", "synchronising", "rendering"];

export function ProjectsTable({ projects, canEdit, canDelete }: { projects: P[]; canEdit: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [renaming, setRenaming] = useState<P | null>(null);
  const [deleting, setDeleting] = useState<P | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      projects.filter((p) => {
        if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (filter === "all") return true;
        if (filter === "active") return ACTIVE.includes(p.status);
        return p.status === filter;
      }),
    [projects, q, filter],
  );

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setRenaming(null);
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search projects</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === f.key ? "bg-navy text-white" : "text-body hover:bg-canvas"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="border-b border-line bg-[#FEF2F2] px-4 py-2 text-sm text-danger">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Languages</th>
              <th className="px-4 py-3 font-semibold">Length</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-canvas/50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/projects/${p.id}`} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lavender text-purple">
                      {p.media_kind === "audio" ? <AudioLines size={16} /> : <Film size={16} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-navy hover:text-blue">{p.name}</span>
                      {p.status_detail && <span className="block max-w-[320px] truncate text-xs text-muted">{p.status_detail}</span>}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-body">
                  {p.source_language ? languageName(p.source_language) : "Auto"} to {p.target_languages.length ? p.target_languages.map(languageName).join(", ") : "none"}
                </td>
                <td className="px-4 py-3 tabular-nums text-body">{p.duration_seconds ? formatDuration(Number(p.duration_seconds)) : ""}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={p.status} />
                    {p.approval_status === "approved" && <span className="text-xs font-semibold text-success">Approved</span>}
                    {p.approval_status === "in_review" && <span className="text-xs font-semibold text-warning">Awaiting approval</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{timeAgo(p.updated_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {canEdit && (
                      <button type="button" title="Rename" aria-label={`Rename ${p.name}`} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-navy" onClick={() => { setRenaming(p); setName(p.name); }}>
                        <Pencil size={15} />
                      </button>
                    )}
                    {canEdit && (
                      <button type="button" title="Duplicate" aria-label={`Duplicate ${p.name}`} disabled={busy} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-navy" onClick={() => run(() => api(`/api/projects/${p.id}/duplicate`, { method: "POST" }))}>
                        <Copy size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" title="Delete" aria-label={`Delete ${p.name}`} className="rounded-lg p-2 text-muted hover:bg-[#FEF2F2] hover:text-danger" onClick={() => setDeleting(p)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No projects match this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="Rename project" footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setRenaming(null)}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || !name.trim()} onClick={() => run(() => api(`/api/projects/${renaming!.id}`, { method: "PATCH", body: { name } }))}>Save</button>
        </>
      }>
        <label htmlFor="rename" className="label">Project name</label>
        <input id="rename" className="input" value={name} maxLength={160} onChange={(e) => setName(e.target.value)} />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete project" footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleting(null)}>Cancel</button>
          <button type="button" className="btn btn-sm bg-danger text-white" disabled={busy} onClick={() => run(() => api(`/api/projects/${deleting!.id}`, { method: "DELETE" }))}>Delete permanently</button>
        </>
      }>
        <p>
          Delete <span className="font-semibold text-navy">{deleting?.name}</span>? Its media, transcripts, translations, generated audio and exports are removed. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
