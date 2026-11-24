"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient, supabaseReady } from "@/lib/supabase/client";
import { Field, FormMessage, SubmitButton, NotConfigured, validEmail } from "@/components/auth/AuthUi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validEmail(email)) return setError("Enter a valid email address.");
    setLoading(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Reset your password</h1>
      <p className="mt-2 text-muted">Enter your account email and we will send you a reset link.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {!supabaseReady() && <NotConfigured />}
        {error && <FormMessage kind="error">{error}</FormMessage>}
        {sent ? (
          <FormMessage kind="success">If an account exists for {email}, a reset link is on its way. The link expires after one hour.</FormMessage>
        ) : (
          <>
            <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <SubmitButton loading={loading}>Send reset link</SubmitButton>
          </>
        )}
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-blue hover:underline">Back to log in</Link>
      </p>
    </div>
  );
}
