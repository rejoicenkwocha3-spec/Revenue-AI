import type { Metadata } from "next";
import Link from "next/link";
import {
  Film, Languages, Ear, FileText, Fingerprint, SmilePlus, Globe2, Users2, Timer, Library, Download, UsersRound,
  Upload, UserRound, Wand2, ClipboardCheck, ArrowRight, Server, KeyRound, RefreshCcw,
} from "lucide-react";
import { PageHero, SectionHeader, CtaBand, IconTile } from "@/components/marketing/Sections";

export const metadata: Metadata = {
  title: "Platform",
  description: "How LinguaDub turns one video into dubbed, subtitled versions for every market.",
};

const CAPABILITIES = [
  { icon: Film, title: "AI Video Dubbing", body: "Upload a video and receive a dubbed version with the new language track mixed against the original picture." },
  { icon: Languages, title: "Audio Translation", body: "Translate dialogue line by line while keeping meaning, tone and spoken length close to the original." },
  { icon: Ear, title: "Speech Recognition", body: "Recognise speech with word level timing so each line can be placed exactly where it was spoken." },
  { icon: FileText, title: "Automatic Transcription", body: "Get an editable transcript of the source audio that drives translation, voicing and subtitles." },
  { icon: Fingerprint, title: "Voice Cloning", body: "Create an authorised replica of a voice from recorded samples, gated by verified consent from its owner." },
  { icon: SmilePlus, title: "Emotion Based Voice Generation", body: "Choose a delivery for each speaker or line: excited, calm, sad, serious, friendly, dramatic, professional or enthusiastic." },
  { icon: Globe2, title: "Accent Control", body: "Pick regional accents offered by the connected voice provider, per speaker." },
  { icon: Users2, title: "Speaker Identification", body: "Separate speakers automatically, rename them and give each one a consistent voice." },
  { icon: Timer, title: "Audio Synchronisation", body: "Fit each generated line into its original time slot with speed, pause and offset controls." },
  { icon: Library, title: "Multilingual Voice Library", body: "Browse and preview voices, filter by language, accent, gender presentation and style, and save favourites." },
  { icon: Download, title: "Video Export", body: "Export MP4 with the dubbed track and embedded subtitles, plus MP3, WAV, SRT and VTT files." },
  { icon: UsersRound, title: "Team Collaboration", body: "Invite translators and reviewers, assign roles and approve dubs before they ship." },
];

const FLOW = [
  { icon: Upload, title: "Upload Content", body: "Video or audio up to your plan's storage limit, stored privately in your workspace." },
  { icon: FileText, title: "Transcribe Audio", body: "Audio is extracted, transcribed with timestamps and split by speaker." },
  { icon: Languages, title: "Translate Script", body: "Each line is translated into every target language you selected." },
  { icon: UserRound, title: "Select Voice", body: "Assign library voices or consented clones to each detected speaker." },
  { icon: Wand2, title: "Generate Dub", body: "Speech is generated per line, then aligned to the original timing." },
  { icon: ClipboardCheck, title: "Review and Edit", body: "Edit wording and timing, regenerate lines and send for approval." },
  { icon: Film, title: "Export Video", body: "Render the dubbed video and download audio and subtitle files." },
];

export default function PlatformPage() {
  return (
    <>
      <PageHero
        eyebrow="Platform"
        title="The complete localization pipeline in one workspace."
        body="LinguaDub connects speech recognition, translation, voice generation and media rendering into a single workflow your team can see, review and control."
      >
        <Link href="/signup" className="btn btn-primary">Start Dubbing <ArrowRight size={16} /></Link>
        <Link href="/features" className="btn btn-outline">See all features</Link>
      </PageHero>

      {/* HOW IT WORKS */}
      <section className="container-ld py-24">
        <SectionHeader
          eyebrow="How LinguaDub works"
          title="From upload to export in seven stages."
          body="Long running work happens in background jobs. Each stage reports its real status: queued, transcribing, translating, generating voice, synchronising, rendering, completed or failed."
        />
        <div className="mt-14 overflow-x-auto pb-2">
          <ol className="grid min-w-[980px] grid-cols-7 gap-3">
            {FLOW.map((s, i) => (
              <li key={s.title} className="relative">
                <div className="flex items-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white"><s.icon size={18} /></span>
                  {i < FLOW.length - 1 && <span className="ml-2 h-px flex-1 bg-line-strong" />}
                </div>
                <p className="mt-4 font-mono text-xs text-muted">Stage {i + 1}</p>
                <h3 className="mt-1 text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="border-y border-line bg-white">
        <div className="container-ld py-24">
          <SectionHeader eyebrow="Capabilities" title="Everything a dubbing team needs." />
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c, i) => (
              <div key={c.title}>
                <IconTile tone={(["blue", "purple", "coral"] as const)[i % 3]}><c.icon size={20} /></IconTile>
                <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                <p className="mt-2 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="container-ld grid gap-12 py-24 lg:grid-cols-[1fr_1.1fr]">
        <SectionHeader
          eyebrow="Open architecture"
          title="Best in class AI providers, behind one interface."
          body="LinguaDub talks to speech, translation and voice engines through provider adapters. You can change a provider without rebuilding your workflow, and a feature only switches on when its provider is connected."
        />
        <div className="grid gap-3">
          {[
            [Server, "Provider adapters", "Speech to text, translation, text to speech and voice cloning each sit behind a common contract."],
            [KeyRound, "Keys stay on the server", "API keys live in server environment variables and never reach the browser."],
            [RefreshCcw, "Retries and clear errors", "Temporary provider errors retry with backoff. Permanent errors stop the job and explain what to fix."],
          ].map(([Icon, t, b]) => {
            const I = Icon as typeof Server;
            return (
              <div key={t as string} className="card flex gap-4 p-5">
                <IconTile tone="navy"><I size={18} /></IconTile>
                <div>
                  <h3 className="font-bold">{t as string}</h3>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed">{b as string}</p>
                </div>
              </div>
            );
          })}
          <p className="rounded-xl bg-lavender p-4 text-sm text-navy">
            Lip synchronisation is not part of the current release. LinguaDub will only offer it once an authorised lip sync provider is connected and verified.
          </p>
        </div>
      </section>

      <CtaBand title="See your own content in a new language." />
    </>
  );
}
