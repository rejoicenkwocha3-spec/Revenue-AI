-- SearchSprout Database Schema
-- Safe to re-run against any existing Supabase project

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- SEARCH PROJECTS
-- ─────────────────────────────────────────
create table if not exists public.search_projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.search_projects add column if not exists user_id uuid references auth.users on delete cascade;
alter table public.search_projects add column if not exists description text;
alter table public.search_projects add column if not exists status text not null default 'active';
alter table public.search_projects enable row level security;

drop policy if exists "Users can view own projects" on public.search_projects;
drop policy if exists "Users can insert own projects" on public.search_projects;
drop policy if exists "Users can update own projects" on public.search_projects;
drop policy if exists "Users can delete own projects" on public.search_projects;

create policy "Users can view own projects" on public.search_projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects" on public.search_projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on public.search_projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on public.search_projects for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- DATA SOURCES
-- ─────────────────────────────────────────
create table if not exists public.data_sources (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null default 'url',
  url text,
  status text not null default 'pending',
  record_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.data_sources enable row level security;

drop policy if exists "Users can view own data sources" on public.data_sources;
drop policy if exists "Users can insert own data sources" on public.data_sources;
drop policy if exists "Users can update own data sources" on public.data_sources;
drop policy if exists "Users can delete own data sources" on public.data_sources;

create policy "Users can view own data sources" on public.data_sources for select using (auth.uid() = user_id);
create policy "Users can insert own data sources" on public.data_sources for insert with check (auth.uid() = user_id);
create policy "Users can update own data sources" on public.data_sources for update using (auth.uid() = user_id);
create policy "Users can delete own data sources" on public.data_sources for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- SEARCH INDEXES
-- ─────────────────────────────────────────
create table if not exists public.search_indexes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  status text not null default 'active',
  record_count integer not null default 0,
  searchable_attributes text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.search_indexes enable row level security;

drop policy if exists "Users can view own indexes" on public.search_indexes;
drop policy if exists "Users can insert own indexes" on public.search_indexes;
drop policy if exists "Users can update own indexes" on public.search_indexes;
drop policy if exists "Users can delete own indexes" on public.search_indexes;

create policy "Users can view own indexes" on public.search_indexes for select using (auth.uid() = user_id);
create policy "Users can insert own indexes" on public.search_indexes for insert with check (auth.uid() = user_id);
create policy "Users can update own indexes" on public.search_indexes for update using (auth.uid() = user_id);
create policy "Users can delete own indexes" on public.search_indexes for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- API KEYS
-- ─────────────────────────────────────────
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  permissions text not null default 'read',
  last_used_at timestamptz,
  created_at timestamptz default now()
);

alter table public.api_keys enable row level security;

drop policy if exists "Users can view own api keys" on public.api_keys;
drop policy if exists "Users can insert own api keys" on public.api_keys;
drop policy if exists "Users can delete own api keys" on public.api_keys;

create policy "Users can view own api keys" on public.api_keys for select using (auth.uid() = user_id);
create policy "Users can insert own api keys" on public.api_keys for insert with check (auth.uid() = user_id);
create policy "Users can delete own api keys" on public.api_keys for delete using (auth.uid() = user_id);
