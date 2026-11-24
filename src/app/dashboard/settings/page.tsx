import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/ui";
import { SettingsTabs } from "@/components/app/SettingsTabs";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { aiConfigured, AI_MODEL } from "@/lib/ai/claude";
import { SettingsForms } from "./SettingsForms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const [{ data: org }, { data: profile }] = await Promise.all([
    supabase.from("organisations").select("currency, fiscal_year_start_month").eq("id", ctx.orgId).single(),
    supabase.from("profiles").select("job_title").eq("id", ctx.userId).single(),
  ]);
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Settings" description="Your profile, password and organisation." />
      <SettingsTabs current="general" role={ctx.role} />
      <SettingsForms fullName={ctx.fullName} jobTitle={profile?.job_title ?? ""} email={ctx.email} orgName={ctx.orgName} currency={org?.currency ?? "USD"} fiscal={org?.fiscal_year_start_month ?? 1} canEditOrg={can(ctx.role, "team.manage")} roleLabel={ROLE_LABELS[ctx.role]} />
      <section className="card p-6">
        <h2 className="text-lg font-bold">AI configuration</h2>
        <p className="mt-1 text-sm text-muted">AI runs on the server only. Keys are never sent to the browser.</p>
        <dl className="mt-4 divide-y divide-line text-sm">
          <div className="flex justify-between gap-4 py-2.5"><dt>Conversational assistant and agent summaries</dt><dd className={aiConfigured() ? "font-semibold text-success" : "text-muted"}>{aiConfigured() ? `Connected (${AI_MODEL})` : "Not configured"}</dd></div>
          <div className="flex justify-between gap-4 py-2.5"><dt>Rule based intelligence, deal health, forecasting and agents</dt><dd className="font-semibold text-success">Always on</dd></div>
        </dl>
      </section>
    </div>
  );
}
