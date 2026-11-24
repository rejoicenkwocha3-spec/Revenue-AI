import { NextResponse } from "next/server";
import { capabilities } from "@/lib/providers";

/** Deployment check. Reports which settings are present, never their values. */
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  const caps = capabilities();
  const required = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET", "SELAR_WEBHOOK_SECRET"];
  const missing = required.filter((k) => !has(k));
  return NextResponse.json({
    ready: missing.length === 0,
    missing,
    providers: { speechToText: caps.stt?.name ?? null, translation: caps.translation?.name ?? null, voices: caps.tts?.name ?? null, voiceCloning: caps.cloning?.name ?? null },
    note: caps.stt && caps.translation && caps.tts ? "AI pipeline configured" : "Add ELEVENLABS_API_KEY (or OpenAI and DeepL keys) to enable dubbing",
  });
}
