import { requireAppContext } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { capabilities } from "@/lib/providers";
import { SettingsForms } from "./SettingsForms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireAppContext();
  const caps = capabilities();
  const rows: [string, string | null][] = [
    ["Speech recognition", caps.stt ? `${caps.stt.name}${caps.stt.diarization ? " with speaker identification" : ""}` : null],
    ["Translation", caps.translation?.name ?? null],
    ["Voice generation", caps.tts?.name ?? null],
    ["Voice cloning", caps.cloning?.name ?? null],
    ["Lip synchronisation", null],
    ["Rendering", "Built in (ffmpeg)"],
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Settings" description="Your profile, password and workspace." />
      <SettingsForms fullName={ctx.fullName} email={ctx.email} orgName={ctx.orgName} canEditOrg={can(ctx.role, "team.manage")} roleLabel={ROLE_LABELS[ctx.role]} />
      <section className="card p-6">
        <h2 className="text-lg font-bold">Connected AI providers</h2>
        <p className="mt-1 text-sm text-muted">Providers are configured with server environment variables. Features stay off until their provider is connected.</p>
        <dl className="mt-4 divide-y divide-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-body">{k}</dt>
              <dd className={v ? "font-semibold text-navy" : "text-muted"}>{v ?? "Not connected"}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">{caps.targetLanguages.length} target languages available with the current providers.</p>
      </section>
    </div>
  );
}
