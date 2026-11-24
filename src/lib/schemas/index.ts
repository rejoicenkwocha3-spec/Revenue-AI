import { z } from "zod";

const uuid = z.string().uuid();
const optUuid = uuid.nullable().optional().or(z.literal("").transform(() => null));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format");
const optDate = date.nullable().optional().or(z.literal("").transform(() => null));
const optText = (max: number) => z.string().trim().max(max).nullable().optional();

export const opportunitySchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(200),
  account_id: optUuid,
  owner_id: optUuid,
  stage_id: uuid,
  amount: z.coerce.number().min(0, "Amount cannot be negative").max(1e12),
  probability: z.coerce.number().int().min(0).max(100).nullable().optional(),
  close_date: optDate,
  forecast_category: z.enum(["pipeline", "best_case", "commit", "closed", "omitted"]).optional(),
  deal_type: z.enum(["new_business", "expansion", "renewal"]).optional(),
  product: optText(120),
  region: optText(120),
  lead_source: optText(120),
  next_step: optText(500),
  next_step_date: optDate,
  description: optText(5000),
  competitors: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  loss_reason: optText(500),
});

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(200),
  domain: optText(200),
  industry: optText(120),
  employee_count: z.coerce.number().int().min(0).nullable().optional(),
  annual_revenue: z.coerce.number().min(0).nullable().optional(),
  region: optText(120),
  territory_id: optUuid,
  owner_id: optUuid,
  lifecycle_stage: z.enum(["prospect", "customer", "churned", "partner"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  notes: optText(5000),
});

export const contactSchema = z.object({
  first_name: z.string().trim().min(1, "Enter a first name").max(100),
  last_name: optText(100),
  email: z.string().trim().email("Enter a valid email").nullable().optional().or(z.literal("").transform(() => null)),
  phone: optText(60),
  title: optText(120),
  account_id: optUuid,
  buying_role: z.enum(["decision_maker", "champion", "economic_buyer", "influencer", "technical_evaluator", "user", "blocker"]).nullable().optional().or(z.literal("").transform(() => null)),
  status: z.enum(["active", "prospect", "inactive"]).optional(),
  owner_id: optUuid,
});

export const activitySchema = z.object({
  type: z.enum(["call", "email", "meeting", "note", "demo", "proposal"]),
  subject: z.string().trim().min(1, "Enter a subject").max(300),
  notes: optText(10000),
  opportunity_id: optUuid,
  account_id: optUuid,
  contact_id: optUuid,
  outcome: z.enum(["positive", "neutral", "negative"]).nullable().optional().or(z.literal("").transform(() => null)),
  competitor_mentioned: optText(120),
  objection: optText(500),
  budget_discussed: z.boolean().optional(),
  occurred_at: z.string().datetime({ offset: true }).optional().or(date.transform((d) => `${d}T12:00:00Z`)),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(300),
  description: optText(5000),
  due_date: optDate,
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["open", "done", "cancelled"]).optional(),
  kind: z.enum(["task", "follow_up", "renewal_reminder", "call", "email"]).optional(),
  assignee_id: optUuid,
  opportunity_id: optUuid,
  account_id: optUuid,
  contact_id: optUuid,
});

export const meetingSchema = z.object({
  title: z.string().trim().min(1).max(300),
  starts_at: z.string().min(10),
  ends_at: z.string().nullable().optional(),
  opportunity_id: optUuid,
  account_id: optUuid,
  attendees: z.array(z.string().trim().max(200)).max(50).optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
  outcome: z.enum(["positive", "neutral", "negative"]).nullable().optional().or(z.literal("").transform(() => null)),
  summary: optText(10000),
});

export const renewalSchema = z.object({
  account_id: uuid,
  owner_id: optUuid,
  renewal_date: date,
  current_arr: z.coerce.number().min(0),
  expected_arr: z.coerce.number().min(0).nullable().optional(),
  status: z.enum(["upcoming", "in_progress", "renewed", "churned"]).optional(),
  notes: optText(5000),
  reminder_days: z.coerce.number().int().min(1).max(365).optional(),
});

export const transactionSchema = z.object({
  account_id: optUuid,
  owner_id: optUuid,
  type: z.enum(["new", "expansion", "renewal", "contraction", "churn", "one_time"]),
  amount: z.coerce.number().positive(),
  recurring: z.boolean().optional(),
  product: optText(120),
  region: optText(120),
  occurred_on: date,
  notes: optText(1000),
});

export const targetSchema = z.object({
  scope: z.enum(["organisation", "team", "user"]),
  team_id: optUuid,
  user_id: optUuid,
  period_type: z.enum(["month", "quarter", "year"]),
  period_start: date,
  amount: z.coerce.number().min(0),
});

export const templateSchema = z.object({ name: z.string().trim().min(1).max(120), subject: z.string().trim().min(1).max(300), body: z.string().trim().min(1).max(10000), category: z.string().trim().max(60).optional() });
