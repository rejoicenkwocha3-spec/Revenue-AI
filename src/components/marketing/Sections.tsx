import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-[2rem] font-extrabold leading-[1.1] md:text-[2.6rem]">{title}</h2>
      {body && <p className="mt-4 text-[1.0625rem] leading-relaxed text-body">{body}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, body, children }: { eyebrow: string; title: React.ReactNode; body: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_0%,#F0EDFF_0%,rgba(240,237,255,0)_60%)]" />
      <div className="container-ld relative py-16 md:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-[2.4rem] font-extrabold leading-[1.05] md:text-[3.5rem]">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body">{body}</p>
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function CtaBand({
  title = "Take your content to every language.",
  body = "Upload a video, choose your languages and publish a natural sounding dub with subtitles from one workspace.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="container-ld py-20">
      <div className="relative overflow-hidden rounded-[28px] bg-navy px-6 py-14 text-center md:px-16 md:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-purple/25" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full border-[28px] border-blue/20" />
        <h2 className="relative mx-auto max-w-2xl text-[2rem] font-extrabold leading-tight text-white md:text-[2.75rem]">{title}</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-[1.0625rem] text-[#C5CCE6]">{body}</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="btn btn-light">
            Start Dubbing <ArrowRight size={16} />
          </Link>
          <Link href="/pricing" className="btn border-white/25 text-white hover:border-white/60">
            View pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

export function IconTile({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "purple" | "coral" | "navy" }) {
  const tones = {
    blue: "bg-blue-50 text-blue",
    purple: "bg-lavender text-purple",
    coral: "bg-coral-50 text-coral",
    navy: "bg-navy text-white",
  };
  return <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl", tones[tone])}>{children}</span>;
}
