import { Logo } from "@/components/brand/Logo";

export function WorkspaceMissing({ email }: { email: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="card max-w-lg p-8">
        <Logo href="/" />
        <h1 className="mt-6 text-2xl font-extrabold">Your workspace is not ready</h1>
        <p className="mt-3">
          You are signed in{email ? ` as ${email}` : ""}, but no workspace was created for this account. This usually means the database
          migration has not been run, or the <span className="font-mono">revenue_ai</span> schema is not listed under Exposed schemas in
          Supabase (Project Settings, API).
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button type="submit" className="btn btn-primary">Sign out</button>
        </form>
      </div>
    </div>
  );
}
