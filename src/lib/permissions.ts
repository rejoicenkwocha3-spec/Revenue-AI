export const ROLES = ["owner", "admin", "editor", "translator", "reviewer", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Administrator",
  editor: "Editor",
  translator: "Translator",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full control, including billing and deleting the workspace.",
  admin: "Manages team members, billing and every project.",
  editor: "Creates projects, uploads media, generates dubs and exports.",
  translator: "Edits transcripts and translations.",
  reviewer: "Edits translations and approves or rejects dubs.",
  viewer: "Views projects and downloads exports.",
};

export type Action =
  | "project.create"
  | "project.edit"
  | "project.delete"
  | "media.upload"
  | "pipeline.run"
  | "translation.edit"
  | "dub.approve"
  | "export.download"
  | "voice.clone"
  | "team.manage"
  | "billing.manage";

const MATRIX: Record<Action, Role[]> = {
  "project.create": ["owner", "admin", "editor"],
  "project.edit": ["owner", "admin", "editor"],
  "project.delete": ["owner", "admin", "editor"],
  "media.upload": ["owner", "admin", "editor"],
  "pipeline.run": ["owner", "admin", "editor"],
  "translation.edit": ["owner", "admin", "editor", "translator", "reviewer"],
  "dub.approve": ["owner", "admin", "reviewer"],
  "export.download": ["owner", "admin", "editor", "translator", "reviewer", "viewer"],
  "voice.clone": ["owner", "admin", "editor"],
  "team.manage": ["owner", "admin"],
  "billing.manage": ["owner", "admin"],
};

export function can(role: Role | null | undefined, action: Action): boolean {
  return !!role && MATRIX[action].includes(role);
}
