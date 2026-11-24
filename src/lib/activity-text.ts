import { languageName } from "@/config/languages";

/** Human readable activity descriptions. */
export function describeActivity(action: string, d: Record<string, unknown> = {}): string {
  const name = d.name ? `"${d.name}"` : "a project";
  const lang = d.language ? languageName(String(d.language)) : "";
  switch (action) {
    case "project.created": return `created ${name}`;
    case "project.updated": return `updated ${name}`;
    case "project.renamed": return `renamed a project to ${name}`;
    case "project.duplicated": return `duplicated ${name}`;
    case "project.deleted": return `deleted ${name}`;
    case "media.uploaded": return `uploaded ${d.file ? `"${d.file}"` : "media"}`;
    case "media.deleted": return `deleted ${d.file ? `"${d.file}"` : "media"}`;
    case "pipeline.started": return `started processing ${name}`;
    case "translation.requested": return `requested a ${lang} translation`;
    case "dub.requested": return `started generating the ${lang} dub`;
    case "job.retried": return "retried a failed step";
    case "job.failed": return `saw a processing step fail${d.type ? ` (${String(d.type).replace("_", " ")})` : ""}`;
    case "speaker.updated": return `updated speaker ${d.speaker ? `"${d.speaker}"` : ""}`;
    case "subtitles.updated": return `adjusted ${lang} subtitle timing`;
    case "approval.submitted": return `submitted ${name} for review`;
    case "approval.approved": return `approved ${name}`;
    case "approval.changes_requested": return `requested changes on ${name}`;
    case "voice.cloned": return `created the cloned voice ${d.voice ? `"${d.voice}"` : ""}`;
    case "voice.deleted": return `deleted the voice ${d.voice ? `"${d.voice}"` : ""}`;
    case "consent.requested": return `requested voice consent from ${d.owner ?? "a voice owner"}`;
    case "consent.verified": return `recorded verified voice consent for ${d.owner ?? "a voice owner"}`;
    case "consent.revoked": return `revoked voice consent for ${d.owner ?? "a voice owner"}`;
    case "team.invited": return `invited ${d.email ?? "a teammate"} as ${d.role ?? "a member"}`;
    case "team.joined": return "joined the workspace";
    case "team.role_changed": return `changed a member role to ${d.role}`;
    case "team.removed": return "removed a member";
    case "billing.activated": return `activated the ${d.plan ?? ""} plan`;
    case "export.downloaded": return `downloaded ${d.file ?? "an export"}`;
    default: return action.replace(/[._]/g, " ");
  }
}
