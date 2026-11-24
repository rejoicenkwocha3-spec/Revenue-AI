-- Revenue AI database schema
-- Run in the Supabase SQL editor or with `supabase db push`. Safe to run again.
-- Everything lives in the `revenue_ai` schema so the project can be shared with other apps.
-- After running, add `revenue_ai` to Project Settings > API > Exposed schemas.

create extension if not exists "pgcrypto";

create schema if not exists revenue_ai;
grant usage on schema revenue_ai to authenticated, service_role;
alter default privileges in schema revenue_ai grant all on tables to authenticated, service_role;
alter default privileges in schema revenue_ai grant all on sequences to authenticated, service_role;
alter default privileges in schema revenue_ai grant execute on functions to authenticated, service_role;

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type revenue_ai.member_role as enum ('owner','admin','sales_manager','sales_rep','revops','executive','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type revenue_ai.forecast_category as enum ('pipeline','best_case','commit','closed','omitted');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFILES, ORGANISATIONS, MEMBERS, TEAMS, TERRITORIES
-- ============================================================
create table if not exists revenue_ai.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  job_title text,
  avatar_url text,
  default_org_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists revenue_ai.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  owner_id uuid not null references auth.users(id) on delete restrict,
  billing_email text,
  currency text not null default 'USD',
  fiscal_year_start_month int not null default 1 check (fiscal_year_start_month between 1 and 12),
  api_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table revenue_ai.profiles
  drop constraint if exists profiles_default_org_fk,
  add constraint profiles_default_org_fk foreign key (default_org_id) references revenue_ai.organisations(id) on delete set null;

create table if not exists revenue_ai.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  manager_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists teams_org_idx on revenue_ai.teams(org_id);

create table if not exists revenue_ai.territories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  region text,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists territories_org_idx on revenue_ai.territories(org_id);

create table if not exists revenue_ai.organisation_members (
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  user_id uuid not null references revenue_ai.profiles(id) on delete cascade,
  role revenue_ai.member_role not null default 'viewer',
  team_id uuid references revenue_ai.teams(id) on delete set null,
  territory_id uuid references revenue_ai.territories(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists organisation_members_user_idx on revenue_ai.organisation_members(user_id);

create table if not exists revenue_ai.team_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  email text not null,
  role revenue_ai.member_role not null default 'viewer' check (role <> 'owner'),
  team_id uuid references revenue_ai.teams(id) on delete set null,
  token_hash text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists team_invitations_org_idx on revenue_ai.team_invitations(org_id);

-- ============================================================
-- RLS HELPERS (security definer avoids recursive policy checks)
-- ============================================================
create or replace function revenue_ai.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = revenue_ai as $$
  select exists(select 1 from organisation_members where org_id = p_org and user_id = auth.uid());
$$;

create or replace function revenue_ai.has_org_role(p_org uuid, p_roles revenue_ai.member_role[])
returns boolean language sql stable security definer set search_path = revenue_ai as $$
  select exists(select 1 from organisation_members where org_id = p_org and user_id = auth.uid() and role = any(p_roles));
$$;

-- Owners, administrators
create or replace function revenue_ai.can_admin(p_org uuid)
returns boolean language sql stable security definer set search_path = revenue_ai as $$
  select revenue_ai.has_org_role(p_org, array['owner','admin']::revenue_ai.member_role[]);
$$;

-- Anyone who works the CRM: everyone except executives and viewers
create or replace function revenue_ai.can_write_crm(p_org uuid)
returns boolean language sql stable security definer set search_path = revenue_ai as $$
  select revenue_ai.has_org_role(p_org, array['owner','admin','sales_manager','sales_rep','revops']::revenue_ai.member_role[]);
$$;

-- Managers of the revenue process: forecasts, targets, any deal
create or replace function revenue_ai.can_manage_revenue(p_org uuid)
returns boolean language sql stable security definer set search_path = revenue_ai as $$
  select revenue_ai.has_org_role(p_org, array['owner','admin','sales_manager','revops']::revenue_ai.member_role[]);
$$;

-- Comments and collaboration: everyone except viewers
create or replace function revenue_ai.can_collaborate(p_org uuid)
returns boolean language sql stable security definer set search_path = revenue_ai as $$
  select revenue_ai.has_org_role(p_org, array['owner','admin','sales_manager','sales_rep','revops','executive']::revenue_ai.member_role[]);
$$;

-- Sales representatives edit deals they own; managers edit any deal
create or replace function revenue_ai.can_edit_owned(p_org uuid, p_owner uuid)
returns boolean language sql stable security definer set search_path = revenue_ai as $$
  select revenue_ai.can_manage_revenue(p_org)
      or (revenue_ai.has_org_role(p_org, array['sales_rep']::revenue_ai.member_role[]) and (p_owner is null or p_owner = auth.uid()));
$$;

-- ============================================================
-- CRM: ACCOUNTS, CONTACTS, PIPELINE STAGES, OPPORTUNITIES
-- ============================================================
create table if not exists revenue_ai.accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  domain text,
  industry text,
  employee_count int,
  annual_revenue numeric,
  region text,
  territory_id uuid references revenue_ai.territories(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  lifecycle_stage text not null default 'prospect' check (lifecycle_stage in ('prospect','customer','churned','partner')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  notes text,
  external_source text,
  external_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accounts_org_idx on revenue_ai.accounts(org_id, name);
drop index if exists revenue_ai.accounts_external_idx;
create unique index accounts_external_idx on revenue_ai.accounts(org_id, external_source, external_id);

create table if not exists revenue_ai.contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  account_id uuid references revenue_ai.accounts(id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 100),
  last_name text,
  email text,
  phone text,
  title text,
  buying_role text check (buying_role in ('decision_maker','champion','economic_buyer','influencer','technical_evaluator','user','blocker')),
  status text not null default 'active' check (status in ('active','prospect','inactive')),
  owner_id uuid references auth.users(id) on delete set null,
  last_contacted_at timestamptz,
  external_source text,
  external_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_org_idx on revenue_ai.contacts(org_id, last_name);
create index if not exists contacts_account_idx on revenue_ai.contacts(account_id);
drop index if exists revenue_ai.contacts_external_idx;
create unique index contacts_external_idx on revenue_ai.contacts(org_id, external_source, external_id);

create table if not exists revenue_ai.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  position int not null,
  probability int not null default 10 check (probability between 0 and 100),
  kind text not null default 'open' check (kind in ('open','won','lost')),
  expected_days int not null default 14 check (expected_days > 0),
  created_at timestamptz not null default now()
);
create index if not exists pipeline_stages_org_idx on revenue_ai.pipeline_stages(org_id, position);

create table if not exists revenue_ai.opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  account_id uuid references revenue_ai.accounts(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  stage_id uuid references revenue_ai.pipeline_stages(id) on delete set null,
  amount numeric not null default 0 check (amount >= 0),
  probability int check (probability between 0 and 100),
  close_date date,
  forecast_category revenue_ai.forecast_category not null default 'pipeline',
  deal_type text not null default 'new_business' check (deal_type in ('new_business','expansion','renewal')),
  product text,
  region text,
  lead_source text,
  next_step text,
  next_step_date date,
  description text,
  competitors text[] not null default '{}',
  status text not null default 'open' check (status in ('open','won','lost')),
  loss_reason text,
  stage_entered_at timestamptz not null default now(),
  closed_at timestamptz,
  last_activity_at timestamptz,
  external_source text,
  external_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opportunities_org_idx on revenue_ai.opportunities(org_id, status, close_date);
create index if not exists opportunities_owner_idx on revenue_ai.opportunities(owner_id);
create index if not exists opportunities_account_idx on revenue_ai.opportunities(account_id);
drop index if exists revenue_ai.opportunities_external_idx;
create unique index opportunities_external_idx on revenue_ai.opportunities(org_id, external_source, external_id);

-- Buyer stakeholders on a deal
create table if not exists revenue_ai.opportunity_contacts (
  opportunity_id uuid not null references revenue_ai.opportunities(id) on delete cascade,
  contact_id uuid not null references revenue_ai.contacts(id) on delete cascade,
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  primary key (opportunity_id, contact_id)
);

-- Stage history for conversion analysis and forecast change review
create table if not exists revenue_ai.opportunity_history (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  opportunity_id uuid not null references revenue_ai.opportunities(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  field text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);
create index if not exists opportunity_history_opp_idx on revenue_ai.opportunity_history(opportunity_id, created_at desc);
create index if not exists opportunity_history_org_idx on revenue_ai.opportunity_history(org_id, created_at desc);

-- Manager review comments on deals
create table if not exists revenue_ai.deal_comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  opportunity_id uuid not null references revenue_ai.opportunities(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists deal_comments_opp_idx on revenue_ai.deal_comments(opportunity_id, created_at);

-- ============================================================
-- ACTIVITIES, MEETINGS, TASKS, EMAIL TEMPLATES
-- ============================================================
create table if not exists revenue_ai.sales_activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  type text not null check (type in ('call','email','meeting','note','demo','proposal')),
  subject text not null check (char_length(subject) between 1 and 300),
  notes text,
  opportunity_id uuid references revenue_ai.opportunities(id) on delete set null,
  account_id uuid references revenue_ai.accounts(id) on delete set null,
  contact_id uuid references revenue_ai.contacts(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  outcome text check (outcome in ('positive','neutral','negative')),
  competitor_mentioned text,
  objection text,
  budget_discussed boolean not null default false,
  occurred_at timestamptz not null default now(),
  external_source text,
  external_id text,
  created_at timestamptz not null default now()
);
create index if not exists sales_activities_org_idx on revenue_ai.sales_activities(org_id, occurred_at desc);
create index if not exists sales_activities_opp_idx on revenue_ai.sales_activities(opportunity_id, occurred_at desc);
drop index if exists revenue_ai.sales_activities_external_idx;
create unique index sales_activities_external_idx on revenue_ai.sales_activities(org_id, external_source, external_id);

create table if not exists revenue_ai.meetings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  starts_at timestamptz not null,
  ends_at timestamptz,
  opportunity_id uuid references revenue_ai.opportunities(id) on delete set null,
  account_id uuid references revenue_ai.accounts(id) on delete set null,
  organiser_id uuid references auth.users(id) on delete set null,
  attendees text[] not null default '{}',
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  outcome text check (outcome in ('positive','neutral','negative')),
  summary text,
  external_source text,
  external_id text,
  created_at timestamptz not null default now()
);
create index if not exists meetings_org_idx on revenue_ai.meetings(org_id, starts_at desc);
drop index if exists revenue_ai.meetings_external_idx;
create unique index meetings_external_idx on revenue_ai.meetings(org_id, external_source, external_id);

create table if not exists revenue_ai.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  description text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'open' check (status in ('open','done','cancelled')),
  kind text not null default 'task' check (kind in ('task','follow_up','renewal_reminder','call','email')),
  assignee_id uuid references auth.users(id) on delete set null,
  opportunity_id uuid references revenue_ai.opportunities(id) on delete cascade,
  account_id uuid references revenue_ai.accounts(id) on delete cascade,
  contact_id uuid references revenue_ai.contacts(id) on delete set null,
  source text not null default 'manual' check (source in ('manual','agent','integration')),
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tasks_org_idx on revenue_ai.tasks(org_id, status, due_date);
create index if not exists tasks_assignee_idx on revenue_ai.tasks(assignee_id, status);

create table if not exists revenue_ai.email_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  subject text not null,
  body text not null,
  category text not null default 'follow_up',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- REVENUE: TRANSACTIONS, TARGETS, FORECASTS
-- ============================================================
-- Amounts are annualised contract values (ARR). MRR is ARR / 12.
create table if not exists revenue_ai.revenue_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  account_id uuid references revenue_ai.accounts(id) on delete set null,
  opportunity_id uuid references revenue_ai.opportunities(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('new','expansion','renewal','contraction','churn','one_time')),
  amount numeric not null check (amount >= 0),
  recurring boolean not null default true,
  product text,
  region text,
  occurred_on date not null default current_date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists revenue_transactions_org_idx on revenue_ai.revenue_transactions(org_id, occurred_on);
create unique index if not exists revenue_transactions_opp_idx on revenue_ai.revenue_transactions(opportunity_id) where opportunity_id is not null;

-- Organisation, team or individual quota for a period
create table if not exists revenue_ai.revenue_targets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  scope text not null default 'organisation' check (scope in ('organisation','team','user')),
  team_id uuid references revenue_ai.teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('month','quarter','year')),
  period_start date not null,
  period_end date not null,
  amount numeric not null check (amount >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create index if not exists revenue_targets_org_idx on revenue_ai.revenue_targets(org_id, period_start);

create table if not exists revenue_ai.forecasts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  name text not null,
  period_type text not null check (period_type in ('month','quarter','year')),
  period_start date not null,
  period_end date not null,
  owner_id uuid references auth.users(id) on delete set null,
  team_id uuid references revenue_ai.teams(id) on delete set null,
  submitted_amount numeric,
  best_case numeric,
  expected_case numeric,
  worst_case numeric,
  notes text,
  status text not null default 'draft' check (status in ('draft','submitted')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists forecasts_org_idx on revenue_ai.forecasts(org_id, period_start);

-- Point in time copies of forecast numbers, used for change review and accuracy tracking
create table if not exists revenue_ai.forecast_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  forecast_id uuid references revenue_ai.forecasts(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  closed_won numeric not null default 0,
  commit_amount numeric not null default 0,
  best_case_amount numeric not null default 0,
  pipeline_amount numeric not null default 0,
  weighted_pipeline numeric not null default 0,
  expected_case numeric not null default 0,
  best_case numeric not null default 0,
  worst_case numeric not null default 0,
  submitted_amount numeric,
  assumptions jsonb not null default '[]',
  taken_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists forecast_snapshots_org_idx on revenue_ai.forecast_snapshots(org_id, period_start, created_at desc);

-- ============================================================
-- INTELLIGENCE: HEALTH SCORES, RISKS, INSIGHTS, AGENTS
-- ============================================================
create table if not exists revenue_ai.deal_health_scores (
  opportunity_id uuid primary key references revenue_ai.opportunities(id) on delete cascade,
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  score int not null check (score between 0 and 100),
  health text not null check (health in ('healthy','watch','at_risk')),
  engagement_score int,
  components jsonb not null default '{}',
  computed_at timestamptz not null default now()
);
create index if not exists deal_health_org_idx on revenue_ai.deal_health_scores(org_id, health);

create table if not exists revenue_ai.deal_risk_factors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  opportunity_id uuid not null references revenue_ai.opportunities(id) on delete cascade,
  code text not null,
  severity text not null check (severity in ('low','medium','high')),
  kind text not null default 'risk' check (kind in ('risk','missing_information')),
  title text not null,
  evidence text not null,
  recommendation text,
  computed_at timestamptz not null default now()
);
create index if not exists deal_risk_opp_idx on revenue_ai.deal_risk_factors(opportunity_id);
create index if not exists deal_risk_org_idx on revenue_ai.deal_risk_factors(org_id, severity);

create table if not exists revenue_ai.ai_insights (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  severity text not null default 'info' check (severity in ('info','opportunity','warning','critical')),
  evidence jsonb not null default '[]',
  is_projection boolean not null default false,
  source text not null default 'rules' check (source in ('rules','ai')),
  agent_key text,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz
);
create index if not exists ai_insights_org_idx on revenue_ai.ai_insights(org_id, created_at desc);

create table if not exists revenue_ai.ai_agent_configs (
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  agent_key text not null check (agent_key in ('deal_inspection','forecasting','sales_productivity','pipeline_analysis','customer_retention','revenue_insights')),
  enabled boolean not null default false,
  -- Permissions: what the agent may propose. Every consequential action still needs a person's approval
  -- unless auto_create_tasks is on, which only allows creating internal tasks.
  can_create_tasks boolean not null default true,
  can_suggest_deal_updates boolean not null default true,
  can_draft_emails boolean not null default false,
  auto_create_tasks boolean not null default false,
  use_llm boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  last_run_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (org_id, agent_key)
);

-- Every agent run and every recommendation, with its evidence and approval trail
create table if not exists revenue_ai.ai_agent_activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  agent_key text not null,
  run_id uuid not null,
  kind text not null default 'recommendation' check (kind in ('run','recommendation')),
  title text not null,
  body text,
  evidence jsonb not null default '[]',
  opportunity_id uuid references revenue_ai.opportunities(id) on delete cascade,
  account_id uuid references revenue_ai.accounts(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  proposed_action jsonb,
  status text not null default 'pending' check (status in ('info','pending','approved','rejected','completed','failed','superseded')),
  priority int not null default 50,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  result text,
  triggered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists ai_agent_activities_org_idx on revenue_ai.ai_agent_activities(org_id, created_at desc);
create index if not exists ai_agent_activities_status_idx on revenue_ai.ai_agent_activities(org_id, status);

create table if not exists revenue_ai.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists revenue_ai.ai_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  conversation_id uuid not null references revenue_ai.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  evidence jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_conv_idx on revenue_ai.ai_messages(conversation_id, created_at);

-- ============================================================
-- CUSTOMERS: HEALTH, RENEWALS
-- ============================================================
create table if not exists revenue_ai.customer_health_scores (
  account_id uuid primary key references revenue_ai.accounts(id) on delete cascade,
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  score int not null check (score between 0 and 100),
  health text not null check (health in ('healthy','watch','at_risk')),
  churn_risk text not null default 'low' check (churn_risk in ('low','medium','high')),
  expansion_potential text not null default 'low' check (expansion_potential in ('low','medium','high')),
  components jsonb not null default '{}',
  computed_at timestamptz not null default now()
);

create table if not exists revenue_ai.renewals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  account_id uuid not null references revenue_ai.accounts(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  renewal_date date not null,
  current_arr numeric not null default 0 check (current_arr >= 0),
  expected_arr numeric,
  status text not null default 'upcoming' check (status in ('upcoming','in_progress','renewed','churned')),
  notes text,
  reminder_days int not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists renewals_org_idx on revenue_ai.renewals(org_id, renewal_date);

-- ============================================================
-- INTEGRATIONS
-- ============================================================
create table if not exists revenue_ai.integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  provider text not null check (provider in ('salesforce','hubspot','pipedrive','google','microsoft','slack','bi')),
  status text not null default 'disconnected' check (status in ('connected','disconnected','error')),
  account_label text,
  auto_sync boolean not null default false,
  sync_interval_hours int not null default 24,
  field_mapping jsonb not null default '{}',
  last_synced_at timestamptz,
  last_error text,
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (org_id, provider)
);

-- Encrypted OAuth tokens. No RLS policies: only the service role can read this table.
create table if not exists revenue_ai.integration_credentials (
  integration_id uuid primary key references revenue_ai.integrations(id) on delete cascade,
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  access_token_enc text,
  refresh_token_enc text,
  expires_at timestamptz,
  instance_url text,
  extra jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists revenue_ai.integration_sync_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  integration_id uuid not null references revenue_ai.integrations(id) on delete cascade,
  trigger text not null default 'manual' check (trigger in ('manual','automatic')),
  status text not null default 'running' check (status in ('running','succeeded','partial','failed')),
  records_created int not null default 0,
  records_updated int not null default 0,
  errors jsonb not null default '[]',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists integration_sync_runs_idx on revenue_ai.integration_sync_runs(integration_id, started_at desc);

-- OAuth state values (short lived, service role only)
create table if not exists revenue_ai.oauth_states (
  state text primary key,
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- BILLING, NOTIFICATIONS, AUDIT, USAGE
-- ============================================================
create table if not exists revenue_ai.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  plan_id text not null,
  status text not null check (status in ('active','cancelled','expired','pending')),
  provider text not null default 'selar',
  provider_reference text,
  customer_email text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_org_idx on revenue_ai.subscriptions(org_id, status);

create table if not exists revenue_ai.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  org_id uuid references revenue_ai.organisations(id) on delete set null,
  customer_email text,
  plan_id text,
  amount numeric,
  currency text,
  payload jsonb not null,
  processed boolean not null default false,
  process_note text,
  received_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table if not exists revenue_ai.usage_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('ai_query','agent_run')),
  quantity numeric not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists usage_records_org_idx on revenue_ai.usage_records(org_id, kind, created_at);

create table if not exists revenue_ai.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references revenue_ai.organisations(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on revenue_ai.notifications(user_id, created_at desc);

create table if not exists revenue_ai.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references revenue_ai.organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user','agent','system','integration')),
  agent_key text,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_org_idx on revenue_ai.audit_logs(org_id, created_at desc);

-- ============================================================
-- TRIGGERS
-- ============================================================
create or replace function revenue_ai.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

do $$ declare t text; begin
  foreach t in array array['profiles','organisations','accounts','contacts','opportunities','forecasts','renewals'] loop
    execute format('drop trigger if exists %I on revenue_ai.%I', t || '_touch', t);
    execute format('create trigger %I before update on revenue_ai.%I for each row execute function revenue_ai.touch_updated_at()', t || '_touch', t);
  end loop;
end $$;

-- Default pipeline for every new organisation
create or replace function revenue_ai.seed_org_defaults(p_org uuid)
returns void language plpgsql security definer set search_path = revenue_ai as $$
begin
  if not exists (select 1 from pipeline_stages where org_id = p_org) then
    insert into pipeline_stages(org_id, name, position, probability, kind, expected_days) values
      (p_org, 'Prospecting', 1, 10, 'open', 14),
      (p_org, 'Qualification', 2, 20, 'open', 14),
      (p_org, 'Discovery', 3, 40, 'open', 21),
      (p_org, 'Proposal', 4, 60, 'open', 14),
      (p_org, 'Negotiation', 5, 80, 'open', 14),
      (p_org, 'Closed Won', 6, 100, 'won', 1),
      (p_org, 'Closed Lost', 7, 0, 'lost', 1);
  end if;
  insert into ai_agent_configs(org_id, agent_key) values
    (p_org,'deal_inspection'),(p_org,'forecasting'),(p_org,'sales_productivity'),
    (p_org,'pipeline_analysis'),(p_org,'customer_retention'),(p_org,'revenue_insights')
  on conflict do nothing;
end; $$;

-- New user: profile, workspace, owner membership, default pipeline
create or replace function revenue_ai.handle_new_user()
returns trigger language plpgsql security definer set search_path = revenue_ai as $$
declare
  v_org uuid;
  v_name text := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1));
begin
  insert into organisations(name, owner_id, billing_email)
    values (coalesce(nullif(new.raw_user_meta_data->>'company_name',''), v_name || '''s Organisation'), new.id, new.email)
    returning id into v_org;
  insert into profiles(id, email, full_name, job_title, default_org_id)
    values (new.id, new.email, v_name, nullif(new.raw_user_meta_data->>'job_title',''), v_org);
  insert into organisation_members(org_id, user_id, role) values (v_org, new.id, 'owner');
  perform revenue_ai.seed_org_defaults(v_org);
  return new;
exception when others then
  -- Never block sign ups for other applications that share this Supabase project.
  raise warning 'revenue_ai.handle_new_user failed: %', sqlerrm;
  return new;
end; $$;
drop trigger if exists revenue_ai_on_auth_user_created on auth.users;
create trigger revenue_ai_on_auth_user_created after insert on auth.users
  for each row execute function revenue_ai.handle_new_user();

-- Opportunity bookkeeping: status from stage, stage history, closed won revenue
create or replace function revenue_ai.opportunity_before_write()
returns trigger language plpgsql security definer set search_path = revenue_ai as $$
declare v_kind text; v_prob int;
begin
  if new.stage_id is not null then
    select kind, probability into v_kind, v_prob from pipeline_stages where id = new.stage_id and org_id = new.org_id;
    if v_kind is null then raise exception 'Stage does not belong to this organisation'; end if;
    new.status := v_kind;
    if tg_op = 'INSERT' or new.stage_id is distinct from old.stage_id then
      new.stage_entered_at := now();
      if new.probability is null or (tg_op = 'UPDATE' and new.probability is not distinct from old.probability) then
        new.probability := v_prob;
      end if;
    end if;
  end if;
  if new.status = 'won' then new.forecast_category := 'closed'; end if;
  if new.status = 'lost' then new.forecast_category := 'omitted'; end if;
  if new.status in ('won','lost') and (tg_op = 'INSERT' or old.status = 'open') then new.closed_at := coalesce(new.closed_at, now()); end if;
  if new.status = 'open' then new.closed_at := null; end if;
  return new;
end; $$;
drop trigger if exists opportunity_before_write on revenue_ai.opportunities;
create trigger opportunity_before_write before insert or update on revenue_ai.opportunities
  for each row execute function revenue_ai.opportunity_before_write();

create or replace function revenue_ai.opportunity_after_write()
returns trigger language plpgsql security definer set search_path = revenue_ai as $$
begin
  if tg_op = 'UPDATE' then
    if new.stage_id is distinct from old.stage_id then
      insert into opportunity_history(org_id, opportunity_id, changed_by, field, old_value, new_value)
      values (new.org_id, new.id, auth.uid(), 'stage', (select name from pipeline_stages where id = old.stage_id), (select name from pipeline_stages where id = new.stage_id));
    end if;
    if new.amount is distinct from old.amount then
      insert into opportunity_history(org_id, opportunity_id, changed_by, field, old_value, new_value) values (new.org_id, new.id, auth.uid(), 'amount', old.amount::text, new.amount::text);
    end if;
    if new.close_date is distinct from old.close_date then
      insert into opportunity_history(org_id, opportunity_id, changed_by, field, old_value, new_value) values (new.org_id, new.id, auth.uid(), 'close_date', old.close_date::text, new.close_date::text);
    end if;
    if new.forecast_category is distinct from old.forecast_category then
      insert into opportunity_history(org_id, opportunity_id, changed_by, field, old_value, new_value) values (new.org_id, new.id, auth.uid(), 'forecast_category', old.forecast_category::text, new.forecast_category::text);
    end if;
  else
    insert into opportunity_history(org_id, opportunity_id, changed_by, field, old_value, new_value)
    values (new.org_id, new.id, auth.uid(), 'created', null, (select name from pipeline_stages where id = new.stage_id));
  end if;
  -- Closed won deals become booked revenue; reopening removes the booking
  if new.status = 'won' then
    insert into revenue_transactions(org_id, account_id, opportunity_id, owner_id, type, amount, recurring, product, region, occurred_on, created_by)
    values (new.org_id, new.account_id, new.id, new.owner_id,
            case new.deal_type when 'expansion' then 'expansion' when 'renewal' then 'renewal' else 'new' end,
            new.amount, true, new.product, new.region, coalesce(new.closed_at, now())::date, auth.uid())
    on conflict (opportunity_id) where opportunity_id is not null do update
      set amount = excluded.amount, owner_id = excluded.owner_id, account_id = excluded.account_id, type = excluded.type,
          product = excluded.product, region = excluded.region, occurred_on = excluded.occurred_on;
    if new.account_id is not null and new.deal_type = 'new_business' then
      update accounts set lifecycle_stage = 'customer' where id = new.account_id and lifecycle_stage = 'prospect';
    end if;
  elsif tg_op = 'UPDATE' and old.status = 'won' then
    delete from revenue_transactions where opportunity_id = new.id;
  end if;
  return null;
end; $$;
drop trigger if exists opportunity_after_write on revenue_ai.opportunities;
create trigger opportunity_after_write after insert or update on revenue_ai.opportunities
  for each row execute function revenue_ai.opportunity_after_write();

-- Activities keep last_activity_at current on deals and contacts
create or replace function revenue_ai.activity_after_insert()
returns trigger language plpgsql security definer set search_path = revenue_ai as $$
begin
  if new.opportunity_id is not null then
    update opportunities set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at) where id = new.opportunity_id;
  end if;
  if new.contact_id is not null then
    update contacts set last_contacted_at = greatest(coalesce(last_contacted_at, new.occurred_at), new.occurred_at) where id = new.contact_id;
  end if;
  return null;
end; $$;
drop trigger if exists activity_after_insert on revenue_ai.sales_activities;
create trigger activity_after_insert after insert on revenue_ai.sales_activities
  for each row execute function revenue_ai.activity_after_insert();

-- Seed defaults for organisations that already exist
do $$ declare r record; begin
  for r in select id from revenue_ai.organisations loop perform revenue_ai.seed_org_defaults(r.id); end loop;
end $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
do $$ declare t text; begin
  foreach t in array array['profiles','organisations','teams','territories','organisation_members','team_invitations','accounts','contacts',
    'pipeline_stages','opportunities','opportunity_contacts','opportunity_history','deal_comments','sales_activities','meetings','tasks',
    'email_templates','revenue_transactions','revenue_targets','forecasts','forecast_snapshots','deal_health_scores','deal_risk_factors',
    'ai_insights','ai_agent_configs','ai_agent_activities','ai_conversations','ai_messages','customer_health_scores','renewals',
    'integrations','integration_credentials','integration_sync_runs','oauth_states','subscriptions','payment_events','usage_records',
    'notifications','audit_logs'] loop
    execute format('alter table revenue_ai.%I enable row level security', t);
  end loop;
end $$;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'revenue_ai' loop
    execute format('drop policy if exists %I on revenue_ai.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles: yourself and teammates
create policy profiles_select on revenue_ai.profiles for select using (
  id = auth.uid() or exists (
    select 1 from revenue_ai.organisation_members a join revenue_ai.organisation_members b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy profiles_update on revenue_ai.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- organisation structure
create policy org_select on revenue_ai.organisations for select using (revenue_ai.is_org_member(id));
create policy org_update on revenue_ai.organisations for update using (revenue_ai.can_admin(id)) with check (revenue_ai.can_admin(id));
create policy members_select on revenue_ai.organisation_members for select using (revenue_ai.is_org_member(org_id));
create policy invitations_select on revenue_ai.team_invitations for select using (revenue_ai.can_admin(org_id));
create policy teams_select on revenue_ai.teams for select using (revenue_ai.is_org_member(org_id));
create policy teams_write on revenue_ai.teams for all using (revenue_ai.can_admin(org_id)) with check (revenue_ai.can_admin(org_id));
create policy territories_select on revenue_ai.territories for select using (revenue_ai.is_org_member(org_id));
create policy territories_write on revenue_ai.territories for all using (revenue_ai.can_admin(org_id)) with check (revenue_ai.can_admin(org_id));

-- CRM records: everyone in the organisation reads; CRM roles write
create policy accounts_select on revenue_ai.accounts for select using (revenue_ai.is_org_member(org_id));
create policy accounts_insert on revenue_ai.accounts for insert with check (revenue_ai.can_write_crm(org_id));
create policy accounts_update on revenue_ai.accounts for update using (revenue_ai.can_edit_owned(org_id, owner_id)) with check (revenue_ai.can_write_crm(org_id));
create policy accounts_delete on revenue_ai.accounts for delete using (revenue_ai.can_manage_revenue(org_id));

create policy contacts_select on revenue_ai.contacts for select using (revenue_ai.is_org_member(org_id));
create policy contacts_insert on revenue_ai.contacts for insert with check (revenue_ai.can_write_crm(org_id));
create policy contacts_update on revenue_ai.contacts for update using (revenue_ai.can_write_crm(org_id)) with check (revenue_ai.can_write_crm(org_id));
create policy contacts_delete on revenue_ai.contacts for delete using (revenue_ai.can_manage_revenue(org_id));

create policy stages_select on revenue_ai.pipeline_stages for select using (revenue_ai.is_org_member(org_id));
create policy stages_write on revenue_ai.pipeline_stages for all using (revenue_ai.has_org_role(org_id, array['owner','admin','revops']::revenue_ai.member_role[]))
  with check (revenue_ai.has_org_role(org_id, array['owner','admin','revops']::revenue_ai.member_role[]));

create policy opps_select on revenue_ai.opportunities for select using (revenue_ai.is_org_member(org_id));
create policy opps_insert on revenue_ai.opportunities for insert with check (revenue_ai.can_edit_owned(org_id, owner_id));
create policy opps_update on revenue_ai.opportunities for update using (revenue_ai.can_edit_owned(org_id, owner_id)) with check (revenue_ai.can_edit_owned(org_id, owner_id));
create policy opps_delete on revenue_ai.opportunities for delete using (revenue_ai.can_manage_revenue(org_id));

create policy oppcontacts_select on revenue_ai.opportunity_contacts for select using (revenue_ai.is_org_member(org_id));
create policy oppcontacts_write on revenue_ai.opportunity_contacts for all using (revenue_ai.can_write_crm(org_id)) with check (revenue_ai.can_write_crm(org_id));
create policy opphistory_select on revenue_ai.opportunity_history for select using (revenue_ai.is_org_member(org_id));

create policy comments_select on revenue_ai.deal_comments for select using (revenue_ai.is_org_member(org_id));
create policy comments_insert on revenue_ai.deal_comments for insert with check (revenue_ai.can_collaborate(org_id) and author_id = auth.uid());
create policy comments_delete on revenue_ai.deal_comments for delete using (author_id = auth.uid() or revenue_ai.can_admin(org_id));

create policy activities_select on revenue_ai.sales_activities for select using (revenue_ai.is_org_member(org_id));
create policy activities_insert on revenue_ai.sales_activities for insert with check (revenue_ai.can_write_crm(org_id));
create policy activities_update on revenue_ai.sales_activities for update using (revenue_ai.can_write_crm(org_id) and (user_id = auth.uid() or revenue_ai.can_manage_revenue(org_id)))
  with check (revenue_ai.can_write_crm(org_id));
create policy activities_delete on revenue_ai.sales_activities for delete using (user_id = auth.uid() or revenue_ai.can_manage_revenue(org_id));

create policy meetings_select on revenue_ai.meetings for select using (revenue_ai.is_org_member(org_id));
create policy meetings_write on revenue_ai.meetings for all using (revenue_ai.can_write_crm(org_id)) with check (revenue_ai.can_write_crm(org_id));

create policy tasks_select on revenue_ai.tasks for select using (revenue_ai.is_org_member(org_id));
create policy tasks_insert on revenue_ai.tasks for insert with check (revenue_ai.can_write_crm(org_id));
create policy tasks_update on revenue_ai.tasks for update using (revenue_ai.can_write_crm(org_id) and (assignee_id = auth.uid() or created_by = auth.uid() or revenue_ai.can_manage_revenue(org_id)))
  with check (revenue_ai.can_write_crm(org_id));
create policy tasks_delete on revenue_ai.tasks for delete using (created_by = auth.uid() or revenue_ai.can_manage_revenue(org_id));

create policy templates_select on revenue_ai.email_templates for select using (revenue_ai.is_org_member(org_id));
create policy templates_write on revenue_ai.email_templates for all using (revenue_ai.can_write_crm(org_id)) with check (revenue_ai.can_write_crm(org_id));

-- Revenue and forecasting: managers of the revenue process write
create policy tx_select on revenue_ai.revenue_transactions for select using (revenue_ai.is_org_member(org_id));
create policy tx_write on revenue_ai.revenue_transactions for all using (revenue_ai.can_manage_revenue(org_id)) with check (revenue_ai.can_manage_revenue(org_id));
create policy targets_select on revenue_ai.revenue_targets for select using (revenue_ai.is_org_member(org_id));
create policy targets_write on revenue_ai.revenue_targets for all using (revenue_ai.can_manage_revenue(org_id)) with check (revenue_ai.can_manage_revenue(org_id));
create policy forecasts_select on revenue_ai.forecasts for select using (revenue_ai.is_org_member(org_id));
create policy forecasts_write on revenue_ai.forecasts for all using (revenue_ai.can_manage_revenue(org_id)) with check (revenue_ai.can_manage_revenue(org_id));
create policy snapshots_select on revenue_ai.forecast_snapshots for select using (revenue_ai.is_org_member(org_id));
create policy snapshots_insert on revenue_ai.forecast_snapshots for insert with check (revenue_ai.can_manage_revenue(org_id));

-- Intelligence: read for members; written by the server after permission checks
create policy health_select on revenue_ai.deal_health_scores for select using (revenue_ai.is_org_member(org_id));
create policy risks_select on revenue_ai.deal_risk_factors for select using (revenue_ai.is_org_member(org_id));
create policy insights_select on revenue_ai.ai_insights for select using (revenue_ai.is_org_member(org_id));
create policy agentcfg_select on revenue_ai.ai_agent_configs for select using (revenue_ai.is_org_member(org_id));
create policy agentact_select on revenue_ai.ai_agent_activities for select using (revenue_ai.is_org_member(org_id));
create policy conv_all on revenue_ai.ai_conversations for all using (user_id = auth.uid() and revenue_ai.is_org_member(org_id))
  with check (user_id = auth.uid() and revenue_ai.is_org_member(org_id));
create policy msg_select on revenue_ai.ai_messages for select using (exists (
  select 1 from revenue_ai.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy custhealth_select on revenue_ai.customer_health_scores for select using (revenue_ai.is_org_member(org_id));
create policy renewals_select on revenue_ai.renewals for select using (revenue_ai.is_org_member(org_id));
create policy renewals_write on revenue_ai.renewals for all using (revenue_ai.can_write_crm(org_id)) with check (revenue_ai.can_write_crm(org_id));

-- Integrations: status visible to members; credentials and OAuth states have no policies (service role only)
create policy integrations_select on revenue_ai.integrations for select using (revenue_ai.is_org_member(org_id));
create policy syncruns_select on revenue_ai.integration_sync_runs for select using (revenue_ai.is_org_member(org_id));

-- Billing, usage, notifications, audit
create policy subs_select on revenue_ai.subscriptions for select using (revenue_ai.is_org_member(org_id));
create policy payments_select on revenue_ai.payment_events for select using (org_id is not null and revenue_ai.can_admin(org_id));
create policy usage_select on revenue_ai.usage_records for select using (revenue_ai.is_org_member(org_id));
create policy notifications_select on revenue_ai.notifications for select using (user_id = auth.uid());
create policy notifications_update on revenue_ai.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy audit_select on revenue_ai.audit_logs for select using (revenue_ai.has_org_role(org_id, array['owner','admin','revops','sales_manager']::revenue_ai.member_role[]));

-- Credentials must never be readable through the Data API
revoke all on revenue_ai.integration_credentials from authenticated, anon;
revoke all on revenue_ai.oauth_states from authenticated, anon;

-- ============================================================
-- STORAGE: private bucket for imports and report exports; first path segment is the org id
-- ============================================================
insert into storage.buckets (id, name, public) values ('revenue-ai-files','revenue-ai-files',false)
on conflict (id) do update set public = false;
drop policy if exists "revenue_ai read own org files" on storage.objects;
create policy "revenue_ai read own org files" on storage.objects for select using (
  bucket_id = 'revenue-ai-files' and revenue_ai.is_org_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "revenue_ai upload own org files" on storage.objects;
create policy "revenue_ai upload own org files" on storage.objects for insert with check (
  bucket_id = 'revenue-ai-files' and revenue_ai.can_write_crm(((storage.foldername(name))[1])::uuid));

-- ============================================================
-- REALTIME
-- ============================================================
do $$ begin alter publication supabase_realtime add table revenue_ai.notifications; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table revenue_ai.opportunities; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table revenue_ai.ai_agent_activities; exception when others then null; end $$;
