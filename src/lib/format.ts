export function money(n: number | null | undefined, currency = "USD", compact = false): string {
  if (n == null || !Number.isFinite(n)) return "Not set";
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: compact && Math.abs(n) >= 1000 ? 1 : 0, notation: compact ? "compact" : "standard" }).format(n);
}
export function pct(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return "No data";
  return `${n.toFixed(digits)}%`;
}
export function num(n: number | null | undefined): string {
  if (n == null) return "0";
  return new Intl.NumberFormat("en").format(n);
}
