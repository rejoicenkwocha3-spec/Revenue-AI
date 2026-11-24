import type { Metadata } from "next";
import Link from "next/link";
import {
  Film, Languages, Library, Fingerprint, SmilePlus, Users2, Globe2, Timer, ScanFace, Captions, Download, Check, ArrowRight,
} from "lucide-react";
import { PageHero, CtaBand } from "@/components/marketing/Sections";
import { LANGUAGES, VOICE_STYLES } from "@/config/languages";
import { Waveform } from "@/components/ui/Waveform";

export const metadata: Metadata = {
  title: "Features",
  description: "AI video dubbing, translation, voice library, consent based voice cloning, emotion control, speaker identification, synchronisation, subtitles and export.",
};

type Feature = {
  id: string;
  icon: typeof Film;
  title: string;
  intro: string;
  points: string[];
  note?: string;
  visual?: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    id: "dubbing",
    icon: Film,
    title: "AI Video Dubbing",
    intro: "Upload a video and generate dubbed versions in each language you select.",
    points: ["Video upload", "Audio extraction", "Automatic transcription", "Translation", "Voice selection", "Audio generation", "Synchronisation", "Video export"],
  },
  {
    id: "translation",
    icon: Languages,
    title: "Multilingual Translation",
    intro: "Translate scripts and dialogue into multiple languages from a configurable catalogue.",
    points: ["Line by line translation that keeps segment timing", "Edit, approve and lock lines before voicing", "Context notes help the translator with names and terms"],
    note: "Only languages supported by your connected transcription, translation and voice providers appear in the app.",
    visual: (
      <div className="flex flex-wrap gap-1.5">
        {LANGUAGES.map((l) => (
          <span key={l.code} className="chip bg-canvas text-body">{l.name}</span>
        ))}
      </div>
    ),
  },
  {
    id: "voice-library",
    icon: Library,
    title: "AI Voice Library",
    intro: "Find the right voice for every speaker and every market.",
    points: ["Browse and preview voices", "Filter by language, accent, gender presentation and speaking style", "Select voices per speaker", "Save favourite voices"],
    visual: (
      <div className="flex flex-wrap gap-1.5">
        {VOICE_STYLES.map((s) => (
          <span key={s} className="chip bg-lavender text-purple">{s}</span>
        ))}
      </div>
    ),
  },
  {
    id: "voice-cloning",
    icon: Fingerprint,
    title: "Voice Cloning",
    intro: "Create authorised voice replicas from uploaded recordings.",
    points: ["Voice sample upload", "Voice profile creation", "Voice preview", "Voice management and deletion", "Consent verification"],
    note: "Cloning requires explicit, verified permission from the person whose voice is replicated. The voice owner records a consent statement and confirms it themselves. Unauthorised impersonation is not allowed.",
  },
  {
    id: "emotion",
    icon: SmilePlus,
    title: "Emotion Based Voice Generation",
    intro: "Control how generated speech is delivered.",
    points: ["Excited", "Calm", "Sad", "Serious", "Friendly", "Dramatic", "Professional", "Enthusiastic"],
    note: "Emotion is applied through the delivery controls each voice provider supports.",
  },
  {
    id: "speakers",
    icon: Users2,
    title: "Speaker Identification",
    intro: "Identify the different speakers in a recording.",
    points: ["View detected speakers", "Assign voices", "Edit speaker names", "Preview individual voices", "Maintain speaker consistency"],
  },
  {
    id: "accent",
    icon: Globe2,
    title: "Accent Control",
    intro: "Choose from the regional accents your voice provider offers.",
    points: ["Accent labels on every library voice", "Accent direction per speaker where the provider supports it"],
  },
  {
    id: "sync",
    icon: Timer,
    title: "Audio Synchronisation",
    intro: "Generate audio that follows the original video's timing.",
    points: ["Start time", "End time", "Segment duration", "Audio speed", "Pause duration", "Timing offsets"],
    visual: <Waveform bars={56} seed={13} progress={0.5} height={36} activeColor="#7047EB" />,
  },
  {
    id: "lip-sync",
    icon: ScanFace,
    title: "Lip Synchronisation",
    intro: "Not yet available.",
    points: ["The provider adapter design allows an authorised lip sync service to be added"],
    note: "LinguaDub does not currently offer lip synchronisation. It will only be listed as available once an authorised integration is connected and working.",
  },
  {
    id: "subtitles",
    icon: Captions,
    title: "Subtitle Generation",
    intro: "Generate subtitles from the original and translated dialogue.",
    points: ["SRT export", "VTT export", "Embedded subtitles in MP4", "Subtitle editing", "Subtitle timing adjustments"],
  },
  {
    id: "export",
    icon: Download,
    title: "Video Export",
    intro: "Export completed projects in the formats you publish.",
    points: ["MP4 video", "MP3 and WAV audio", "SRT and VTT subtitle files", "Original resolution preserved: the video stream is copied without encoding it again"],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Every tool for professional AI dubbing."
        body="Transcription, translation, voices, timing, subtitles and export, designed to work together inside one project."
      >
        <Link href="/signup" className="btn btn-primary">Start Dubbing <ArrowRight size={16} /></Link>
        <Link href="/pricing" className="btn btn-outline">View pricing</Link>
      </PageHero>

      <div className="container-ld grid gap-10 py-16 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Features" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 text-sm">
            {FEATURES.map((f) => (
              <li key={f.id}>
                <a href={`#${f.id}`} className="block rounded-lg px-3 py-2 text-body hover:bg-white hover:text-navy">{f.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-5">
          {FEATURES.map((f) => (
            <section key={f.id} id={f.id} className="card scroll-mt-24 p-7 md:p-9">
              <div className="flex flex-wrap items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white"><f.icon size={22} /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-extrabold">{f.title}</h2>
                  <p className="mt-1.5 text-[1.0625rem]">{f.intro}</p>
                </div>
              </div>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[0.9375rem]">
                    <Check size={17} className="mt-0.5 shrink-0 text-blue" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {f.visual && <div className="mt-6">{f.visual}</div>}
              {f.note && <p className="mt-6 rounded-xl bg-lavender px-4 py-3 text-sm text-navy">{f.note}</p>}
            </section>
          ))}
        </div>
      </div>
      <CtaBand />
    </>
  );
}
