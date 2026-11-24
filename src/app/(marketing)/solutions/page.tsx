import type { Metadata } from "next";
import Link from "next/link";
import { MonitorPlay, Sparkles, Clapperboard, Megaphone, GraduationCap, Mic, Radio, BadgePercent, Building2, Tv, ArrowRight, Check } from "lucide-react";
import { PageHero, CtaBand } from "@/components/marketing/Sections";

export const metadata: Metadata = {
  title: "Solutions",
  description: "How LinguaDub helps creators, studios, agencies, educators, broadcasters and businesses reach audiences in every language.",
};

const SOLUTIONS = [
  {
    id: "youtube-creators",
    icon: MonitorPlay,
    title: "YouTube Creators",
    problem: "Your audience is growing in countries where viewers would rather watch in their own language, but recording every video again is impossible.",
    benefits: ["Dub each upload into several languages from one project", "Export audio tracks ready for multi language uploads", "Subtitles in SRT and VTT for every language"],
    cta: "Dub your next upload",
  },
  {
    id: "content-creators",
    icon: Sparkles,
    title: "Content Creators",
    problem: "Short form and social content moves fast, and translation slows every release down.",
    benefits: ["Fast turnaround on short clips", "Clone your own voice with your verified consent", "Emotion controls that keep your energy"],
    cta: "Start creating in more languages",
  },
  {
    id: "film-television",
    icon: Clapperboard,
    title: "Film and Television Studios",
    problem: "Traditional dubbing needs casting, studio time and weeks of scheduling for each territory.",
    benefits: ["Speaker identification with one consistent voice per character", "Line level timing control for scene accuracy", "Reviewer approvals before delivery"],
    cta: "Plan a localized release",
  },
  {
    id: "marketing-agencies",
    icon: Megaphone,
    title: "Marketing Agencies",
    problem: "Clients want every campaign in every market, on the same launch date.",
    benefits: ["Reuse approved voices across a client's campaigns", "Invite client reviewers with view only access", "Deliver MP4, audio and subtitle files together"],
    cta: "Localize your campaigns",
  },
  {
    id: "e-learning",
    icon: GraduationCap,
    title: "E Learning Companies",
    problem: "Courses built in one language leave most potential learners behind.",
    benefits: ["Translate lectures while keeping a calm, educational delivery", "Editable transcripts for accuracy on technical terms", "Subtitles that support accessibility"],
    cta: "Translate your courses",
  },
  {
    id: "podcasters",
    icon: Mic,
    title: "Podcasters",
    problem: "Listeners connect with hosts, and a different voice in translation breaks that connection.",
    benefits: ["Each host keeps an assigned voice across episodes", "Audio only projects export MP3 and WAV", "Transcripts for show notes in every language"],
    cta: "Launch a multilingual show",
  },
  {
    id: "broadcasters",
    icon: Radio,
    title: "Broadcasters",
    problem: "News and features need to reach multilingual audiences quickly and accurately.",
    benefits: ["Background processing with clear status for every stage", "Review workflow with approvals and activity history", "Subtitle timing adjustments for broadcast standards"],
    cta: "Talk through your workflow",
  },
  {
    id: "advertising-agencies",
    icon: BadgePercent,
    title: "Advertising Agencies",
    problem: "Ad spots are short, timing is everything and every second must land in each market.",
    benefits: ["Speed and offset controls for tight spots", "Enthusiastic and dramatic delivery options", "Fast iterations when the script changes"],
    cta: "Adapt your next spot",
  },
  {
    id: "businesses",
    icon: Building2,
    title: "Businesses",
    problem: "Training, onboarding and product videos rarely reach employees and customers in their first language.",
    benefits: ["Workspace level data isolation", "Six roles for controlled collaboration", "Private storage with temporary download links"],
    cta: "Localize your company videos",
  },
  {
    id: "streaming-platforms",
    icon: Tv,
    title: "Streaming Platforms",
    problem: "Catalogues grow faster than localization budgets, leaving titles unavailable in key regions.",
    benefits: ["Process titles in parallel background jobs", "Per language exports with embedded subtitles", "Provider adapters so you can choose your AI vendors"],
    cta: "Expand your catalogue",
  },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Localization built around the way you publish."
        body="Different teams face different language barriers. Here is how LinguaDub removes them for creators, studios, agencies, educators and businesses."
      />
      <nav aria-label="Solutions" className="sticky top-[68px] z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="container-ld flex gap-1 overflow-x-auto py-2">
          {SOLUTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-body hover:bg-canvas hover:text-navy">
              {s.title}
            </a>
          ))}
        </div>
      </nav>
      <div className="container-ld space-y-5 py-16">
        {SOLUTIONS.map((s, i) => (
          <section key={s.id} id={s.id} className="card scroll-mt-36 grid gap-8 p-7 md:grid-cols-[1fr_1fr] md:p-10">
            <div>
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${i % 2 ? "bg-lavender text-purple" : "bg-blue-50 text-blue"}`}>
                <s.icon size={22} />
              </span>
              <h2 className="mt-5 text-2xl font-extrabold md:text-3xl">{s.title}</h2>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-coral">The challenge</p>
              <p className="mt-2 text-[1.0625rem] leading-relaxed">{s.problem}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">How LinguaDub helps</p>
              <ul className="mt-4 space-y-3">
                {s.benefits.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-white"><Check size={12} /></span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-7">
                <Link href="/signup" className="btn btn-primary">{s.cta} <ArrowRight size={16} /></Link>
              </div>
            </div>
          </section>
        ))}
      </div>
      <CtaBand />
    </>
  );
}
