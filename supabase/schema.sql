-- ClimateBooks Database Schema
-- GHG Protocol compliant carbon accounting platform
-- Run this in your Supabase SQL editor

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists cb_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table cb_profiles enable row level security;
create policy "Users can manage own profile"
  on cb_profiles for all using (auth.uid() = id);

-- ============================================================
-- ORGANISATIONS
-- ============================================================
create table if not exists cb_organisations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry text,
  country text,
  reporting_year int default date_part('year', now()),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table cb_organisations enable row level security;
create policy "Users manage own organisations"
  on cb_organisations for all using (auth.uid() = owner_id);

create index on cb_organisations(owner_id);

-- ============================================================
-- EMISSIONS
-- GHG Protocol Scope 1, 2, 3
-- Formula: amount_tco2e = quantity * emission_factor / 1000
-- ============================================================
create table if not exists cb_emissions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references cb_organisations(id) on delete cascade,
  description text not null,
  scope text not null check (scope in ('scope1','scope2','scope3')),
  category text not null,
  quantity numeric(18,6) not null check (quantity >= 0),
  unit text not null,
  emission_factor numeric(18,6) not null check (emission_factor >= 0),
  ef_source text,
  amount_tco2e numeric(18,6) generated always as (quantity * emission_factor / 1000) stored,
  activity_date date not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table cb_emissions enable row level security;
create policy "Org members access emissions"
  on cb_emissions for all
  using (
    organisation_id in (
      select id from cb_organisations where owner_id = auth.uid()
    )
  );

create index on cb_emissions(organisation_id);
create index on cb_emissions(scope);
create index on cb_emissions(activity_date);

-- ============================================================
-- CLIMATE TARGETS
-- ============================================================
create table if not exists cb_climate_targets (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references cb_organisations(id) on delete cascade,
  name text not null,
  target_type text not null check (target_type in ('net-zero','sbti','carbon-neutral','reduction','other')),
  baseline_year int not null,
  target_year int not null,
  reduction_pct numeric(5,2) check (reduction_pct between 0 and 100),
  notes text,
  created_at timestamptz default now()
);

alter table cb_climate_targets enable row level security;
create policy "Org members access targets"
  on cb_climate_targets for all
  using (
    organisation_id in (
      select id from cb_organisations where owner_id = auth.uid()
    )
  );

create index on cb_climate_targets(organisation_id);

-- ============================================================
-- REPORTS
-- ============================================================
create table if not exists cb_reports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references cb_organisations(id) on delete cascade,
  name text not null,
  framework text not null,
  reporting_year int not null,
  scope1_tco2e numeric(18,6) default 0,
  scope2_tco2e numeric(18,6) default 0,
  scope3_tco2e numeric(18,6) default 0,
  total_tco2e numeric(18,6) default 0,
  status text default 'draft' check (status in ('draft','final','submitted')),
  created_at timestamptz default now()
);

alter table cb_reports enable row level security;
create policy "Org members access reports"
  on cb_reports for all
  using (
    organisation_id in (
      select id from cb_organisations where owner_id = auth.uid()
    )
  );

create index on cb_reports(organisation_id);

-- ============================================================
-- SUPPLIERS
-- ============================================================
create table if not exists cb_suppliers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references cb_organisations(id) on delete cascade,
  name text not null,
  contact_email text,
  country text,
  tier text check (tier in ('1','2','3')),
  status text default 'invited' check (status in ('invited','submitted','reviewed','overdue')),
  notes text,
  created_at timestamptz default now()
);

alter table cb_suppliers enable row level security;
create policy "Org members access suppliers"
  on cb_suppliers for all
  using (
    organisation_id in (
      select id from cb_organisations where owner_id = auth.uid()
    )
  );

create index on cb_suppliers(organisation_id);

-- ============================================================
-- REDUCTION INITIATIVES
-- ============================================================
create table if not exists cb_reduction_initiatives (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references cb_organisations(id) on delete cascade,
  name text not null,
  description text,
  scope text check (scope in ('scope1','scope2','scope3','all')),
  status text default 'planned' check (status in ('planned','in-progress','completed','cancelled')),
  estimated_reduction_tco2e numeric(18,6),
  target_date date,
  created_at timestamptz default now()
);

alter table cb_reduction_initiatives enable row level security;
create policy "Org members access initiatives"
  on cb_reduction_initiatives for all
  using (
    organisation_id in (
      select id from cb_organisations where owner_id = auth.uid()
    )
  );

create index on cb_reduction_initiatives(organisation_id);

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table if not exists cb_documents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references cb_organisations(id) on delete cascade,
  name text not null,
  document_type text default 'other' check (document_type in ('evidence','policy','report','contract','certificate','other')),
  storage_path text,
  file_size int,
  created_at timestamptz default now()
);

alter table cb_documents enable row level security;
create policy "Org members access documents"
  on cb_documents for all
  using (
    organisation_id in (
      select id from cb_organisations where owner_id = auth.uid()
    )
  );

create index on cb_documents(organisation_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists cb_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table cb_notifications enable row level security;
create policy "Users access own notifications"
  on cb_notifications for all using (auth.uid() = user_id);

create index on cb_notifications(user_id);
create index on cb_notifications(read);

-- ============================================================
-- SUBSCRIPTIONS (for access control — do not grant access on payment click alone)
-- ============================================================
create table if not exists cb_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('starter','professional','enterprise')),
  status text not null check (status in ('active','cancelled','past_due','trialing')),
  selar_reference text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table cb_subscriptions enable row level security;
create policy "Users read own subscription"
  on cb_subscriptions for select using (auth.uid() = user_id);

create index on cb_subscriptions(user_id);
