"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, supabaseReady } from "@/lib/supabase/client";
import { Field, FormMessage, SubmitButton, NotConfigured, validatePassword } from "@/components/auth/AuthUi";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabaseReady()) return;
    createClient().auth.getUser().then(({ data }) => setHasSession(!!data.user));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pw = validatePassword(password);
    if (pw) return setError(pw);
    if (password !== confirm) return setError("The passwords do not match.");
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    router.replace("/dashboard?password=updated");
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Choose a new password</h1>
      <p className="mt-2 text-muted">Use at least 8 characters with a letter and a number.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {!supabaseReady() && <NotConfigured />}
        {hasSession === false && (
          <FormMessage kind="error">
            This reset link is invalid or has expired. <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>.
          </FormMessage>
        )}
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <Field id="password" label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field id="confirm" label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>
    </div>
  );
}
