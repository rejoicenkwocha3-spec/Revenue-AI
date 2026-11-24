import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "0:00";
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatMs(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  const a = Math.abs(ms);
  const m = Math.floor(a / 60000);
  const s = Math.floor((a % 60000) / 1000);
  const r = Math.floor(a % 1000);
  return `${sign}${m}:${String(s).padStart(2, "0")}.${String(r).padStart(3, "0")}`;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleString("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d: string | Date): string {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return `${Math.floor(diff / 86400)} d ago`;
}

export function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._]+/g, "_").slice(-120);
}
