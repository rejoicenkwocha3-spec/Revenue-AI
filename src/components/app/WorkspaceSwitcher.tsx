"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

export function WorkspaceSwitcher({ current, memberships }: { current: string; memberships: { orgId: string; orgName: string; role: Role }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const active = memberships.find((m) => m.orgId === current);
  if (memberships.length <= 1) {
    return <p className="truncate font-display text-sm font-bold text-navy">{active?.orgName}</p>;
  }
  return (
    <label className="relative flex items-center gap-2">
      <span className="sr-only">Workspace</span>
      <select
        className="appearance-none rounded-lg border border-line bg-white py-1.5 pl-3 pr-8 font-display text-sm font-bold text-navy"
        value={current}
        disabled={busy}
        onChange={async (e) => {
          setBusy(true);
          await fetch("/api/workspace/switch", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orgId: e.target.value }) });
          setBusy(false);
          router.refresh();
        }}
      >
        {memberships.map((m) => (
          <option key={m.orgId} value={m.orgId}>
            {m.orgName} ({ROLE_LABELS[m.role]})
          </option>
        ))}
      </select>
      <ChevronsUpDown size={14} className="pointer-events-none absolute right-2.5 text-muted" />
    </label>
  );
}
