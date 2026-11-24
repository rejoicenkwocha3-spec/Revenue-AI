"use client";
import { createBrowserClient } from "@supabase/ssr";
import { DB_SCHEMA } from "@/config/db";

let client: ReturnType<typeof build> | null = null;

function build(url: string, key: string) {
  return createBrowserClient(url, key, { db: { schema: DB_SCHEMA } });
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  if (!client) client = build(url, key);
  return client;
}

export function supabaseReady(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
