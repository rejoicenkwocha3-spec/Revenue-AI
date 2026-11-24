import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.65rem] font-extrabold leading-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon, title, body, action,
}: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender text-purple"><Icon size={22} /></span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted">{body}</p>
      {action && <Link href={action.href} className="btn btn-primary btn-sm mt-5">{action.label}</Link>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tone = "blue" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ComponentType<{ size?: number }>; tone?: "blue" | "purple" | "coral" | "navy" }) {
  const tones = { blue: "bg-blue-50 text-blue", purple: "bg-lavender text-purple", coral: "bg-coral-50 text-coral", navy: "bg-navy text-white" };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}><Icon size={17} /></span>
      </div>
      <p className="mt-3 font-display text-[1.75rem] font-extrabold tabular-nums text-navy">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-canvas text-body ring-1 ring-line" },
  queued: { label: "Queued", cls: "bg-[#F1F5F9] text-[#475569]" },
  uploading: { label: "Uploading", cls: "bg-blue-50 text-blue" },
  transcribing: { label: "Transcribing", cls: "bg-blue-50 text-blue" },
  translating: { label: "Translating", cls: "bg-blue-50 text-blue" },
  review: { label: "In review", cls: "bg-[#FFF7ED] text-warning" },
  generating_voice: { label: "Generating Voice", cls: "bg-lavender text-purple" },
  synchronising: { label: "Synchronising", cls: "bg-lavender text-purple" },
  rendering: { label: "Rendering", cls: "bg-lavender text-purple" },
  completed: { label: "Completed", cls: "bg-[#F0FDF4] text-success" },
  failed: { label: "Failed", cls: "bg-[#FEF2F2] text-danger" },
  running: { label: "Running", cls: "bg-blue-50 text-blue" },
  cancelled: { label: "Cancelled", cls: "bg-canvas text-muted" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, cls: "bg-canvas text-body" };
  const active = ["queued", "uploading", "transcribing", "translating", "generating_voice", "synchronising", "rendering", "running"].includes(status);
  return (
    <span className={cn("chip whitespace-nowrap", s.cls)}>
      {active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {s.label}
    </span>
  );
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "warning" | "error" | "success"; children: React.ReactNode; className?: string }) {
  const tones = {
    info: "bg-lavender text-navy",
    warning: "bg-[#FFF7ED] text-[#7C2D12]",
    error: "bg-[#FEF2F2] text-[#991B1B]",
    success: "bg-[#F0FDF4] text-[#166534]",
  };
  return <div className={cn("rounded-xl px-4 py-3 text-sm", tones[tone], className)}>{children}</div>;
}
