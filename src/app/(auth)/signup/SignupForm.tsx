"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { createClient, supabaseReady } from "@/lib/supabase/client";
import { Field, FormMessage, SubmitButton, NotConfigured, validatePassword, validEmail } from "@/components/auth/AuthUi";

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite");
  const [form, setForm] = useState({ name: "", email: params.get("email") ?? "", password: "", workspace: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter your full name.";
    if (!validEmail(form.email)) errs.email = "Enter a valid email address.";
    const pw = validatePassword(form.password);
    if (pw) errs.password = pw;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const next = invite ? `/invite/${invite}` : "/dashboard";
    try {
      const { data, error } = await createClient().auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: { full_name: form.name.trim(), workspace_name: form.workspace.trim() || undefined },
        },
      });
      if (error) throw error;
      if (data.session) {
        router.replace(next);
        router.refresh();
        return;
      }
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender text-purple"><MailCheck size={26} /></span>
        <h1 className="mt-6 text-3xl font-extrabold">Check your email</h1>
        <p className="mt-3 text-muted">
          We sent a verification link to <span className="font-semibold text-navy">{form.email}</span>. Open it to activate your account.
        </p>
        <Link href="/login" className="btn btn-outline mt-8">Back to log in</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Create your account</h1>
      <p className="mt-2 text-muted">Start dubbing your content into new languages.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {!supabaseReady() && <NotConfigured />}
        {invite && <FormMessage kind="info">Create an account with the invited email address to join the team.</FormMessage>}
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <Field id="name" label="Full name" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} />
        <Field id="email" label="Work email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
        <Field id="password" label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} placeholder="At least 8 characters" />
        {!invite && <Field id="workspace" label="Workspace name (optional)" value={form.workspace} onChange={set("workspace")} placeholder="Acme Studios" />}
        <SubmitButton loading={loading}>Create account</SubmitButton>
        <p className="text-center text-xs text-muted">By creating an account you agree to use voice features only with the permission of each voice owner.</p>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-blue hover:underline">Log in</Link>
      </p>
    </div>
  );
}
