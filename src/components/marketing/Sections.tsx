import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Section({ children, className, tone = "white", id }: { children: React.ReactNode; className?: string; tone?: "white" | "canvas" | "navy"; id?: string }) {
  return <section id={id} className={cn("py-20 md:py-24", tone === "canvas" && "bg-canvas", tone === "navy" && "bg-navy text-[#C6CEE8]", className)}><div className="container-ra">{children}</div></section>;
}

export function SectionHead({ eyebrow, title, body, center = false, dark = false }: { eyebrow?: string; title: string; body?: string; center?: boolean; dark?: boolean }) {
  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center")}>
      {eyebrow && <p className={cn("eyebrow", dark && "text-[#8FA9FF]")}>{eyebrow}</p>}
      <h2 className={cn("mt-3 text-[2rem] font-extrabold leading-tight md:text-[2.5rem]", dark && "text-white")}>{title}</h2>
      {body && <p className={cn("mt-4 text-lg leading-relaxed", dark ? "text-[#C6CEE8]" : "text-body")}>{body}</p>}
    </div>
  );
}

export function FeatureCard({ icon: Icon, title, body, points }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; body: string; points?: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-card)]">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue"><Icon size={19} /></span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-body">{body}</p>
      {points && <ul className="mt-4 space-y-1.5 text-sm text-ink">{points.map((p) => <li key={p} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />{p}</li>)}</ul>}
    </div>
  );
}

export function CtaBand({ title = "Turn every revenue signal into growth.", body = "Set up your pipeline in minutes, connect your CRM and see your forecast with its assumptions on day one." }: { title?: string; body?: string }) {
  return (
    <section className="py-20">
      <div className="container-ra">
        <div className="rounded-3xl bg-navy px-6 py-14 text-center md:px-16">
          <h2 className="mx-auto max-w-2xl text-[2rem] font-extrabold leading-tight text-white md:text-[2.6rem]">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#C6CEE8]">{body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn btn-primary">Get Started <ArrowRight size={16} /></Link>
            <Link href="/pricing" className="btn btn-light">See pricing</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line bg-canvas py-16 md:py-20">
      <div className="container-ra">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-[2.4rem] font-extrabold leading-[1.08] md:text-[3.2rem]">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body">{body}</p>
        {children}
      </div>
    </section>
  );
}
