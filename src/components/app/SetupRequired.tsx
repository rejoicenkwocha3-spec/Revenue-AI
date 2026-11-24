import { Logo } from "@/components/brand/Logo";

export function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="card max-w-lg p-8">
        <Logo href="/" />
        <h1 className="mt-6 text-2xl font-extrabold">Connect Supabase to open the app</h1>
        <p className="mt-3">
          The LinguaDub application needs a Supabase project. Set these server environment variables, run the database migration and restart:
        </p>
        <ul className="mt-4 space-y-1 rounded-xl bg-canvas p-4 font-mono text-sm text-navy">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
        <p className="mt-4 text-sm text-muted">See README.md for the full setup and deployment guide.</p>
      </div>
    </div>
  );
}
