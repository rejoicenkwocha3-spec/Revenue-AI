"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "datetime-local" | "email" | "select" | "textarea" | "checkbox" | "tags";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  half?: boolean;
  min?: number;
  max?: number;
};

type Values = Record<string, string | boolean>;

function toPayload(fields: FieldDef[], v: Values) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = v[f.name];
    if (f.type === "checkbox") out[f.name] = Boolean(raw);
    else if (f.type === "number") out[f.name] = raw === "" || raw == null ? null : Number(raw);
    else if (f.type === "tags") out[f.name] = String(raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (f.type === "datetime-local") out[f.name] = raw ? new Date(String(raw)).toISOString() : null;
    else out[f.name] = raw === "" ? null : raw;
  }
  return out;
}

function validate(fields: FieldDef[], v: Values): Record<string, string> {
  const e: Record<string, string> = {};
  for (const f of fields) {
    const raw = v[f.name];
    if (f.required && (raw === "" || raw == null)) e[f.name] = `${f.label} is required.`;
    if (f.type === "number" && raw !== "" && raw != null) {
      const n = Number(raw);
      if (!Number.isFinite(n)) e[f.name] = "Enter a number.";
      else if (f.min != null && n < f.min) e[f.name] = `Must be at least ${f.min}.`;
      else if (f.max != null && n > f.max) e[f.name] = `Must be at most ${f.max}.`;
    }
    if (f.type === "email" && raw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw))) e[f.name] = "Enter a valid email.";
  }
  return e;
}

export function FieldInput({ f, value, error, onChange }: { f: FieldDef; value: string | boolean; error?: string; onChange: (v: string | boolean) => void }) {
  const id = `f-${f.name}`;
  if (f.type === "checkbox") {
    return (
      <label htmlFor={id} className="flex items-start gap-2.5 text-sm text-ink">
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#315BDB]" />
        <span>{f.label}{f.hint && <span className="block text-xs text-muted">{f.hint}</span>}</span>
      </label>
    );
  }
  return (
    <div className={cn(f.half ? "sm:col-span-1" : "sm:col-span-2")}>
      <label htmlFor={id} className="label">{f.label}{f.required && <span className="text-danger"> *</span>}</label>
      {f.type === "select" ? (
        <select id={id} className={cn("input", error && "border-danger")} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {!f.required && <option value="">Not set</option>}
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : f.type === "textarea" ? (
        <textarea id={id} rows={3} className={cn("input", error && "border-danger")} value={String(value ?? "")} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type={f.type === "tags" ? "text" : f.type ?? "text"} className={cn("input", error && "border-danger")} value={String(value ?? "")} placeholder={f.placeholder} min={f.min} max={f.max} step={f.type === "number" ? "any" : undefined} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      )}
      {f.hint && !error && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

/** A validated form in a modal that posts JSON to an API route and refreshes the page. */
export function FormModal({ open, onClose, title, endpoint, method = "POST", fields, initial = {}, submitLabel = "Save", onSaved }: {
  open: boolean; onClose: () => void; title: string; endpoint: string; method?: "POST" | "PATCH"; fields: FieldDef[]; initial?: Values; submitLabel?: string; onSaved?: (data: unknown) => void;
}) {
  const router = useRouter();
  const init = () => Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? (f.type === "checkbox" ? false : f.type === "select" && f.required ? f.options?.[0]?.value ?? "" : "")]));
  const [values, setValues] = useState<Values>(init);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const errs = validate(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setError(null);
    try {
      const data = await api(endpoint, { method, body: toPayload(fields, values) });
      onSaved?.(data);
      router.refresh();
      onClose();
      setValues(init());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => submit()}>{busy && <Loader2 size={14} className="ra-spin" />}{submitLabel}</button></>}>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-[#8A1C26] sm:col-span-2">{error}</p>}
        {fields.map((f) => <FieldInput key={f.name} f={f} value={values[f.name]} error={errors[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />)}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

/** Button that opens a FormModal. */
export function FormButton({ label, className = "btn btn-primary btn-sm", icon, ...props }: Omit<Parameters<typeof FormModal>[0], "open" | "onClose"> & { label: string; className?: string; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{icon}{label}</button>
      {open && <FormModal {...props} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Calls an API route, with an inline confirmation step for destructive actions. */
export function ActionButton({ endpoint, method = "POST", body, label, confirm, className = "btn btn-outline btn-sm", redirectTo, onDone, icon }: { endpoint: string; method?: string; body?: unknown; label: React.ReactNode; confirm?: string; className?: string; redirectTo?: string; onDone?: (d: unknown) => void; icon?: React.ReactNode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function go() {
    setBusy(true); setError(null);
    try {
      const d = await api(endpoint, { method, body });
      onDone?.(d);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); setAsking(false); }
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      {asking ? (
        <span className="inline-flex flex-wrap items-center gap-2 text-xs text-ink">
          {confirm}
          <button type="button" className="btn btn-danger btn-xs" disabled={busy} onClick={go}>{busy && <Loader2 size={12} className="ra-spin" />}Confirm</button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setAsking(false)}>Cancel</button>
        </span>
      ) : (
        <button type="button" className={className} disabled={busy} onClick={() => (confirm ? setAsking(true) : go())}>{busy ? <Loader2 size={14} className="ra-spin" /> : icon}{label}</button>
      )}
      {error && <span className="max-w-xs text-xs text-danger" role="alert">{error}</span>}
    </span>
  );
}
