"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";

export function AcceptInvite({ token, mismatch }: { token: string; mismatch: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (mismatch) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-sm text-danger">This invitation is for {mismatch}. Log out and sign in with that address.</p>
        <form action="/auth/signout" method="post"><button type="submit" className="btn btn-outline">Log out</button></form>
      </div>
    );
  }
  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      <button type="button" className="btn btn-primary w-full" disabled={busy} onClick={async () => {
        setBusy(true); setError(null);
        try { await api("/api/team/accept", { body: { token } }); router.replace("/dashboard"); router.refresh(); } catch (e) { setError((e as Error).message); setBusy(false); }
      }}>{busy && <Loader2 size={16} className="ld-spin" />} Accept invitation</button>
    </div>
  );
}
