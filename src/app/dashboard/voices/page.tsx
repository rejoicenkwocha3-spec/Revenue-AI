import { requireAppContext } from "@/lib/session";
import { PageHeader } from "@/components/app/ui";
import { VoiceLibraryClient } from "./VoiceLibraryClient";
import { capabilities } from "@/lib/providers";

export const metadata = { title: "Voice Library" };

export default async function VoicesPage() {
  await requireAppContext();
  const caps = capabilities();
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Voice Library"
        description={caps.tts ? `Browse and preview voices from ${caps.tts.name}. Filter by language, accent, gender presentation and speaking style, and save favourites.` : "Connect a voice provider to browse voices."}
      />
      <VoiceLibraryClient />
    </div>
  );
}
