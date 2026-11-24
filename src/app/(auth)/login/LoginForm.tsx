"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, supabaseReady } from "@/lib/supabase/client";
import { Field, FormMessage, SubmitButton, NotConfigured, validEmail } from "@/components/auth/AuthUi";

const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback_error: "That link is invalid or has expired. Request a new one.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(CALLBACK_ERRORS[params.get("error") ?? ""] ?? null);
  const verified = params.get("verified") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validEmail(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setLoading(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(
          error.message.toLowerCase().includes("email not confirmed")
            ? "Verify your email address first. Check your inbox for the confirmation link."
            : error.message === "Invalid login credentials"
              ? "The email or password is incorrect."
              : error.message,
        );
        setLoading(false);
        return;
      }
      router.replace(safeNext);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Welcome back</h1>
      <p className="mt-2 text-muted">Log in to your LinguaDub workspace.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {!supabaseReady() && <NotConfigured />}
        {verified && <FormMessage kind="success">Your email is verified. Log in to continue.</FormMessage>}
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div>
          <Field id="password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p className="mt-2 text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-blue hover:underline">Forgot password?</Link>
          </p>
        </div>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to LinguaDub? <Link href="/signup" className="font-semibold text-blue hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
