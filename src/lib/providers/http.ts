import { ProviderError } from "./types";

/** fetch with timeout and retries on 429 and 5xx responses. */
export async function providerFetch(
  provider: string,
  url: string,
  init: RequestInit,
  opts: { retries?: number; timeoutMs?: number } = {},
): Promise<Response> {
  const retries = opts.retries ?? 3;
  const timeoutMs = opts.timeoutMs ?? 120_000;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      const body = await res.text().catch(() => "");
      const retryable = res.status === 429 || res.status >= 500;
      const detail = extractMessage(body) || res.statusText;
      lastErr = new ProviderError(provider, `${res.status} ${detail}`, retryable, res.status);
      if (!retryable || attempt === retries) throw lastErr;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof ProviderError && !err.retryable) throw err;
      lastErr = err instanceof ProviderError ? err : new ProviderError(provider, (err as Error).message || "network error", true);
      if (attempt === retries) throw lastErr;
    }
    await new Promise((r) => setTimeout(r, 800 * 2 ** attempt + Math.random() * 300));
  }
  throw lastErr;
}

function extractMessage(body: string): string {
  try {
    const j = JSON.parse(body);
    const d = j?.detail ?? j?.error ?? j?.message;
    if (typeof d === "string") return d;
    if (d?.message) return String(d.message);
    if (Array.isArray(d)) return d.map((x) => x?.msg ?? JSON.stringify(x)).join("; ");
    return JSON.stringify(j).slice(0, 300);
  } catch {
    return body.slice(0, 300);
  }
}

const ISO3: Record<string, string> = {
  eng: "en", spa: "es", fra: "fr", fre: "fr", deu: "de", ger: "de", por: "pt", ara: "ar", hin: "hi",
  zho: "zh", chi: "zh", cmn: "zh", yue: "zh", jpn: "ja", kor: "ko", ita: "it", nld: "nl", dut: "nl",
  tur: "tr", yor: "yo", hau: "ha", ibo: "ig", swa: "sw", swh: "sw", pol: "pl", rus: "ru", ind: "id",
};
const NAMES: Record<string, string> = {
  english: "en", spanish: "es", french: "fr", german: "de", portuguese: "pt", arabic: "ar", hindi: "hi",
  chinese: "zh", japanese: "ja", korean: "ko", italian: "it", dutch: "nl", turkish: "tr", yoruba: "yo",
  hausa: "ha", igbo: "ig", swahili: "sw", polish: "pl", russian: "ru", indonesian: "id",
};

/** Normalises provider language identifiers (ISO 639-1, 639-3 or English names) to catalogue codes. */
export function normaliseLanguage(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = v.toLowerCase().trim();
  if (s.length === 2) return s;
  if (s.includes("-") || s.includes("_")) return s.slice(0, 2);
  return ISO3[s] ?? NAMES[s] ?? null;
}
