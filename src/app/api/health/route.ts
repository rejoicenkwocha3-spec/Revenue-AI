import { NextResponse } from "next/server";
import { PROVIDERS, providerConfigured } from "@/lib/integrations/providers";

/** Deployment check. Reports which settings are present, never their values. */
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  const required = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET", "SELAR_WEBHOOK_SECRET", "INTEGRATION_ENCRYPTION_KEY"];
  const missing = required.filter((k) => !has(k));
  return NextResponse.json({
    ready: missing.length === 0,
    missing,
    ai: has("ANTHROPIC_API_KEY") ? "configured" : "not configured: assistant answers from rules only and agents skip AI summaries",
    integrations: Object.fromEntries(PROVIDERS.map((p) => [p.key, providerConfigured(p.key) ? "configured" : "not configured"])),
  });
}
