export interface Cue { startMs: number; endMs: number; text: string }

function ts(ms: number, sep: "," | "."): string {
  const v = Math.max(0, Math.round(ms));
  const h = Math.floor(v / 3_600_000);
  const m = Math.floor((v % 3_600_000) / 60_000);
  const s = Math.floor((v % 60_000) / 1000);
  const r = v % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${sep}${String(r).padStart(3, "0")}`;
}

/** Splits long lines at word boundaries so captions stay within two lines of about 42 characters. */
function wrap(text: string, width = 42): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.join("\n");
}

export function applyOffset(cues: Cue[], offsetMs: number): Cue[] {
  return cues.map((c) => ({ ...c, startMs: Math.max(0, c.startMs + offsetMs), endMs: Math.max(0, c.endMs + offsetMs) }));
}

export function toSrt(cues: Cue[]): string {
  return cues
    .filter((c) => c.text.trim())
    .map((c, i) => `${i + 1}\n${ts(c.startMs, ",")} --> ${ts(Math.max(c.endMs, c.startMs + 300), ",")}\n${wrap(c.text)}\n`)
    .join("\n");
}

export function toVtt(cues: Cue[]): string {
  return (
    "WEBVTT\n\n" +
    cues
      .filter((c) => c.text.trim())
      .map((c) => `${ts(c.startMs, ".")} --> ${ts(Math.max(c.endMs, c.startMs + 300), ".")}\n${wrap(c.text)}\n`)
      .join("\n")
  );
}
