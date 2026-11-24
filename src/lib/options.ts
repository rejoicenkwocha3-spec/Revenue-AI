import type { OrgData } from "@/lib/revenue/types";

export function optionsFrom(d: OrgData) {
  return {
    stages: d.stages.map((s) => ({ value: s.id, label: s.name })),
    accounts: [...d.accounts].sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name })),
    members: d.members.map((m) => ({ value: m.user_id, label: m.full_name })),
    opportunities: d.opportunities.filter((o) => o.status === "open").map((o) => ({ value: o.id, label: o.name })),
    contacts: d.contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name ?? ""}`.trim() })),
  };
}
