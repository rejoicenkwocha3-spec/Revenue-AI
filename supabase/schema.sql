-- TrueAuthor Database Schema
-- Run this in the Supabase SQL editor to set up all tables

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'student' check (role in ('student','lecturer','researcher','administrator','owner','reviewer','other')),
  organisation_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ORGANISATIONS
-- ============================================================
create table if not exists public.organisations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique,
  type text check (type in ('university','college','school','research_institution','publisher','corporate','other')),
  owner_id uuid references auth.users(id) on delete set null,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.organisations enable row level security;

create table if not exists public.organisation_members (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid references public.organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'student' check (role in ('owner','administrator','lecturer','student','researcher','reviewer')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz default now(),
  unique(organisation_id, user_id)
);

alter table public.organisation_members enable row level security;

create policy "Members can view their own organisation membership"
  on public.organisation_members for select
  using (auth.uid() = user_id);

-- ============================================================
-- DEPARTMENTS AND CLASSES
-- ============================================================
create table if not exists public.departments (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid references public.organisations(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.departments enable row level security;

create table if not exists public.classes (
  id uuid primary key default uuid_generate_v4(),
  department_id uuid references public.departments(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete cascade,
  name text not null,
  code text,
  lecturer_id uuid references auth.users(id),
  academic_year text,
  created_at timestamptz default now()
);

alter table public.classes enable row level security;

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
create table if not exists public.assignments (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  max_similarity_threshold integer default 25,
  settings jsonb default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.assignments enable row level security;

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  organisation_id uuid references public.organisations(id) on delete set null,
  assignment_id uuid references public.assignments(id) on delete set null,
  title text,
  file_path text,
  file_type text,
  file_size_bytes bigint,
  content_text text,
  word_count integer,
  status text default 'queued' check (status in ('queued','processing','completed','failed')),
  similarity_score integer,
  analysed_at timestamptz,
  error_message text,
  options jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- ============================================================
-- SIMILARITY RESULTS
-- ============================================================
create table if not exists public.similarity_results (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references public.documents(id) on delete cascade unique,
  user_id uuid references auth.users(id) on delete cascade,
  similarity_score integer,
  matched_sources jsonb default '[]',
  exclude_bibliography boolean default true,
  exclude_quotes boolean default false,
  analysis_method text default 'ngram_fingerprint',
  created_at timestamptz default now()
);

alter table public.similarity_results enable row level security;

create policy "Users can view their own similarity results"
  on public.similarity_results for select
  using (auth.uid() = user_id);

create policy "Service can insert similarity results"
  on public.similarity_results for insert
  with check (auth.uid() = user_id);

create policy "Service can update similarity results"
  on public.similarity_results for update
  using (auth.uid() = user_id);

-- ============================================================
-- AI WRITING REPORTS
-- ============================================================
create table if not exists public.ai_writing_reports (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references public.documents(id) on delete cascade unique,
  user_id uuid references auth.users(id) on delete cascade,
  overall_indicator text,
  confidence text,
  summary text,
  highlighted_passages jsonb default '[]',
  limitations_acknowledged boolean default true,
  created_at timestamptz default now()
);

alter table public.ai_writing_reports enable row level security;

create policy "Users can view their own AI reports"
  on public.ai_writing_reports for select
  using (auth.uid() = user_id);

create policy "Service can insert AI reports"
  on public.ai_writing_reports for insert
  with check (auth.uid() = user_id);

create policy "Service can update AI reports"
  on public.ai_writing_reports for update
  using (auth.uid() = user_id);

-- ============================================================
-- CITATION REPORTS
-- ============================================================
create table if not exists public.citation_reports (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references public.documents(id) on delete cascade unique,
  user_id uuid references auth.users(id) on delete cascade,
  total_citations integer default 0,
  issues_count integer default 0,
  issues jsonb default '[]',
  summary text,
  citation_style text,
  created_at timestamptz default now()
);

alter table public.citation_reports enable row level security;

create policy "Users can view their own citation reports"
  on public.citation_reports for select
  using (auth.uid() = user_id);

create policy "Service can insert citation reports"
  on public.citation_reports for insert
  with check (auth.uid() = user_id);

create policy "Service can update citation reports"
  on public.citation_reports for update
  using (auth.uid() = user_id);

-- ============================================================
-- GRAMMAR REPORTS
-- ============================================================
create table if not exists public.grammar_reports (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references public.documents(id) on delete cascade unique,
  user_id uuid references auth.users(id) on delete cascade,
  issues_count integer default 0,
  issues jsonb default '[]',
  summary text,
  readability_score numeric,
  created_at timestamptz default now()
);

alter table public.grammar_reports enable row level security;

create policy "Users can view their own grammar reports"
  on public.grammar_reports for select
  using (auth.uid() = user_id);

create policy "Service can insert grammar reports"
  on public.grammar_reports for insert
  with check (auth.uid() = user_id);

create policy "Service can update grammar reports"
  on public.grammar_reports for update
  using (auth.uid() = user_id);

-- ============================================================
-- ORIGINALITY REPORTS
-- ============================================================
create table if not exists public.originality_reports (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references public.documents(id) on delete cascade unique,
  user_id uuid references auth.users(id) on delete cascade,
  report_number text unique default ('TA-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  generated_at timestamptz default now(),
  pdf_path text,
  shared_with jsonb default '[]'
);

alter table public.originality_reports enable row level security;

create policy "Users can view their own originality reports"
  on public.originality_reports for select
  using (auth.uid() = user_id);

-- ============================================================
-- TEAM INVITATIONS
-- ============================================================
create table if not exists public.team_invitations (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid references public.organisations(id) on delete cascade,
  invited_by uuid references auth.users(id),
  email text not null,
  role text default 'student',
  token text unique default gen_random_uuid()::text,
  accepted boolean default false,
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now()
);

alter table public.team_invitations enable row level security;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text,
  title text,
  body text,
  read boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  plan text default 'free' check (plan in ('free','starter','professional','institution')),
  status text default 'active' check (status in ('active','cancelled','expired','pending')),
  selar_reference text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
create table if not exists public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.activity_logs enable row level security;

create policy "Users can view their own activity"
  on public.activity_logs for select
  using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run in Supabase dashboard: Storage > New bucket
-- Bucket name: documents
-- Public: false
-- File size limit: 20971520 (20MB)
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain

-- Storage policies (after creating the bucket)
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('documents', 'documents', false, 20971520, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
-- on conflict (id) do nothing;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_documents_created_at on public.documents(created_at desc);
create index if not exists idx_similarity_results_document_id on public.similarity_results(document_id);
create index if not exists idx_ai_writing_reports_document_id on public.ai_writing_reports(document_id);
create index if not exists idx_citation_reports_document_id on public.citation_reports(document_id);
create index if not exists idx_grammar_reports_document_id on public.grammar_reports(document_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
