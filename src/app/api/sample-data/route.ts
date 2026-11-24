import { handle, json, requireUser, ApiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { isoDate, periodFor } from "@/lib/revenue/periods";

const SRC = "example";
const day = 86400000;
const ago = (n: number) => new Date(Date.now() - n * day).toISOString();
const ahead = (n: number) => isoDate(new Date(Date.now() + n * day));

/**
 * Loads clearly labelled example records (every name ends with "(Example)") so a new workspace can explore
 * the product. They are stored like any other record and can be removed in one step.
 */
export const POST = handle(async () => {
  const ctx = await requireUser("deal.manage_any");
  const admin = createAdminClient();
  const { count } = await admin.from("accounts").select("id", { count: "exact", head: true }).eq("org_id", ctx.orgId).eq("external_source", SRC);
  if (count) throw new ApiError(409, "Example data is already loaded.");
  const { data: stages } = await admin.from("pipeline_stages").select("id, name, position, kind").eq("org_id", ctx.orgId).order("position");
  if (!stages?.length) throw new ApiError(400, "Configure pipeline stages first.");
  const open = stages.filter((s) => s.kind === "open");
  const won = stages.find((s) => s.kind === "won")!;
  const lost = stages.find((s) => s.kind === "lost")!;
  const { data: members } = await admin.from("organisation_members").select("user_id").eq("org_id", ctx.orgId);
  const owners = (members ?? []).map((m) => m.user_id);
  const owner = (i: number) => owners[i % owners.length];

  const accountSeed = [
    ["Northwind Logistics", "Logistics", "EMEA", 1200], ["Bluepeak Health", "Healthcare", "North America", 3400], ["Kestrel Finance", "Financial Services", "North America", 860],
    ["Lumen Retail Group", "Retail", "EMEA", 5200], ["Orbit Telecom", "Telecommunications", "APAC", 2700], ["Harbor Analytics", "Software", "North America", 240],
    ["Sable Energy", "Energy", "APAC", 1900], ["Cedar Education", "Education", "EMEA", 610], ["Vantage Manufacturing", "Manufacturing", "North America", 4100], ["Pioneer Insurance", "Insurance", "APAC", 1500],
  ] as const;
  const { data: accounts, error: aErr } = await admin.from("accounts").insert(accountSeed.map(([name, industry, region, emp], i) => ({
    org_id: ctx.orgId, name: `${name} (Example)`, industry, region, employee_count: emp, owner_id: owner(i), lifecycle_stage: i < 5 ? "customer" : "prospect", priority: i % 3 === 0 ? "high" : "medium", external_source: SRC, external_id: `acct-${i}`, created_by: ctx.userId,
  }))).select("id, name, region, owner_id");
  if (aErr) throw new ApiError(500, aErr.message);

  const people = [["Amara", "Okafor", "VP Sales", "decision_maker"], ["Daniel", "Reyes", "Head of Operations", "champion"], ["Priya", "Nair", "CFO", "economic_buyer"], ["Tom", "Becker", "IT Director", "technical_evaluator"]] as const;
  const contactRows = accounts!.flatMap((a, i) => people.slice(0, 2 + (i % 3)).map(([f, l, title, role], j) => ({
    org_id: ctx.orgId, account_id: a.id, first_name: f, last_name: `${l} (Example)`, email: `${f.toLowerCase()}.${l.toLowerCase()}@example.com`, title, buying_role: role, owner_id: a.owner_id, external_source: SRC, external_id: `c-${i}-${j}`,
  })));
  const { data: contacts } = await admin.from("contacts").insert(contactRows).select("id, account_id");

  const products = ["Platform", "Analytics Add on", "Enterprise Suite"];
  type Seed = { acct: number; name: string; amount: number; stage: "open" | "won" | "lost"; pos?: number; close: number; created: number; inStage: number; category?: string; type?: string; competitor?: string; lastAct?: number | null };
  const seeds: Seed[] = [
    { acct: 0, name: "Fleet visibility rollout", amount: 84000, stage: "open", pos: 4, close: 18, created: 70, inStage: 9, category: "commit", lastAct: 2 },
    { acct: 1, name: "Clinical operations expansion", amount: 126000, stage: "open", pos: 5, close: 12, created: 95, inStage: 6, category: "commit", type: "expansion", lastAct: 1 },
    { acct: 2, name: "Risk reporting platform", amount: 58000, stage: "open", pos: 3, close: 40, created: 45, inStage: 33, category: "best_case", competitor: "Insightly", lastAct: 26 },
    { acct: 3, name: "Store performance analytics", amount: 210000, stage: "open", pos: 4, close: -6, created: 120, inStage: 41, category: "commit", lastAct: 34 },
    { acct: 4, name: "Network revenue assurance", amount: 92000, stage: "open", pos: 2, close: 55, created: 20, inStage: 8, category: "pipeline", lastAct: 4 },
    { acct: 5, name: "Self serve analytics pilot", amount: 18000, stage: "open", pos: 1, close: 30, created: 10, inStage: 10, category: "pipeline", lastAct: null },
    { acct: 6, name: "Asset forecasting program", amount: 145000, stage: "open", pos: 3, close: 48, created: 60, inStage: 12, category: "best_case", competitor: "Northstar BI", lastAct: 6 },
    { acct: 7, name: "Admissions pipeline tracking", amount: 36000, stage: "open", pos: 2, close: 25, created: 28, inStage: 20, category: "pipeline", lastAct: 17 },
    { acct: 8, name: "Plant productivity suite", amount: 178000, stage: "open", pos: 5, close: 21, created: 110, inStage: 15, category: "commit", lastAct: 3 },
    { acct: 9, name: "Claims insight workspace", amount: 67000, stage: "open", pos: 1, close: 70, created: 6, inStage: 6, category: "pipeline", lastAct: 2 },
    { acct: 0, name: "Driver app add on", amount: 24000, stage: "open", pos: 3, close: 35, created: 30, inStage: 14, category: "best_case", type: "expansion", lastAct: 9 },
    { acct: 1, name: "Initial platform subscription", amount: 96000, stage: "won", close: -200, created: 290, inStage: 0 },
    { acct: 0, name: "Logistics platform subscription", amount: 72000, stage: "won", close: -150, created: 230, inStage: 0 },
    { acct: 2, name: "Finance team licences", amount: 41000, stage: "won", close: -110, created: 170, inStage: 0 },
    { acct: 3, name: "Retail analytics foundation", amount: 118000, stage: "won", close: -75, created: 160, inStage: 0 },
    { acct: 4, name: "Telecom revenue suite", amount: 88000, stage: "won", close: -40, created: 120, inStage: 0 },
    { acct: 1, name: "Analytics add on", amount: 32000, stage: "won", close: -18, created: 60, inStage: 0, type: "expansion" },
    { acct: 3, name: "Regional rollout phase 2", amount: 54000, stage: "won", close: -8, created: 50, inStage: 0, type: "expansion" },
    { acct: 6, name: "Energy pilot", amount: 30000, stage: "lost", close: -95, created: 150, inStage: 0, competitor: "Northstar BI" },
    { acct: 8, name: "Quality dashboards", amount: 45000, stage: "lost", close: -30, created: 90, inStage: 0 },
    { acct: 9, name: "Broker portal analytics", amount: 26000, stage: "lost", close: -12, created: 70, inStage: 0 },
  ];
  const oppRows = seeds.map((s, i) => {
    const stage = s.stage === "won" ? won : s.stage === "lost" ? lost : open.find((x) => x.position === s.pos) ?? open[0];
    return {
      org_id: ctx.orgId, name: `${s.name} (Example)`, account_id: accounts![s.acct].id, owner_id: owner(i), stage_id: stage.id, amount: s.amount, close_date: ahead(s.close),
      forecast_category: s.category ?? "pipeline", deal_type: s.type ?? "new_business", product: products[i % 3], region: accounts![s.acct].region, competitors: s.competitor ? [s.competitor] : [],
      next_step: s.stage === "open" && i % 4 !== 3 ? "Review proposal with buying committee" : null, next_step_date: s.stage === "open" && i % 4 !== 3 ? ahead(i % 2 ? 5 : -3) : null,
      closed_at: s.stage === "open" ? null : ago(-s.close), loss_reason: s.stage === "lost" ? "Chose competitor" : null, lead_source: ["Inbound", "Outbound", "Partner", "Event"][i % 4],
      external_source: SRC, external_id: `o-${i}`, created_by: ctx.userId,
    };
  });
  const { data: opps, error: oErr } = await admin.from("opportunities").insert(oppRows).select("id, external_id");
  if (oErr) throw new ApiError(500, oErr.message);
  const oppId = (i: number) => opps!.find((o) => o.external_id === `o-${i}`)!.id;
  await Promise.all(seeds.map((s, i) => admin.from("opportunities").update({ created_at: ago(s.created), stage_entered_at: ago(s.stage === "open" ? s.inStage : -s.close) }).eq("id", oppId(i))));
  if (seeds.some((s, i) => i === 3)) {
    await admin.from("opportunity_history").insert([
      { org_id: ctx.orgId, opportunity_id: oppId(3), field: "close_date", old_value: ahead(-40), new_value: ahead(-20), created_at: ago(30) },
      { org_id: ctx.orgId, opportunity_id: oppId(3), field: "close_date", old_value: ahead(-20), new_value: ahead(-6), created_at: ago(12) },
    ]);
  }

  // Stakeholders
  const links: { org_id: string; opportunity_id: string; contact_id: string; role: string | null }[] = [];
  seeds.forEach((s, i) => {
    const cs = (contacts ?? []).filter((c) => c.account_id === accounts![s.acct].id);
    const n = i === 2 || i === 3 ? 1 : i === 5 ? 0 : Math.min(cs.length, 3);
    cs.slice(0, n).forEach((c) => links.push({ org_id: ctx.orgId, opportunity_id: oppId(i), contact_id: c.id, role: null }));
  });
  if (links.length) await admin.from("opportunity_contacts").insert(links);

  // Activities
  const acts: Record<string, unknown>[] = [];
  seeds.forEach((s, i) => {
    if (s.stage !== "open" || s.lastAct == null) return;
    const cs = (contacts ?? []).filter((c) => c.account_id === accounts![s.acct].id);
    const base = { org_id: ctx.orgId, opportunity_id: oppId(i), account_id: accounts![s.acct].id, contact_id: cs[0]?.id ?? null, user_id: owner(i), external_source: SRC };
    acts.push({ ...base, type: "call", subject: "Discovery call (Example)", outcome: "positive", occurred_at: ago(s.lastAct + 14), external_id: `a-${i}-1`, budget_discussed: (s.pos ?? 0) >= 3 && i !== 3 });
    acts.push({ ...base, type: i % 2 ? "email" : "meeting", subject: i === 3 ? "Pricing review (Example)" : "Follow up on requirements (Example)", outcome: i === 3 || i === 2 ? "negative" : "neutral", objection: i === 3 ? "Budget frozen until next fiscal year" : null, competitor_mentioned: s.competitor ?? null, occurred_at: ago(s.lastAct), external_id: `a-${i}-2` });
  });
  if (acts.length) await admin.from("sales_activities").insert(acts);

  // Customer revenue events, renewals, meetings, tasks, target
  await admin.from("revenue_transactions").insert([
    { org_id: ctx.orgId, account_id: accounts![4].id, owner_id: owner(4), type: "contraction", amount: 12000, occurred_on: ahead(-20), notes: "Seat reduction (Example)", created_by: ctx.userId },
  ]);
  await admin.from("renewals").insert(accounts!.slice(0, 5).map((a, i) => ({ org_id: ctx.orgId, account_id: a.id, owner_id: a.owner_id, renewal_date: ahead([25, 64, 120, 40, 15][i]), current_arr: [96000, 72000, 41000, 118000, 88000][(i + 1) % 5], status: "upcoming" })));
  await admin.from("meetings").insert(seeds.slice(0, 6).map((s, i) => ({ org_id: ctx.orgId, title: `Stakeholder review (Example)`, starts_at: new Date(Date.now() + (i - 2) * 2 * day).toISOString(), opportunity_id: oppId(i), account_id: accounts![s.acct].id, organiser_id: owner(i), status: i < 2 ? "completed" : "scheduled", outcome: i === 0 ? "positive" : null, external_source: SRC, external_id: `m-${i}` })));
  await admin.from("tasks").insert([
    { org_id: ctx.orgId, title: "Send revised proposal (Example)", due_date: ahead(-1), priority: "high", assignee_id: owner(0), opportunity_id: oppId(0), created_by: ctx.userId },
    { org_id: ctx.orgId, title: "Confirm legal review timeline (Example)", due_date: ahead(2), priority: "medium", assignee_id: owner(1), opportunity_id: oppId(1), created_by: ctx.userId },
    { org_id: ctx.orgId, title: "Prepare renewal plan (Example)", due_date: ahead(5), kind: "renewal_reminder", priority: "medium", assignee_id: owner(4), account_id: accounts![4].id, created_by: ctx.userId },
  ]);
  const q = periodFor("quarter", new Date());
  const { data: hasTarget } = await admin.from("revenue_targets").select("id").eq("org_id", ctx.orgId).eq("scope", "organisation").eq("period_start", isoDate(q.start)).maybeSingle();
  if (!hasTarget) await admin.from("revenue_targets").insert({ org_id: ctx.orgId, scope: "organisation", period_type: "quarter", period_start: isoDate(q.start), period_end: isoDate(q.end), amount: 450000, created_by: ctx.userId });
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "example_data.loaded" });
  return json({ ok: true }, 201);
});

export const DELETE = handle(async () => {
  const ctx = await requireUser("deal.manage_any");
  const admin = createAdminClient();
  const { data: accts } = await admin.from("accounts").select("id").eq("org_id", ctx.orgId).eq("external_source", SRC);
  const ids = (accts ?? []).map((a) => a.id);
  if (ids.length) {
    await admin.from("revenue_transactions").delete().eq("org_id", ctx.orgId).in("account_id", ids);
    await admin.from("tasks").delete().eq("org_id", ctx.orgId).like("title", "%(Example)");
  }
  await admin.from("opportunities").delete().eq("org_id", ctx.orgId).eq("external_source", SRC);
  await admin.from("sales_activities").delete().eq("org_id", ctx.orgId).eq("external_source", SRC);
  await admin.from("meetings").delete().eq("org_id", ctx.orgId).eq("external_source", SRC);
  await admin.from("contacts").delete().eq("org_id", ctx.orgId).eq("external_source", SRC);
  if (ids.length) await admin.from("accounts").delete().in("id", ids);
  await audit({ orgId: ctx.orgId, userId: ctx.userId, action: "example_data.removed" });
  return json({ ok: true });
});
