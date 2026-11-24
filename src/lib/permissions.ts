export const ROLES = ["owner", "admin", "sales_manager", "sales_rep", "revops", "executive", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Administrator",
  sales_manager: "Sales Manager",
  sales_rep: "Sales Representative",
  revops: "Revenue Operations",
  executive: "Executive",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full control, including billing, integrations and deleting the organisation.",
  admin: "Manages people, teams, territories, billing, integrations and every record.",
  sales_manager: "Manages any deal, forecasts and targets, reviews deals and approves agent actions.",
  sales_rep: "Works their own deals, accounts, contacts, activities and tasks.",
  revops: "Configures pipeline stages, forecasts, targets, integrations and AI agents.",
  executive: "Reads every dashboard, forecast and report and comments on deals.",
  viewer: "Read only access to dashboards and records.",
};

export type Action =
  | "crm.write"
  | "deal.manage_any"
  | "deal.comment"
  | "forecast.manage"
  | "target.manage"
  | "pipeline.configure"
  | "agent.configure"
  | "agent.run"
  | "agent.approve"
  | "assistant.use"
  | "integration.manage"
  | "team.manage"
  | "billing.manage"
  | "audit.view";

const MATRIX: Record<Action, Role[]> = {
  "crm.write": ["owner", "admin", "sales_manager", "sales_rep", "revops"],
  "deal.manage_any": ["owner", "admin", "sales_manager", "revops"],
  "deal.comment": ["owner", "admin", "sales_manager", "sales_rep", "revops", "executive"],
  "forecast.manage": ["owner", "admin", "sales_manager", "revops"],
  "target.manage": ["owner", "admin", "sales_manager", "revops"],
  "pipeline.configure": ["owner", "admin", "revops"],
  "agent.configure": ["owner", "admin", "revops"],
  "agent.run": ["owner", "admin", "sales_manager", "revops", "sales_rep", "executive"],
  "agent.approve": ["owner", "admin", "sales_manager", "revops"],
  "assistant.use": ["owner", "admin", "sales_manager", "sales_rep", "revops", "executive", "viewer"],
  "integration.manage": ["owner", "admin", "revops"],
  "team.manage": ["owner", "admin"],
  "billing.manage": ["owner", "admin"],
  "audit.view": ["owner", "admin", "revops", "sales_manager"],
};

export function can(role: Role | null | undefined, action: Action): boolean {
  return !!role && MATRIX[action].includes(role);
}
