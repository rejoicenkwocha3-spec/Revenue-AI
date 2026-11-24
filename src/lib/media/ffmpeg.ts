import "server-only";
import { spawn } from "node:child_process";
import { promises as fs, existsSync } from "node:fs";
import path from "node:path";

function ffmpegPath(): string {
  const fromEnv = process.env.FFMPEG_PATH;
  if (fromEnv) return fromEnv;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const p = require("ffmpeg-static") as string | null;
  if (p && existsSync(p)) return p;
  const traced = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");
  if (existsSync(traced)) return traced;
  throw new Error("ffmpeg binary not found. Install ffmpeg-static or set FFMPEG_PATH.");
}

export function runFfmpeg(args: string[], opts: { allowFail?: boolean; timeoutMs?: number } = {}): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath(), ["-hide_banner", "-nostdin", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
    });
    const timer = setTimeout(() => proc.kill("SIGKILL"), opts.timeoutMs ?? 15 * 60_000);
    proc.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !opts.allowFail) {
        reject(new Error(`ffmpeg failed (${code}): ${stderr.split("\n").filter(Boolean).slice(-4).join(" | ")}`));
      } else resolve({ code: code ?? 0, stderr });
    });
  });
}

export interface ProbeResult {
  durationSeconds: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
  width: number | null;
  height: number | null;
}

export async function probe(file: string): Promise<ProbeResult> {
  const { stderr } = await runFfmpeg(["-i", file], { allowFail: true });
  const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  const video = /Stream #[^\n]*Video:[^\n]*?(\d{2,5})x(\d{2,5})/.exec(stderr);
  return {
    durationSeconds: d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : null,
    hasVideo: /Stream #[^\n]*Video:/.test(stderr) && !/Video: (mjpeg|png)[^\n]*attached pic/.test(stderr),
    hasAudio: /Stream #[^\n]*Audio:/.test(stderr),
    width: video ? Number(video[1]) : null,
    height: video ? Number(video[2]) : null,
  };
}

/** Mono MP3 suitable for speech recognition. */
export async function extractAudio(input: string, output: string) {
  await runFfmpeg(["-y", "-i", input, "-vn", "-ac", "1", "-ar", "22050", "-b:a", "64k", output]);
}

export async function durationMs(file: string): Promise<number> {
  const p = await probe(file);
  return Math.round((p.durationSeconds ?? 0) * 1000);
}

/** Builds an atempo chain for any tempo between 0.25 and 4. */
function atempoChain(tempo: number): string {
  const parts: string[] = [];
  let t = tempo;
  while (t > 2) { parts.push("atempo=2"); t /= 2; }
  while (t < 0.5) { parts.push("atempo=0.5"); t /= 0.5; }
  parts.push(`atempo=${t.toFixed(4)}`);
  return parts.join(",");
}

export async function changeTempo(input: string, output: string, tempo: number) {
  if (Math.abs(tempo - 1) < 0.01) {
    await fs.copyFile(input, output);
    return;
  }
  await runFfmpeg(["-y", "-i", input, "-filter:a", atempoChain(tempo), "-ar", "44100", "-ac", "1", output]);
}

export interface Placement { file: string; startMs: number }

/**
 * Places each clip at its start time on a silent track of totalMs, optionally mixed with a
 * quiet bed of the original audio. Inputs are mixed in chunks to keep command lines small.
 */
export async function buildTrack(params: {
  placements: Placement[];
  totalMs: number;
  output: string;
  workDir: string;
  bed?: { file: string; volume: number } | null;
}) {
  const { placements, totalMs, output, workDir, bed } = params;
  const totalSec = (Math.max(totalMs, 1000) / 1000).toFixed(3);
  const CHUNK = 40;
  const chunkFiles: string[] = [];
  for (let i = 0; i < placements.length; i += CHUNK) {
    const group = placements.slice(i, i + CHUNK);
    const out = path.join(workDir, `chunk_${i / CHUNK}.wav`);
    const args = ["-y", "-f", "lavfi", "-t", totalSec, "-i", "anullsrc=r=44100:cl=mono"];
    group.forEach((g) => args.push("-i", g.file));
    const filters = group.map((g, k) => `[${k + 1}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${Math.max(0, Math.round(g.startMs))}:all=1[d${k}]`);
    const mixInputs = ["[0:a]", ...group.map((_, k) => `[d${k}]`)].join("");
    filters.push(`${mixInputs}amix=inputs=${group.length + 1}:duration=first:normalize=0[m]`);
    args.push("-filter_complex", filters.join(";"), "-map", "[m]", "-t", totalSec, out);
    await runFfmpeg(args);
    chunkFiles.push(out);
  }
  const args = ["-y", "-f", "lavfi", "-t", totalSec, "-i", "anullsrc=r=44100:cl=mono"];
  chunkFiles.forEach((f) => args.push("-i", f));
  let bedLabel = "";
  const filters: string[] = [];
  if (bed && bed.volume > 0) {
    args.push("-i", bed.file);
    const idx = chunkFiles.length + 1;
    filters.push(`[${idx}:a]aresample=44100,aformat=channel_layouts=mono,volume=${bed.volume.toFixed(3)}[bed]`);
    bedLabel = "[bed]";
  }
  const inputs = ["[0:a]", ...chunkFiles.map((_, k) => `[${k + 1}:a]`)].join("") + bedLabel;
  const count = 1 + chunkFiles.length + (bedLabel ? 1 : 0);
  filters.push(`${inputs}amix=inputs=${count}:duration=first:normalize=0,alimiter=limit=0.95[out]`);
  args.push("-filter_complex", filters.join(";"), "-map", "[out]", "-t", totalSec, "-ac", "2", "-b:a", "192k", output);
  await runFfmpeg(args);
}

/** Replaces the audio of a video with the dubbed track, optionally embedding a subtitle stream. */
export async function muxVideo(params: { video: string; audio: string; output: string; subtitles?: { file: string; language: string } | null }) {
  const args = ["-y", "-i", params.video, "-i", params.audio];
  if (params.subtitles) args.push("-i", params.subtitles.file);
  args.push("-map", "0:v:0", "-map", "1:a:0");
  if (params.subtitles) args.push("-map", "2:s:0", "-c:s", "mov_text", "-metadata:s:s:0", `language=${params.subtitles.language}`);
  args.push("-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", params.output);
  await runFfmpeg(args);
}

export async function transcode(input: string, output: string, format: "mp3" | "wav") {
  const args = format === "wav" ? ["-y", "-i", input, "-c:a", "pcm_s16le", output] : ["-y", "-i", input, "-b:a", "192k", output];
  await runFfmpeg(args);
}
