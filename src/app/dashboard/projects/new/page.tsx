import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/session";
import { capabilities } from "@/lib/providers";
import { getEntitlements } from "@/lib/billing";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/app/ui";
import { NewProjectForm } from "./NewProjectForm";
import { LANGUAGES } from "@/config/languages";
import { MAX_UPLOAD_BYTES } from "@/config/media";

export const metadata = { title: "New Dubbing Project" };

export default async function NewProjectPage() {
  const ctx = await requireAppContext();
  if (!can(ctx.role, "project.create")) redirect("/dashboard/projects");
  const caps = capabilities();
  const ent = await getEntitlements(ctx.orgId);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="New dubbing project" description="Upload your media, choose the source and target languages, then start processing." />
      <NewProjectForm
        sourceLanguages={LANGUAGES.filter((l) => caps.sourceLanguages.includes(l.code))}
        targetLanguages={LANGUAGES.filter((l) => caps.targetLanguages.includes(l.code))}
        maxTargets={ent.targetLanguagesPerProject}
        hasPlan={ent.minutesIncluded > 0}
        providersReady={{ stt: !!caps.stt, translation: !!caps.translation, tts: !!caps.tts }}
        maxUploadBytes={MAX_UPLOAD_BYTES}
      />
    </div>
  );
}
