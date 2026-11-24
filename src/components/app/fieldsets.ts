import type { FieldDef } from "./forms";

export type Opt = { value: string; label: string };
export const CATEGORY_OPTS: Opt[] = [{ value: "pipeline", label: "Pipeline" }, { value: "best_case", label: "Best case" }, { value: "commit", label: "Commit" }, { value: "omitted", label: "Omitted" }];
export const DEAL_TYPE_OPTS: Opt[] = [{ value: "new_business", label: "New business" }, { value: "expansion", label: "Expansion" }, { value: "renewal", label: "Renewal" }];
export const BUYING_ROLE_OPTS: Opt[] = ["decision_maker", "champion", "economic_buyer", "influencer", "technical_evaluator", "user", "blocker"].map((v) => ({ value: v, label: v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) }));

export function opportunityFields(o: { stages: Opt[]; accounts: Opt[]; members: Opt[]; canAssign: boolean }): FieldDef[] {
  return [
    { name: "name", label: "Opportunity name", required: true, placeholder: "Annual platform subscription" },
    { name: "account_id", label: "Account", type: "select", options: o.accounts, half: true },
    ...(o.canAssign ? [{ name: "owner_id", label: "Owner", type: "select" as const, options: o.members, half: true }] : []),
    { name: "stage_id", label: "Stage", type: "select", options: o.stages, required: true, half: true },
    { name: "amount", label: "Deal value", type: "number", required: true, min: 0, half: true },
    { name: "close_date", label: "Expected close date", type: "date", half: true },
    { name: "probability", label: "Probability %", type: "number", min: 0, max: 100, half: true, hint: "Leave blank to use the stage default" },
    { name: "forecast_category", label: "Forecast category", type: "select", options: CATEGORY_OPTS, required: true, half: true },
    { name: "deal_type", label: "Deal type", type: "select", options: DEAL_TYPE_OPTS, required: true, half: true },
    { name: "product", label: "Product", half: true },
    { name: "region", label: "Region", half: true },
    { name: "next_step", label: "Next step", placeholder: "Pricing review with the CFO" },
    { name: "next_step_date", label: "Next step date", type: "date", half: true },
    { name: "lead_source", label: "Lead source", half: true },
    { name: "competitors", label: "Competitors", type: "tags", hint: "Separate with commas" },
    { name: "description", label: "Description", type: "textarea" },
  ];
}

export function accountFields(o: { members: Opt[]; territories: Opt[] }): FieldDef[] {
  return [
    { name: "name", label: "Account name", required: true },
    { name: "domain", label: "Website domain", placeholder: "example.com", half: true, hint: "Used to match calendar meetings" },
    { name: "industry", label: "Industry", half: true },
    { name: "employee_count", label: "Employees", type: "number", min: 0, half: true },
    { name: "region", label: "Region", half: true },
    { name: "territory_id", label: "Territory", type: "select", options: o.territories, half: true },
    { name: "owner_id", label: "Account owner", type: "select", options: o.members, half: true },
    { name: "lifecycle_stage", label: "Lifecycle stage", type: "select", required: true, half: true, options: [{ value: "prospect", label: "Prospect" }, { value: "customer", label: "Customer" }, { value: "churned", label: "Churned" }, { value: "partner", label: "Partner" }] },
    { name: "priority", label: "Priority", type: "select", required: true, half: true, options: [{ value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "low", label: "Low" }] },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}

export function contactFields(o: { accounts: Opt[] }): FieldDef[] {
  return [
    { name: "first_name", label: "First name", required: true, half: true },
    { name: "last_name", label: "Last name", half: true },
    { name: "email", label: "Email", type: "email", half: true },
    { name: "phone", label: "Phone", half: true },
    { name: "title", label: "Job title", half: true },
    { name: "account_id", label: "Account", type: "select", options: o.accounts, half: true },
    { name: "buying_role", label: "Buying role", type: "select", options: BUYING_ROLE_OPTS, half: true },
  ];
}

export function activityFields(o: { opportunities: Opt[]; accounts: Opt[]; contacts: Opt[] }): FieldDef[] {
  return [
    { name: "type", label: "Type", type: "select", required: true, half: true, options: ["call", "email", "meeting", "demo", "proposal", "note"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
    { name: "occurred_at", label: "Date", type: "date", half: true },
    { name: "subject", label: "Subject", required: true },
    { name: "opportunity_id", label: "Opportunity", type: "select", options: o.opportunities, half: true },
    { name: "account_id", label: "Account", type: "select", options: o.accounts, half: true },
    { name: "contact_id", label: "Contact", type: "select", options: o.contacts, half: true },
    { name: "outcome", label: "Outcome", type: "select", half: true, options: [{ value: "positive", label: "Positive" }, { value: "neutral", label: "Neutral" }, { value: "negative", label: "Negative" }] },
    { name: "objection", label: "Customer objection raised", half: true },
    { name: "competitor_mentioned", label: "Competitor mentioned", half: true },
    { name: "budget_discussed", label: "Budget was discussed", type: "checkbox" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}

export function taskFields(o: { members: Opt[]; opportunities: Opt[]; accounts: Opt[] }): FieldDef[] {
  return [
    { name: "title", label: "Task", required: true },
    { name: "due_date", label: "Due date", type: "date", half: true },
    { name: "priority", label: "Priority", type: "select", required: true, half: true, options: [{ value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "low", label: "Low" }] },
    { name: "kind", label: "Type", type: "select", required: true, half: true, options: [{ value: "task", label: "Task" }, { value: "follow_up", label: "Follow up" }, { value: "call", label: "Call" }, { value: "email", label: "Email" }, { value: "renewal_reminder", label: "Renewal reminder" }] },
    { name: "assignee_id", label: "Assignee", type: "select", options: o.members, half: true },
    { name: "opportunity_id", label: "Opportunity", type: "select", options: o.opportunities, half: true },
    { name: "account_id", label: "Account", type: "select", options: o.accounts, half: true },
    { name: "description", label: "Details", type: "textarea" },
  ];
}
