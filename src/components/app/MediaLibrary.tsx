"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play, Trash2, Film, AudioLines } from "lucide-react";
import { api, openSigned } from "@/lib/client-api";
import { Modal } from "./Modal";
import { formatBytes, formatDuration, formatDate } from "@/lib/utils";

export interface MediaItem {
  id: string; kind: string; bucket: string; storage_path: string; file_name: string; size_bytes: number;
  duration_seconds: number | null; width: number | null; height: number | null; created_at: string;
  project: { id: string; name: string } | null;
}

export function MediaLibrary({ items, canDelete }: { items: MediaItem[]; canDelete: boolean }) {
  const router = useRouter();
  const [preview, setPreview] = useState<{ item: MediaItem; url: string } | null>(null);
  const [del, setDel] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="card overflow-hidden">
      {error && <p className="border-b border-line bg-[#FEF2F2] px-4 py-2 text-sm text-danger">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">File</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Length</th>
              <th className="px-4 py-3 font-semibold">Size</th>
              <th className="px-4 py-3 font-semibold">Added</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((m) => (
              <tr key={m.id} className="hover:bg-canvas/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lavender text-purple">{m.kind === "video" ? <Film size={16} /> : <AudioLines size={16} />}</span>
                    <div className="min-w-0">
                      <p className="max-w-[280px] truncate font-semibold text-navy">{m.file_name}</p>
                      <p className="text-xs text-muted">{m.kind === "extracted_audio" ? "Extracted speech track" : m.width ? `${m.width} × ${m.height}` : m.kind}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{m.project ? <Link href={`/dashboard/projects/${m.project.id}`} className="text-blue hover:underline">{m.project.name}</Link> : <span className="text-muted">None</span>}</td>
                <td className="px-4 py-3 tabular-nums">{m.duration_seconds ? formatDuration(m.duration_seconds) : ""}</td>
                <td className="px-4 py-3 tabular-nums">{formatBytes(m.size_bytes)}</td>
                <td className="px-4 py-3 text-muted">{formatDate(m.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-navy" aria-label={`Preview ${m.file_name}`} onClick={async () => {
                      setError(null);
                      try { setPreview({ item: m, url: await openSigned(m.bucket, m.storage_path) }); } catch (e) { setError((e as Error).message); }
                    }}><Play size={15} /></button>
                    {canDelete && m.kind !== "extracted_audio" && (
                      <button type="button" className="rounded-lg p-2 text-muted hover:bg-[#FEF2F2] hover:text-danger" aria-label={`Delete ${m.file_name}`} onClick={() => setDel(m)}><Trash2 size={15} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.item.file_name ?? "Preview"}>
        {preview && (preview.item.kind === "video" ? <video src={preview.url} controls className="w-full rounded-lg bg-black" /> : <audio src={preview.url} controls className="w-full" />)}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete media" footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDel(null)}>Cancel</button>
          <button type="button" className="btn btn-sm bg-danger text-white" disabled={busy} onClick={async () => {
            setBusy(true); setError(null);
            try { await api(`/api/media/${del!.id}`, { method: "DELETE" }); setDel(null); router.refresh(); } catch (e) { setError((e as Error).message); setDel(null); } finally { setBusy(false); }
          }}>Delete</button>
        </>
      }>
        <p>Delete <span className="font-semibold text-navy">{del?.file_name}</span>? The project keeps its transcript and translations, but needs new media before it can render again.</p>
      </Modal>
    </div>
  );
}
