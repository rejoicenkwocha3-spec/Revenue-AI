import { handle, json, parseBody, requireUser, ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { targetSchema } from "@/lib/schemas";
import { dbError } from "@/lib/crud";
import { audit } from "@/lib/audit";
import { periodFor, isoDate } from "@/lib/revenue/periods";

/** Creates or replaces a target for one period and scope. Period boundaries follow the fiscal calendar. */
export const POST = handle(async (req: Request) => {
  const ctx = await requireUser("target.manage");
  const b = await parseBody(req, targetSchema);
  if (b.scope === "user" && !b.user_id) throw new ApiError(400, "Choose a team member.");
  if (b.scope === "team" && !b.team_id) throw new ApiError(400, "Choose a team.");
  const supabase = await createClient();
  const { data: org } = await supabase.from("organisations").select("fiscal_year_start_month").eq("id", ctx.orgId).single();
  const p = periodFor(b.period_type, new Date(`${b.period_start}T12:00:00Z`), org?.fiscal_year_start_month ?? 1);
  let del = supabase.from("revenue_targets").delete().eq("org_id", ctx.orgId).eq("scope", b.scope).eq("period_start", isoDate(p.start)).eq("period_end", isoDate(p.end));
  if (b.scope === "user") del = del.eq("user_id", b.user_id!);
  if (b.scope === "team") del = del.eq("team_id", b.team_id!);
  await del;
  const { data, error } = await supabase.from("revenue_targets").insert({
    org_id: ctx.orgId, scope: b.scope, user_id: b.scope === "user" ? b.user_id : null, team_id: b.scope === "team" ? b.team_id : null,
    period_type: b.period_type, period_start: isoDate(p.start), period_end: isoDate(p.end), amount: b.amount, created_by: ctx.userId,
  }).select("*").single();
  dbError(error, "target");
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "target.set", entityType: "revenue_targets", entityId: data.id, details: { scope: b.scope, period: p.label, amount: b.amount } });
  return json(data, 201);
});
