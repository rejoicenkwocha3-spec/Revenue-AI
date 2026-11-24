export type PeriodType = "month" | "quarter" | "year";
export interface Period { type: PeriodType; start: Date; end: Date; label: string }

const iso = (d: Date) => d.toISOString().slice(0, 10);
export const isoDate = iso;

function utc(y: number, m: number, d = 1) {
  return new Date(Date.UTC(y, m, d));
}

/** Period containing `at`, honouring the organisation's fiscal year start month (1 to 12). */
export function periodFor(type: PeriodType, at: Date, fiscalStartMonth = 1): Period {
  const y = at.getUTCFullYear();
  const m = at.getUTCMonth();
  if (type === "month") {
    const start = utc(y, m);
    const end = utc(y, m + 1, 0);
    return { type, start, end, label: start.toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" }) };
  }
  const fs = fiscalStartMonth - 1;
  const offset = (m - fs + 12) % 12;
  const fyStart = utc(m >= fs ? y : y - 1, fs);
  if (type === "year") {
    const start = fyStart;
    const end = utc(start.getUTCFullYear(), start.getUTCMonth() + 12, 0);
    const fyLabel = fs === 0 ? `${start.getUTCFullYear()}` : `FY${end.getUTCFullYear()}`;
    return { type, start, end, label: fyLabel };
  }
  const q = Math.floor(offset / 3);
  const start = utc(fyStart.getUTCFullYear(), fyStart.getUTCMonth() + q * 3);
  const end = utc(start.getUTCFullYear(), start.getUTCMonth() + 3, 0);
  const fyEnd = utc(fyStart.getUTCFullYear(), fyStart.getUTCMonth() + 12, 0);
  return { type, start, end, label: `Q${q + 1} ${fs === 0 ? start.getUTCFullYear() : `FY${fyEnd.getUTCFullYear()}`}` };
}

export function shiftPeriod(p: Period, steps: number, fiscalStartMonth = 1): Period {
  const months = p.type === "month" ? 1 : p.type === "quarter" ? 3 : 12;
  const at = utc(p.start.getUTCFullYear(), p.start.getUTCMonth() + months * steps, 15);
  return periodFor(p.type, at, fiscalStartMonth);
}

export function inPeriod(dateStr: string | null | undefined, p: Period): boolean {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  return d >= iso(p.start) && d <= iso(p.end);
}

export function parsePeriod(type: string | null | undefined, start: string | null | undefined, fiscalStartMonth: number, now: Date): Period {
  const t: PeriodType = type === "month" || type === "year" ? type : "quarter";
  const at = start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? new Date(`${start}T12:00:00Z`) : now;
  return periodFor(t, at, fiscalStartMonth);
}

export function daysBetween(a: string | Date, b: string | Date): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
