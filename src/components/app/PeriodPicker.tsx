import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftPeriod, isoDate, type Period } from "@/lib/revenue/periods";
import { cn } from "@/lib/utils";

/** Date filter: period type and previous or next period, kept in the URL so views can be shared. */
export function PeriodPicker({ period, basePath, fiscal, extra = "" }: { period: Period; basePath: string; fiscal: number; extra?: string }) {
  const href = (p: Period) => `${basePath}?period=${p.type}&start=${isoDate(p.start)}${extra}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-line-strong bg-white p-0.5 text-sm">
        {(["month", "quarter", "year"] as const).map((t) => (
          <Link key={t} href={`${basePath}?period=${t}${extra}`} className={cn("rounded-md px-3 py-1.5 font-semibold capitalize", period.type === t ? "bg-navy text-white" : "text-body hover:text-ink")}>{t}</Link>
        ))}
      </div>
      <div className="inline-flex items-center rounded-lg border border-line-strong bg-white text-sm">
        <Link href={href(shiftPeriod(period, -1, fiscal))} className="px-2 py-1.5 text-muted hover:text-ink" aria-label="Previous period"><ChevronLeft size={16} /></Link>
        <span className="min-w-[110px] px-1 text-center font-semibold text-ink">{period.label}</span>
        <Link href={href(shiftPeriod(period, 1, fiscal))} className="px-2 py-1.5 text-muted hover:text-ink" aria-label="Next period"><ChevronRight size={16} /></Link>
      </div>
    </div>
  );
}
