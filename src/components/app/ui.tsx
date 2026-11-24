import Link from "next/link";
import { Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.6rem] font-extrabold leading-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-[0.9375rem] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; body: string; action?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue"><Icon size={22} /></span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted">{body}</p>
      {action && <Link href={action.href} className="btn btn-primary btn-sm mt-5">{action.label}</Link>}
      {children}
    </div>
  );
}

export function Card({ title, description, actions, children, className, bodyClass }: { title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("card min-w-0", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[0.98rem] font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClass)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tone = "blue", projection = false }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ComponentType<{ size?: number }>; tone?: "blue" | "purple" | "green" | "navy" | "red" | "amber"; projection?: boolean }) {
  const tones = { blue: "bg-blue-50 text-blue", purple: "bg-lavender text-purple", green: "bg-success-50 text-success", navy: "bg-navy text-white", red: "bg-danger-50 text-danger", amber: "bg-warning-50 text-warning" };
  return (
    <div className={cn("card p-4", projection && "border-dashed border-purple/40")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.8rem] font-medium text-muted">{label}</p>
        {Icon && <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tones[tone])}><Icon size={16} /></span>}
      </div>
      <p className="mt-2 font-display text-[1.5rem] font-extrabold tabular-nums leading-tight text-navy">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {projection && <ProjectionTag />}
        {sub}
      </div>
    </div>
  );
}

/** Marks a number as a projection so it is never mistaken for an actual result. */
export function ProjectionTag({ label = "Projection" }: { label?: string }) {
  return <span className="chip bg-lavender text-purple"><Sparkles size={11} />{label}</span>;
}
export function ActualTag() {
  return <span className="chip bg-success-50 text-success">Actual</span>;
}

const HEALTH: Record<string, { label: string; cls: string }> = {
  healthy: { label: "Healthy", cls: "bg-success-50 text-success" },
  watch: { label: "Watch", cls: "bg-warning-50 text-warning" },
  at_risk: { label: "At risk", cls: "bg-danger-50 text-danger" },
};
export function HealthBadge({ health, score }: { health: string | null | undefined; score?: number | null }) {
  if (!health) return <span className="text-xs text-muted">Closed</span>;
  const h = HEALTH[health] ?? { label: health, cls: "bg-canvas text-body" };
  return <span className={cn("chip", h.cls)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{h.label}{score != null && <span className="tabular-nums opacity-80">{score}</span>}</span>;
}

const SEV: Record<string, string> = { high: "bg-danger-50 text-danger", medium: "bg-warning-50 text-warning", low: "bg-canvas text-body ring-1 ring-line", critical: "bg-danger-50 text-danger", warning: "bg-warning-50 text-warning", opportunity: "bg-success-50 text-success", info: "bg-blue-50 text-blue" };
export function Badge({ tone, children, className }: { tone: string; children: React.ReactNode; className?: string }) {
  return <span className={cn("chip", SEV[tone] ?? "bg-canvas text-body ring-1 ring-line", className)}>{children}</span>;
}

const STATUS: Record<string, string> = { open: "bg-blue-50 text-blue", won: "bg-success-50 text-success", lost: "bg-danger-50 text-danger", pending: "bg-warning-50 text-warning", approved: "bg-blue-50 text-blue", completed: "bg-success-50 text-success", rejected: "bg-canvas text-muted ring-1 ring-line", failed: "bg-danger-50 text-danger", info: "bg-canvas text-body ring-1 ring-line", superseded: "bg-canvas text-muted ring-1 ring-line", connected: "bg-success-50 text-success", disconnected: "bg-canvas text-muted ring-1 ring-line", error: "bg-danger-50 text-danger", done: "bg-success-50 text-success" };
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <span className={cn("chip capitalize", STATUS[status] ?? "bg-canvas text-body ring-1 ring-line")}>{label ?? status.replace(/_/g, " ")}</span>;
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "warning" | "error" | "success"; children: React.ReactNode; className?: string }) {
  const tones = { info: "bg-blue-50 text-navy", warning: "bg-warning-50 text-[#6B3F00]", error: "bg-danger-50 text-[#8A1C26]", success: "bg-success-50 text-[#0D5E41]" };
  return <div className={cn("flex gap-2.5 rounded-xl px-4 py-3 text-sm", tones[tone], className)}><Info size={16} className="mt-0.5 shrink-0" /><div className="min-w-0">{children}</div></div>;
}

export function Evidence({ items }: { items: { label: string; value: string; href?: string }[] }) {
  if (!items?.length) return null;
  return (
    <dl className="mt-3 grid gap-1.5 rounded-lg bg-canvas p-3 text-xs">
      {items.map((e, i) => (
        <div key={i} className="flex flex-wrap gap-x-2">
          <dt className="font-semibold text-ink">{e.label}:</dt>
          <dd className="min-w-0 text-body">{e.href ? <Link href={e.href} className="text-blue hover:underline">{e.value}</Link> : e.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tabs({ tabs, current }: { tabs: { href: string; label: string; key: string }[]; current: string }) {
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Sections">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} aria-current={current === t.key ? "page" : undefined} className={cn("whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold", current === t.key ? "border-blue text-blue" : "border-transparent text-muted hover:text-ink")}>{t.label}</Link>
      ))}
    </nav>
  );
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const ini = name.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";
  return <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue" style={{ width: size, height: size, fontSize: size * 0.38 }}>{ini}</span>;
}

export function Restricted({ what }: { what: string }) {
  return <Notice tone="warning">Your role does not allow you to {what}. Ask an administrator if you need access.</Notice>;
}
