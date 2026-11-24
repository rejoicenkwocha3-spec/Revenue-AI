import { z } from "zod";
import { handle, json, parseBody, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { dbError } from "@/lib/crud";
import { audit } from "@/lib/audit";
import { loadOrgData } from "@/lib/revenue/load";
import { assessAll } from "@/lib/revenue/dealHealth";
import { computeForecast } from "@/lib/revenue/forecast";
import { parsePeriod, isoDate } from "@/lib/revenue/periods";

const schema = z.object({
  period_type: z.enum(["month", "quarter", "year"]),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  submitted_amount: z.coerce.number().min(0).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  submit: z.boolean().optional(),
});

/**
 * Saves a forecast for a period and records a snapshot of the computed numbers at this moment.
 * Snapshots power forecast change review and historical accuracy.
 */
export const POST = handle(async (req: Request) => {
  const ctx = await requireUser("forecast.manage");
  const b = await parseBody(req, schema);
  const supabase = await createClient();
  const data = await loadOrgData(supabase, ctx.orgId);
  const period = parsePeriod(b.period_type, b.period_start, data.fiscalStartMonth, data.now);
  const f = computeForecast(data, period, assessAll(data));
  const start = isoDate(period.start);
  const end = isoDate(period.end);
  const { data: existing } = await supabase.from("forecasts").select("id").eq("org_id", ctx.orgId).eq("period_start", start).eq("period_end", end).is("team_id", null).maybeSingle();
  const row = { org_id: ctx.orgId, name: `${period.label} forecast`, period_type: period.type, period_start: start, period_end: end, owner_id: ctx.userId, submitted_amount: b.submitted_amount ?? null, best_case: f.bestCaseTotal, expected_case: f.expectedCase, worst_case: f.worstCase, notes: b.notes ?? null, status: b.submit ? "submitted" : "draft", created_by: ctx.userId };
  const { data: saved, error } = existing
    ? await supabase.from("forecasts").update(row).eq("id", existing.id).select("id").single()
    : await supabase.from("forecasts").insert(row).select("id").single();
  dbError(error, "forecast");
  const { error: sErr } = await supabase.from("forecast_snapshots").insert({
    org_id: ctx.orgId, forecast_id: saved!.id, period_start: start, period_end: end, closed_won: f.closedWon, commit_amount: f.commit, best_case_amount: f.bestCase,
    pipeline_amount: f.pipeline, weighted_pipeline: f.weightedPipeline, expected_case: f.expectedCase, best_case: f.bestCaseTotal, worst_case: f.worstCase,
    submitted_amount: b.submitted_amount ?? null, assumptions: f.assumptions, taken_by: ctx.userId,
  });
  dbError(sErr, "forecast snapshot");
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: b.submit ? "forecast.submitted" : "forecast.saved", entityType: "forecasts", entityId: saved!.id, details: { period: period.label, expected: Math.round(f.expectedCase), submitted: b.submitted_amount ?? null } });
  return json({ ok: true, id: saved!.id }, 201);
});
