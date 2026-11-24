export interface Stage { id: string; name: string; position: number; probability: number; kind: "open" | "won" | "lost"; expected_days: number }
export interface Member { user_id: string; role: string; team_id: string | null; territory_id: string | null; full_name: string; email: string }
export interface Opportunity {
  id: string; name: string; account_id: string | null; owner_id: string | null; stage_id: string | null; amount: number; probability: number | null;
  close_date: string | null; forecast_category: "pipeline" | "best_case" | "commit" | "closed" | "omitted"; deal_type: string; product: string | null;
  region: string | null; lead_source: string | null; next_step: string | null; next_step_date: string | null; description: string | null; competitors: string[];
  status: "open" | "won" | "lost"; loss_reason: string | null; stage_entered_at: string; closed_at: string | null; last_activity_at: string | null;
  created_at: string; updated_at: string;
}
export interface Account { id: string; name: string; industry: string | null; region: string | null; owner_id: string | null; lifecycle_stage: string; priority: string; employee_count: number | null; created_at: string }
export interface Contact { id: string; account_id: string | null; first_name: string; last_name: string | null; email: string | null; title: string | null; buying_role: string | null; last_contacted_at: string | null }
export interface OppContact { opportunity_id: string; contact_id: string; role: string | null }
export interface Activity {
  id: string; type: string; subject: string; notes: string | null; opportunity_id: string | null; account_id: string | null; contact_id: string | null; user_id: string | null;
  outcome: "positive" | "neutral" | "negative" | null; competitor_mentioned: string | null; objection: string | null; budget_discussed: boolean; occurred_at: string;
}
export interface Meeting { id: string; title: string; starts_at: string; opportunity_id: string | null; account_id: string | null; organiser_id: string | null; status: string; outcome: string | null }
export interface Transaction { id: string; account_id: string | null; opportunity_id: string | null; owner_id: string | null; type: string; amount: number; recurring: boolean; product: string | null; region: string | null; occurred_on: string }
export interface Target { id: string; scope: string; team_id: string | null; user_id: string | null; period_type: string; period_start: string; period_end: string; amount: number }
export interface Task { id: string; title: string; due_date: string | null; status: string; priority: string; kind: string; assignee_id: string | null; opportunity_id: string | null; account_id: string | null; created_at: string }
export interface Renewal { id: string; account_id: string; owner_id: string | null; renewal_date: string; current_arr: number; expected_arr: number | null; status: string }

export interface HistoryRow { opportunity_id: string; field: string; old_value: string | null; new_value: string | null; created_at: string }

export interface OrgData {
  orgId: string;
  fiscalStartMonth: number;
  currency: string;
  stages: Stage[];
  members: Member[];
  opportunities: Opportunity[];
  accounts: Account[];
  contacts: Contact[];
  oppContacts: OppContact[];
  activities: Activity[];
  meetings: Meeting[];
  transactions: Transaction[];
  targets: Target[];
  tasks: Task[];
  renewals: Renewal[];
  history: HistoryRow[];
  now: Date;
}

/** A fact the analysis is based on, shown to users next to every recommendation. */
export interface Evidence { label: string; value: string; href?: string }
