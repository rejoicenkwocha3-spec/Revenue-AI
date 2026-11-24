import Image from "next/image";
import Link from "next/link";
import { BRAND_MARK, type BrandMark } from "@/config/brand";
import { cn } from "@/lib/utils";

const NAVY = "#101B3F";
const BLUE = "#2463EB";
const PURPLE = "#7047EB";
const CORAL = "#FF786B";

/** The six concept marks from the brand selection board. `ink` is the structural colour. */
export function ConceptMark({ concept, ink = NAVY, className }: { concept: Exclude<BrandMark, "uploaded">; ink?: string; className?: string }) {
  const common = { viewBox: "0 0 64 64", fill: "none", className, "aria-hidden": true } as const;
  switch (concept) {
    case "concept1":
      return (
        <svg {...common}>
          <path d="M8 14a8 8 0 0 1 8-8h18a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H20l-8 7v-7.6A8 8 0 0 1 8 26z" fill={BLUE} />
          <path d="M56 30a8 8 0 0 0-8-8H30a8 8 0 0 0-8 8v12a8 8 0 0 0 8 8h14l8 7v-7.6a8 8 0 0 0 4-6.4z" fill={PURPLE} />
          <path d="M22 30a8 8 0 0 1 8-8h12v4a8 8 0 0 1-8 8H22z" fill={ink} />
          <circle cx="33" cy="40" r="2.2" fill="#fff" /><circle cx="40" cy="40" r="2.2" fill="#fff" /><circle cx="47" cy="40" r="2.2" fill="#fff" />
        </svg>
      );
    case "concept2":
      return (
        <svg {...common}>
          <path d="M14 8h36a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H30l-12 9v-9h-4a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z" stroke={ink} strokeWidth="5" strokeLinejoin="round" />
          <g strokeLinecap="round" strokeWidth="4.5">
            <path d="M18 26v4" stroke={BLUE} /><path d="M25 20v16" stroke={BLUE} /><path d="M32 16v24" stroke={CORAL} />
            <path d="M39 21v14" stroke={PURPLE} /><path d="M46 25v6" stroke={PURPLE} />
          </g>
        </svg>
      );
    case "concept3":
      return (
        <svg {...common}>
          <path d="M2 58V40C2 24 8 12 17 12c5 0 8 3 8 7l-2 4 3 6-3 2v4c0 2.5-1.6 4-4 4h-3v19z" fill={ink} />
          <path d="M62 58V40c0-16-6-28-15-28-5 0-8 3-8 7l2 4-3 6 3 2v4c0 2.5 1.6 4 4 4h3v19z" fill={PURPLE} />
          <g strokeLinecap="round" strokeWidth="3.5"><path d="M27 34v6" stroke={BLUE} /><path d="M32 29v16" stroke={CORAL} /><path d="M37 34v6" stroke={BLUE} /></g>
        </svg>
      );
    case "concept4":
      return (
        <svg {...common}>
          <path d="M8 6h11v41h37v11H14a6 6 0 0 1-6-6z" fill={ink} />
          <g strokeLinecap="round" strokeWidth="5.5">
            <path d="M28 38v2" stroke={BLUE} /><path d="M36 30v10" stroke={BLUE} /><path d="M44 20v20" stroke={PURPLE} /><path d="M52 12v28" stroke={CORAL} />
          </g>
        </svg>
      );
    case "concept5":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="22" stroke={ink} strokeWidth="4.5" />
          <path d="M15 19.5h34M15 44.5h34M32 10c-6 3-9 6-10 9.5M32 10c6 3 9 6 10 9.5M32 54c-6-3-9-6-10-9.5M32 54c6-3 9-6 10-9.5" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M8 47c-5-4 9-14 25-20s27-7 27-2" stroke={PURPLE} strokeWidth="4.5" strokeLinecap="round" />
          <g strokeLinecap="round" strokeWidth="4" stroke={BLUE}>
            <path d="M20 30v4" /><path d="M26 26v12" /><path d="M32 23v18" /><path d="M38 26v12" /><path d="M44 30v4" />
          </g>
        </svg>
      );
    case "concept6":
      return (
        <svg {...common}>
          <path d="M14 10.5c0-4 4.4-6.5 7.9-4.4l32.5 19.8c3.3 2 3.3 6.8 0 8.8L32 48.4V58l-9-6.6-1.1.7C18.4 54.2 14 51.7 14 47.6z" fill={ink} />
          <g strokeLinecap="round" strokeWidth="4"><path d="M24 27v6" stroke={BLUE} /><path d="M31 22v16" stroke={PURPLE} /><path d="M38 26v8" stroke={CORAL} /></g>
        </svg>
      );
  }
}

/** The active brand mark. On dark surfaces the uploaded artwork sits on a white tile so its navy lines stay visible. */
export function LogoMark({ size = 32, dark = false, className }: { size?: number; dark?: boolean; className?: string }) {
  if (BRAND_MARK === "uploaded") {
    const img = <Image src="/brand/linguadub-mark.png" alt="" width={size} height={size} priority className="object-contain" style={{ width: size, height: size }} />;
    if (!dark) return <span className={cn("inline-flex shrink-0", className)}>{img}</span>;
    return (
      <span className={cn("inline-flex shrink-0 items-center justify-center rounded-[22%] bg-white", className)} style={{ width: size + 8, height: size + 8 }}>
        <Image src="/brand/linguadub-mark.png" alt="" width={size} height={size} className="object-contain" style={{ width: size - 2, height: size - 2 }} />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <ConceptMark concept={BRAND_MARK} ink={dark ? "#FFFFFF" : NAVY} className="h-full w-full" />
    </span>
  );
}

export function Logo({ dark = false, size = 32, href = "/", className }: { dark?: boolean; size?: number; href?: string | null; className?: string }) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} dark={dark} />
      <span className={cn("font-display text-[1.2rem] font-extrabold tracking-[-0.03em]", dark ? "text-white" : "text-navy")}>
        Lingua<span className={dark ? "text-[#9DB8FF]" : "text-blue"}>Dub</span>
      </span>
    </span>
  );
  if (!href) return content;
  return (
    <Link href={href} aria-label="LinguaDub home" className="inline-flex">
      {content}
    </Link>
  );
}
