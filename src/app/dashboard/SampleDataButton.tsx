"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";

export function SampleDataButton({ remove = false }: { remove?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-center">
      <button type="button" className={remove ? "btn btn-danger btn-sm" : "btn btn-outline btn-sm"} disabled={busy} onClick={async () => {
        setBusy(true); setError(null);
        try { await api("/api/sample-data", { method: remove ? "DELETE" : "POST" }); router.refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
      }}>
        {busy && <Loader2 size={14} className="ra-spin" />}{remove ? "Remove example data" : "Load example data"}
      </button>
      {error && <span className="mt-1 text-xs text-danger">{error}</span>}
    </span>
  );
}
