import Link from "next/link";
import {
  ArrowRight, Globe2, AudioLines, Gauge, Mic2, Users, Captions, Layers, Upload, FileText, Languages, UserRound,
  Wand2, ClipboardCheck, Film, MonitorPlay, Clapperboard, Megaphone, GraduationCap, Radio, Building2, ShieldCheck,
} from "lucide-react";
import { ProductDemo } from "@/components/marketing/ProductDemo";
import { SectionHeader, CtaBand, IconTile } from "@/components/marketing/Sections";
import { PricingCards } from "@/components/marketing/PricingCards";
import { Waveform } from "@/components/ui/Waveform";
import { LANGUAGES } from "@/config/languages";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(55%_70%_at_80%_0%,#ECE7FF_0%,rgba(247,248,252,0)_70%)]" />
        <div className="container-ld relative grid items-center gap-12 pb-20 pt-12 md:pt-16 lg:grid-cols-[1fr_1.12fr] lg:gap-14">
          <div>
            <p className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" /> Every Voice. Every Language. Everywhere.
            </p>
            <h1 className="mt-5 text-[2.75rem] font-extrabold leading-[1.02] md:text-[4rem]">
              Your Content. Every Language. <span className="text-blue">One Platform.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">
              LinguaDub transforms videos and audio into natural sounding multilingual experiences using AI powered dubbing, voice translation and intelligent localization.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary">
                Start Dubbing <ArrowRight size={16} />
              </Link>
              <Link href="/platform" className="btn btn-outline">
                Explore Platform
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
              {[
                ["12 steps", "from upload to export"],
                [`${LANGUAGES.length}`, "languages in the catalogue"],
                ["6 roles", "for team review"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-display text-xl font-extrabold text-navy">{k}</dt>
                  <dd className="mt-1 text-xs leading-snug text-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ProductDemo />
        </div>
      </section>

      {/* BREAK LANGUAGE BARRIERS */}
      <section className="border-y border-line bg-white">
        <div className="container-ld py-20">
          <SectionHeader
            eyebrow="Break language barriers"
            title="One upload becomes a release for every market."
            body="Most of the world watches in a language other than the one your content was made in. LinguaDub closes that gap without a recording studio for every language."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Globe2, tone: "blue" as const, title: "Global reach", body: "Publish the same video for audiences in different countries and languages, with dubbed audio and subtitles for each." },
              { icon: Mic2, tone: "purple" as const, title: "Authentic voices", body: "Natural sounding voices that carry the emotion, pacing and personality of the original speaker." },
              { icon: Gauge, tone: "coral" as const, title: "Efficiency", body: "Translate and dub without booking voice actors and studios for every language you release in." },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl border border-line p-7">
                <IconTile tone={b.tone}><b.icon size={20} /></IconTile>
                <h3 className="mt-5 text-xl font-bold">{b.title}</h3>
                <p className="mt-2 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI POWERED VIDEO DUBBING */}
      <section className="container-ld grid items-center gap-12 py-24 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow="AI powered video dubbing"
            title="A dubbing timeline that respects the original cut."
            body="LinguaDub transcribes every line, translates it, voices it and places it back on the timeline where the original was spoken. Lines that run long are tightened automatically so speech stays in sync with the picture."
          />
          <ul className="mt-8 space-y-3 text-[0.9375rem]">
            {["Word level timestamps from speech recognition", "Per line start, end, speed, pause and offset controls", "Original audio bed kept underneath at a level you choose"].map((t) => (
              <li key={t} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold text-navy">Timeline</span>
            <span className="font-mono">00:00:00 · 00:00:30</span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: "Original", color: "#2463EB", bars: [[2, 18], [22, 20], [46, 14], [64, 26]] },
              { label: "Spanish dub", color: "#7047EB", bars: [[2, 17], [22, 21], [46, 13], [64, 24]] },
              { label: "Subtitles", color: "#FF786B", bars: [[2, 18], [22, 20], [46, 14], [64, 26]] },
            ].map((track) => (
              <div key={track.label} className="grid grid-cols-[88px_1fr] items-center gap-3">
                <span className="text-xs font-medium text-body">{track.label}</span>
                <div className="relative h-9 rounded-lg bg-canvas">
                  {track.bars.map(([l, w], i) => (
                    <span key={i} className="absolute top-1 bottom-1 rounded-md" style={{ left: `${l}%`, width: `${w}%`, background: `${track.color}1F`, borderLeft: `3px solid ${track.color}` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-line p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="chip bg-lavender text-purple">Speaker 1</span>
              <span className="font-mono text-muted">0:04.120 · 0:08.940</span>
            </div>
            <p className="mt-3 text-sm text-muted">We built this for teams who publish every week.</p>
            <p className="mt-1 text-sm font-medium text-navy">Lo creamos para equipos que publican cada semana.</p>
            <Waveform bars={60} seed={11} progress={0.62} height={34} className="mt-3" activeColor="#7047EB" />
          </div>
        </div>
      </section>

      {/* NATURAL MULTILINGUAL VOICES + EMOTION */}
      <section className="bg-navy">
        <div className="container-ld grid gap-6 py-24 lg:grid-cols-2">
          <div className="rounded-[22px] bg-navy-800 p-8">
            <p className="eyebrow text-[#B9A6FF]">Natural multilingual voices</p>
            <h2 className="mt-3 text-3xl font-extrabold text-white">A voice library that speaks your audience&apos;s language.</h2>
            <p className="mt-3 text-[#C5CCE6]">Browse, preview and filter voices by language, accent, gender presentation and speaking style. Save favourites and reuse them across projects.</p>
            <div className="mt-7 space-y-2.5">
              {[
                ["Amara", "Conversational · British English"],
                ["Mateo", "Documentary · Spanish"],
                ["Yuki", "Calm · Japanese"],
              ].map(([n, d], i) => (
                <div key={n} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">{n[0]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{n}</p>
                    <p className="text-xs text-[#AEB6D6]">{d}</p>
                  </div>
                  <div className="w-24"><Waveform bars={22} seed={i + 3} height={22} color="#3A4782" progress={i === 0 ? 0.55 : 0} activeColor="#9DB8FF" /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[22px] bg-navy-800 p-8">
            <p className="eyebrow text-[#FFB0A8]">Preserve the original emotion</p>
            <h2 className="mt-3 text-3xl font-extrabold text-white">Direct the delivery, line by line.</h2>
            <p className="mt-3 text-[#C5CCE6]">Set the emotion for a speaker or a single line. LinguaDub passes that direction to the voice engine so an excited line stays excited and a serious line stays serious.</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["Excited", "Calm", "Sad", "Serious", "Friendly", "Dramatic", "Professional", "Enthusiastic"].map((e, i) => (
                <span key={e} className={i === 4 ? "chip bg-coral text-white" : "chip bg-white/8 text-[#DCE1F5]"}>{e}</span>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-white/5 p-4">
              <p className="text-xs text-[#AEB6D6]">Line 14 · Friendly</p>
              <p className="mt-1 text-white">&ldquo;Thanks for joining us today.&rdquo;</p>
              <Waveform bars={48} seed={5} height={30} color="#3A4782" progress={0.4} activeColor="#FF786B" className="mt-3" />
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL AUDIENCES + LANGUAGES */}
      <section className="container-ld py-24">
        <SectionHeader
            eyebrow="Reach global audiences"
            title="Multiple language support, matched to your providers."
            body="LinguaDub keeps a configurable language catalogue. Inside the app, a language only appears when the connected transcription, translation and voice providers all support it, so every option you see can actually be delivered."
          />
        <div className="mt-10 flex flex-wrap gap-2.5">
          {LANGUAGES.map((l) => (
            <span key={l.code} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm">
              <span className="font-semibold text-navy">{l.name}</span>
              <span className="text-muted">{l.nativeName}</span>
            </span>
          ))}
        </div>
      </section>

      {/* VOICE IDENTITY */}
      <section className="border-y border-line bg-white">
        <div className="container-ld grid items-center gap-12 py-24 lg:grid-cols-2">
          <div className="card order-2 p-6 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Detected speakers</p>
            <div className="mt-4 space-y-3">
              {[
                ["Host", "#2463EB", "Amara", "Friendly"],
                ["Guest", "#7047EB", "Mateo", "Calm"],
                ["Narrator", "#FF786B", "Your cloned voice", "Professional"],
              ].map(([s, c, v, e]) => (
                <div key={s} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-line p-3">
                  <span className="h-8 w-1.5 rounded-full" style={{ background: c }} />
                  <div>
                    <p className="text-sm font-semibold text-navy">{s}</p>
                    <p className="text-xs text-muted">Voice: {v}</p>
                  </div>
                  <span className="chip bg-canvas text-body">{e}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeader
              eyebrow="Voice identity and consistency"
              title="Every speaker keeps one voice from the first line to the last."
              body="Speaker identification separates who said what. Assign a voice to each speaker once and LinguaDub uses it for every line they speak, across every language in the project."
            />
            <p className="mt-6 flex items-start gap-3 rounded-xl bg-lavender p-4 text-sm text-navy">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-purple" />
              Voice cloning requires recorded, verified consent from the person whose voice is replicated.
            </p>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="container-ld py-24">
        <SectionHeader
          eyebrow="Professional localization workflows"
          title="Seven stages, each one reviewable."
          body="Every project moves through the same visible pipeline, with a real status for each stage and a full processing history."
          align="center"
        />
        <ol className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {[
            [Upload, "Upload content"],
            [FileText, "Transcribe audio"],
            [Languages, "Translate script"],
            [UserRound, "Select voice"],
            [Wand2, "Generate dub"],
            [ClipboardCheck, "Review and edit"],
            [Film, "Export video"],
          ].map(([Icon, label], i) => {
            const I = Icon as typeof Upload;
            return (
              <li key={label as string} className="relative rounded-2xl border border-line bg-white p-5">
                <span className="font-mono text-xs text-muted">Stage {i + 1}</span>
                <I size={22} className="mt-3 text-blue" />
                <p className="mt-3 font-display font-bold text-navy">{label as string}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* SOLUTIONS */}
      <section className="border-y border-line bg-white">
        <div className="container-ld py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader eyebrow="Solutions for creators and businesses" title="Built for everyone who speaks to an audience." />
            <Link href="/solutions" className="btn btn-outline">All solutions <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [MonitorPlay, "YouTube creators", "Launch dubbed channels and multilingual audio tracks for every upload."],
              [Clapperboard, "Film and television", "Prepare localized versions with speaker consistent voices and subtitle files."],
              [Megaphone, "Marketing and advertising", "Adapt campaigns for each market while keeping the brand voice."],
              [GraduationCap, "E learning", "Translate courses and lectures so learners study in their own language."],
              [Radio, "Podcasters and broadcasters", "Publish episodes in new languages with each host keeping their voice."],
              [Building2, "Businesses", "Localize training, product videos and internal updates for global teams."],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof MonitorPlay;
              return (
                <Link key={title as string} href="/solutions" className="group rounded-2xl border border-line p-6 transition-shadow hover:shadow-[var(--shadow-lift)]">
                  <I size={22} className="text-purple" />
                  <h3 className="mt-4 text-lg font-bold">{title as string}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed">{body as string}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue">Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="container-ld grid gap-4 py-20 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [AudioLines, "Speech to speech translation"],
          [Users, "Team review and approvals"],
          [Captions, "SRT and VTT subtitles"],
          [Layers, "Provider adapters"],
        ].map(([Icon, t]) => {
          const I = Icon as typeof Users;
          return (
            <div key={t as string} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-[var(--shadow-card)]">
              <IconTile tone="navy"><I size={18} /></IconTile>
              <span className="font-semibold text-navy">{t as string}</span>
            </div>
          );
        })}
      </section>

      {/* PRICING PREVIEW */}
      <section className="border-t border-line bg-white">
        <div className="container-ld py-24">
          <SectionHeader eyebrow="Pricing" title="Plans that grow with your release schedule." align="center" body="Every plan includes the full dubbing pipeline. Choose the monthly minutes and team size you need." />
          <div className="mt-12">
            <PricingCards compact />
          </div>
          <p className="mt-8 text-center">
            <Link href="/pricing" className="text-sm font-semibold text-blue hover:underline">Compare everything included in each plan</Link>
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
