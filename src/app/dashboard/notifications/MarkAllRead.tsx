"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { api } from "@/lib/client-api";

export function MarkAllRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={async () => { setBusy(true); await api("/api/notifications/read", { body: {} }).catch(() => undefined); setBusy(false); router.refresh(); }}>
      <CheckCheck size={14} /> Mark all as read
    </button>
  );
}
