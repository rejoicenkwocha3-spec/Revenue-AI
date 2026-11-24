import { Tabs } from "./ui";
import { can, type Role } from "@/lib/permissions";

export function SettingsTabs({ current, role }: { current: string; role: Role }) {
  const tabs = [
    { key: "general", label: "Profile and organisation", href: "/dashboard/settings" },
    { key: "team", label: "Team, roles and territories", href: "/dashboard/team" },
    { key: "pipeline", label: "Pipeline stages", href: "/dashboard/settings/pipeline" },
    ...(can(role, "audit.view") ? [{ key: "audit", label: "Audit log", href: "/dashboard/settings/audit" }] : []),
  ];
  return <Tabs tabs={tabs} current={current} />;
}
