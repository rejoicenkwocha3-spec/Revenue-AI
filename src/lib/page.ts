import "server-only";
import { cache } from "react";
import { requireAppContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { loadOrgData } from "@/lib/revenue/load";
import { assessAll } from "@/lib/revenue/dealHealth";
import { parsePeriod } from "@/lib/revenue/periods";

/** Loads the signed in user's context and their organisation's records (RLS applies) once per request. */
export const pageData = cache(async () => {
  const ctx = await requireAppContext();
  const supabase = await createClient();
  const data = await loadOrgData(supabase, ctx.orgId);
  const health = assessAll(data);
  return { ctx, supabase, data, health };
});

export function periodFromParams(sp: Record<string, string | string[] | undefined>, fiscal: number, now: Date, fallback: "month" | "quarter" | "year" = "quarter") {
  const t = typeof sp.period === "string" ? sp.period : fallback;
  const s = typeof sp.start === "string" ? sp.start : null;
  return parsePeriod(t, s, fiscal, now);
}
