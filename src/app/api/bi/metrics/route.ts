import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/tokens";
import { loadOrgData } from "@/lib/revenue/load";
import { assessAll } from "@/lib/revenue/dealHealth";
import { summarize, funnel, byDimension, monthlySeries, repPerformance } from "@/lib/revenue/metrics";
import { computeForecast } from "@/lib/revenue/forecast";
import { parsePeriod } from "@/lib/revenue/periods";

/** Read only metrics for BI tools: GET with `Authorization: Bearer rai_...`. Optional ?period=month|quarter|year&start=YYYY-MM-DD */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").replace(/^rai_/, "");
  if (!token) return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  const admin = createAdminClient();
  const { data: org } = await admin.from("organisations").select("id, name").eq("api_token_hash", hashToken(token)).maybeSingle();
  if (!org) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  const data = await loadOrgData(admin, org.id);
  const url = new URL(req.url);
  const period = parsePeriod(url.searchParams.get("period"), url.searchParams.get("start"), data.fiscalStartMonth, data.now);
  const health = assessAll(data);
  const f = computeForecast(data, period, health);
  return NextResponse.json({
    organisation: org.name,
    currency: data.currency,
    period: { label: period.label, start: period.start.toISOString().slice(0, 10), end: period.end.toISOString().slice(0, 10) },
    actual: summarize(data, period, new Set([...health.values()].filter((h) => h.health === "at_risk").map((h) => h.opportunityId))),
    forecast: { type: "projection", closedWon: f.closedWon, commit: f.commit, bestCase: f.bestCase, pipeline: f.pipeline, worstCase: f.worstCase, expectedCase: f.expectedCase, bestCaseTotal: f.bestCaseTotal, confidence: f.confidence, assumptions: f.assumptions },
    pipelineByStage: funnel(data),
    revenueByRegion: byDimension(data, period, "region"),
    revenueByProduct: byDimension(data, period, "product"),
    revenueByRepresentative: byDimension(data, period, "owner"),
    monthly: monthlySeries(data, 12, 3),
    representatives: repPerformance(data, period),
  });
}
