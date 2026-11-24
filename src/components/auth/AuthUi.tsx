"use client";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormMessage({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
  const Icon = kind === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-xl px-3.5 py-3 text-sm",
        kind === "error" && "bg-[#FEF2F2] text-[#991B1B]",
        kind === "success" && "bg-[#F0FDF4] text-[#166534]",
        kind === "info" && "bg-lavender text-navy",
      )}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
      {loading && <Loader2 size={16} className="ra-spin" />}
      {children}
    </button>
  );
}

export function Field({
  id, label, error, ...props
}: { id: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={id} className={cn("input", error && "border-danger")} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      {error && <p id={`${id}-err`} className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function validatePassword(pw: string): string | undefined {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Include at least one letter and one number.";
  return undefined;
}

export function validEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export function NotConfigured() {
  return (
    <FormMessage kind="info">
      Authentication is not connected yet. Add the Supabase URL and anon key to the environment to enable sign in.
    </FormMessage>
  );
}
