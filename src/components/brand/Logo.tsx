import Link from "next/link";
import { cn } from "@/lib/utils";

/** Revenue AI mark: Concept 1, Revenue Growth. Rising bars with a growth line breaking upward. */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" fill="none">
      <rect x="8" y="36" width="10" height="20" rx="2.5" fill="#315BDB" />
      <rect x="23" y="26" width="10" height="30" rx="2.5" fill="#4778F5" />
      <rect x="38" y="16" width="10" height="40" rx="2.5" fill="#7865E9" />
      <path d="M8 30 L30 14 L40 20 L56 6" stroke="#19A875" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M47 6 H56 V15" stroke="#19A875" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ dark = false, size = 30, href = "/", className }: { dark?: boolean; size?: number; href?: string | null; className?: string }) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className={cn("font-display text-[1.15rem] font-extrabold tracking-tight", dark ? "text-white" : "text-navy")}>
        Revenue<span className={dark ? "text-[#8FA9FF]" : "text-blue"}> AI</span>
      </span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} aria-label="Revenue AI home" className="inline-flex">
      {inner}
    </Link>
  );
}
