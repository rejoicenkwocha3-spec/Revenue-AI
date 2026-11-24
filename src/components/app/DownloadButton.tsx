"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { openSigned } from "@/lib/client-api";

export function DownloadButton({ bucket, path, label }: { bucket: string; path: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={async () => {
        setBusy(true); setErr(null);
        try { window.location.href = await openSigned(bucket, path, true); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
      }}>
        {busy ? <Loader2 size={13} className="ld-spin" /> : <Download size={13} />} {label ?? "Download"}
      </button>
      {err && <span className="text-xs text-danger">{err}</span>}
    </span>
  );
}
