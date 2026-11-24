-- LinguaDub database schema
-- Run in the Supabase SQL editor, or with `supabase db push`.
-- Every tenant table carries org_id and is protected by Row Level Security.

create extension if not exists "pgcrypto";

-- Everything LinguaDub owns lives in its own schema so it can share a Supabase project with other apps.
create schema if not exists linguadub;
grant usage on schema linguadub to authenticated, service_role;
alter default privileges in schema linguadub grant all on tables to authenticated, service_role;
alter default privileges in schema linguadub grant all on sequences to authenticated, service_role;
alter default privileges in schema linguadub grant execute on functions to authenticated, service_role;

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type linguadub.member_role as enum ('owner','admin','editor','translator','reviewer','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type linguadub.project_status as enum (
    'draft','queued','uploading','transcribing','translating','review',
    'generating_voice','synchronising','rendering','completed','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type linguadub.job_status as enum ('queued','running','completed','failed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type linguadub.job_type as enum (
    'extract_audio','transcribe','translate','generate_voice','synchronise','subtitles','render');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFILES, ORGANISATIONS, MEMBERS
-- ============================================================
create table if not exists linguadub.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  default_org_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists linguadub.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  owner_id uuid not null references auth.users(id) on delete restrict,
  billing_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table linguadub.profiles
  drop constraint if exists profiles_default_org_fk,
  add constraint profiles_default_org_fk foreign key (default_org_id) references linguadub.organisations(id) on delete set null;

create table if not exists linguadub.organisation_members (
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  user_id uuid not null references linguadub.profiles(id) on delete cascade,
  role linguadub.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists organisation_members_user_idx on linguadub.organisation_members(user_id);

create table if not exists linguadub.team_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  email text not null,
  role linguadub.member_role not null default 'viewer' check (role <> 'owner'),
  token_hash text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists team_invitations_org_idx on linguadub.team_invitations(org_id);

-- ============================================================
-- RLS HELPERS (security definer avoids recursive policy checks)
-- ============================================================
create or replace function linguadub.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = linguadub as $$
  select exists(select 1 from organisation_members where org_id = p_org and user_id = auth.uid());
$$;

create or replace function linguadub.has_org_role(p_org uuid, p_roles linguadub.member_role[])
returns boolean language sql stable security definer set search_path = linguadub as $$
  select exists(select 1 from organisation_members
                where org_id = p_org and user_id = auth.uid() and role = any(p_roles));
$$;

create or replace function linguadub.can_edit(p_org uuid)
returns boolean language sql stable security definer set search_path = linguadub as $$
  select linguadub.has_org_role(p_org, array['owner','admin','editor']::linguadub.member_role[]);
$$;

create or replace function linguadub.can_translate(p_org uuid)
returns boolean language sql stable security definer set search_path = linguadub as $$
  select linguadub.has_org_role(p_org, array['owner','admin','editor','translator','reviewer']::linguadub.member_role[]);
$$;

create or replace function linguadub.can_admin(p_org uuid)
returns boolean language sql stable security definer set search_path = linguadub as $$
  select linguadub.has_org_role(p_org, array['owner','admin']::linguadub.member_role[]);
$$;

-- ============================================================
-- LANGUAGES (catalogue; provider support is resolved in the app)
-- ============================================================
create table if not exists linguadub.languages (
  code text primary key,
  name text not null,
  native_name text,
  enabled boolean not null default true
);
insert into linguadub.languages(code,name,native_name) values
 ('en','English','English'),('es','Spanish','Español'),('fr','French','Français'),
 ('de','German','Deutsch'),('pt','Portuguese','Português'),('ar','Arabic','العربية'),
 ('hi','Hindi','हिन्दी'),('zh','Chinese','中文'),('ja','Japanese','日本語'),
 ('ko','Korean','한국어'),('it','Italian','Italiano'),('nl','Dutch','Nederlands'),
 ('tr','Turkish','Türkçe'),('yo','Yoruba','Yorùbá'),('ha','Hausa','Hausa'),
 ('ig','Igbo','Igbo'),('sw','Swahili','Kiswahili'),('pl','Polish','Polski'),
 ('ru','Russian','Русский'),('id','Indonesian','Bahasa Indonesia')
on conflict (code) do nothing;

-- ============================================================
-- PROJECTS AND MEDIA
-- ============================================================
create table if not exists linguadub.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  source_language text references linguadub.languages(code),
  target_languages text[] not null default '{}',
  status linguadub.project_status not null default 'draft',
  status_detail text,
  media_kind text check (media_kind in ('video','audio')),
  duration_seconds numeric,
  original_audio_volume numeric not null default 0.12 check (original_audio_volume between 0 and 1),
  approval_status text not null default 'not_submitted'
    check (approval_status in ('not_submitted','in_review','approved','changes_requested')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_org_idx on linguadub.projects(org_id, updated_at desc);

create table if not exists linguadub.media_files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid references linguadub.projects(id) on delete cascade,
  kind text not null check (kind in ('video','audio','extracted_audio')),
  bucket text not null default 'media',
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  duration_seconds numeric,
  width int,
  height int,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists media_files_org_idx on linguadub.media_files(org_id, created_at desc);
create index if not exists media_files_project_idx on linguadub.media_files(project_id);

-- Typed views over media_files.
create or replace view linguadub.video_files with (security_invoker = true) as
  select * from linguadub.media_files where kind = 'video';
create or replace view linguadub.audio_files with (security_invoker = true) as
  select * from linguadub.media_files where kind in ('audio','extracted_audio');

-- ============================================================
-- TRANSCRIPTION, SPEAKERS, SEGMENTS
-- ============================================================
create table if not exists linguadub.voice_consents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  voice_owner_name text not null,
  voice_owner_email text not null,
  is_self boolean not null default false,
  consent_statement text not null,
  commercial_use boolean not null default false,
  token_hash text unique,
  status text not null default 'pending' check (status in ('pending','verified','revoked')),
  signature_name text,
  consent_recording_path text,
  verified_user_id uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  verified_ip text,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists linguadub.voice_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  provider text not null,
  provider_voice_id text not null,
  name text not null,
  language text,
  accent text,
  gender text,
  style text,
  description text,
  preview_path text,
  is_cloned boolean not null default false,
  consent_id uuid references linguadub.voice_consents(id) on delete restrict,
  sample_paths text[] not null default '{}',
  status text not null default 'active' check (status in ('active','deleted','failed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint cloned_requires_consent check (not is_cloned or consent_id is not null)
);
create index if not exists voice_profiles_org_idx on linguadub.voice_profiles(org_id);

create table if not exists linguadub.voice_favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  provider text not null,
  provider_voice_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, provider, provider_voice_id)
);

create table if not exists linguadub.transcriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid not null references linguadub.projects(id) on delete cascade,
  media_file_id uuid references linguadub.media_files(id) on delete set null,
  language text,
  provider text not null,
  full_text text,
  word_count int,
  created_at timestamptz not null default now()
);
create index if not exists transcriptions_project_idx on linguadub.transcriptions(project_id);

create table if not exists linguadub.speakers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid not null references linguadub.projects(id) on delete cascade,
  label text not null,
  display_name text not null,
  color text,
  -- voice assignment per speaker: provider + provider voice id
  voice_provider text,
  voice_id text,
  voice_name text,
  accent text,
  emotion text not null default 'neutral',
  created_at timestamptz not null default now(),
  unique (project_id, label)
);

create table if not exists linguadub.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid not null references linguadub.projects(id) on delete cascade,
  transcription_id uuid not null references linguadub.transcriptions(id) on delete cascade,
  speaker_id uuid references linguadub.speakers(id) on delete set null,
  idx int not null,
  start_ms int not null,
  end_ms int not null,
  source_text text not null,
  unique (transcription_id, idx)
);
create index if not exists transcript_segments_project_idx on linguadub.transcript_segments(project_id, idx);

create table if not exists linguadub.translation_segments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid not null references linguadub.projects(id) on delete cascade,
  segment_id uuid not null references linguadub.transcript_segments(id) on delete cascade,
  target_language text not null references linguadub.languages(code),
  text text not null default '',
  provider text,
  start_ms int not null,
  end_ms int not null,
  speed numeric not null default 1.0 check (speed between 0.5 and 2.0),
  pause_ms int not null default 0 check (pause_ms between 0 and 10000),
  offset_ms int not null default 0 check (offset_ms between -10000 and 10000),
  emotion text,
  status text not null default 'draft' check (status in ('draft','edited','approved')),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (segment_id, target_language)
);
create index if not exists translation_segments_project_idx on linguadub.translation_segments(project_id, target_language);

create table if not exists linguadub.generated_audio (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid not null references linguadub.projects(id) on delete cascade,
  translation_segment_id uuid references linguadub.translation_segments(id) on delete cascade,
  target_language text not null,
  kind text not null default 'segment' check (kind in ('segment','track','preview')),
  storage_path text not null,
  duration_ms int,
  provider text,
  voice_id text,
  emotion text,
  text_hash text,
  created_at timestamptz not null default now()
);
create index if not exists generated_audio_project_idx on linguadub.generated_audio(project_id, target_language);

create table if not exists linguadub.subtitles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid not null references linguadub.projects(id) on delete cascade,
  language text not null,
  is_source boolean not null default false,
  format text not null check (format in ('srt','vtt')),
  storage_path text not null,
  timing_offset_ms int not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, language, format)
);

-- ============================================================
-- JOBS, EXPORTS, USAGE
-- ============================================================
create table if not exists linguadub.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid not null references linguadub.projects(id) on delete cascade,
  type linguadub.job_type not null,
  target_language text,
  status linguadub.job_status not null default 'queued',
  attempts int not null default 0,
  max_attempts int not null default 3,
  error text,
  payload jsonb not null default '{}',
  result jsonb,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists processing_jobs_queue_idx on linguadub.processing_jobs(status, run_after);
create index if not exists processing_jobs_project_idx on linguadub.processing_jobs(project_id, created_at desc);

create table if not exists linguadub.export_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid not null references linguadub.projects(id) on delete cascade,
  target_language text not null,
  kind text not null check (kind in ('video','audio','srt','vtt')),
  format text not null,
  storage_path text not null,
  size_bytes bigint,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists export_records_org_idx on linguadub.export_records(org_id, created_at desc);

create table if not exists linguadub.usage_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  project_id uuid references linguadub.projects(id) on delete set null,
  job_id uuid references linguadub.processing_jobs(id) on delete set null,
  kind text not null default 'dub_minutes',
  quantity numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists usage_records_org_idx on linguadub.usage_records(org_id, created_at);

-- ============================================================
-- BILLING
-- ============================================================
create table if not exists linguadub.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
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
create index if not exists subscriptions_org_idx on linguadub.subscriptions(org_id, status);

create table if not exists linguadub.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  org_id uuid references linguadub.organisations(id) on delete set null,
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

-- ============================================================
-- NOTIFICATIONS AND ACTIVITY
-- ============================================================
create table if not exists linguadub.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references linguadub.organisations(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on linguadub.notifications(user_id, created_at desc);

create table if not exists linguadub.activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references linguadub.organisations(id) on delete cascade,
  user_id uuid references linguadub.profiles(id) on delete set null,
  project_id uuid references linguadub.projects(id) on delete cascade,
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_org_idx on linguadub.activity_logs(org_id, created_at desc);

-- ============================================================
-- NEW USER BOOTSTRAP: profile + personal workspace + owner membership
-- ============================================================
create or replace function linguadub.handle_new_user()
returns trigger language plpgsql security definer set search_path = linguadub as $$
declare
  v_org uuid;
  v_name text := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1));
begin
  insert into organisations(name, owner_id, billing_email)
    values (coalesce(nullif(new.raw_user_meta_data->>'workspace_name',''), v_name || '''s Workspace'), new.id, new.email)
    returning id into v_org;
  insert into profiles(id, email, full_name, default_org_id) values (new.id, new.email, v_name, v_org);
  insert into organisation_members(org_id, user_id, role) values (v_org, new.id, 'owner');
  return new;
exception when others then
  -- Never block sign ups for other applications that share this Supabase project.
  raise warning 'linguadub.handle_new_user failed: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists linguadub_on_auth_user_created on auth.users;
create trigger linguadub_on_auth_user_created after insert on auth.users
  for each row execute function linguadub.handle_new_user();

create or replace function linguadub.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists projects_touch on linguadub.projects;
create trigger projects_touch before update on linguadub.projects for each row execute function linguadub.touch_updated_at();
drop trigger if exists profiles_touch on linguadub.profiles;
create trigger profiles_touch before update on linguadub.profiles for each row execute function linguadub.touch_updated_at();

-- ============================================================
-- JOB QUEUE: atomic claim with SKIP LOCKED (called with the service role)
-- ============================================================
create or replace function linguadub.claim_next_job()
returns setof linguadub.processing_jobs language plpgsql security definer set search_path = linguadub as $$
begin
  -- release jobs whose worker died (locked for more than 15 minutes)
  update processing_jobs set status = 'queued', locked_at = null
    where status = 'running' and locked_at < now() - interval '15 minutes';

  return query
  update processing_jobs j set status = 'running', locked_at = now(),
         started_at = coalesce(j.started_at, now()), attempts = j.attempts + 1
  where j.id = (
    select id from processing_jobs
    where status = 'queued' and run_after <= now()
    order by run_after, created_at
    for update skip locked
    limit 1)
  returning j.*;
end; $$;
revoke all on function linguadub.claim_next_job() from public, anon, authenticated;
grant execute on function linguadub.claim_next_job() to service_role;

-- Storage usage per organisation, in bytes.
create or replace function linguadub.org_storage_bytes(p_org uuid)
returns bigint language sql stable security definer set search_path = linguadub as $$
  select coalesce((select sum(size_bytes) from media_files where org_id = p_org),0)
       + coalesce((select sum(size_bytes) from export_records where org_id = p_org),0);
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table linguadub.profiles enable row level security;
alter table linguadub.organisations enable row level security;
alter table linguadub.organisation_members enable row level security;
alter table linguadub.team_invitations enable row level security;
alter table linguadub.languages enable row level security;
alter table linguadub.projects enable row level security;
alter table linguadub.media_files enable row level security;
alter table linguadub.voice_consents enable row level security;
alter table linguadub.voice_profiles enable row level security;
alter table linguadub.voice_favourites enable row level security;
alter table linguadub.transcriptions enable row level security;
alter table linguadub.speakers enable row level security;
alter table linguadub.transcript_segments enable row level security;
alter table linguadub.translation_segments enable row level security;
alter table linguadub.generated_audio enable row level security;
alter table linguadub.subtitles enable row level security;
alter table linguadub.processing_jobs enable row level security;
alter table linguadub.export_records enable row level security;
alter table linguadub.usage_records enable row level security;
alter table linguadub.subscriptions enable row level security;
alter table linguadub.payment_events enable row level security;
alter table linguadub.notifications enable row level security;
alter table linguadub.activity_logs enable row level security;

-- helper to (re)create policies idempotently
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'linguadub'
    and tablename in ('profiles','organisations','organisation_members','team_invitations','languages','projects','media_files',
      'voice_consents','voice_profiles','voice_favourites','transcriptions','speakers','transcript_segments','translation_segments',
      'generated_audio','subtitles','processing_jobs','export_records','usage_records','subscriptions','payment_events',
      'notifications','activity_logs') loop
    execute format('drop policy if exists %I on linguadub.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles: self, plus teammates can see each other
create policy profiles_select on linguadub.profiles for select using (
  id = auth.uid() or exists (
    select 1 from linguadub.organisation_members a join linguadub.organisation_members b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy profiles_update on linguadub.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- organisations
create policy org_select on linguadub.organisations for select using (linguadub.is_org_member(id));
create policy org_update on linguadub.organisations for update using (linguadub.can_admin(id)) with check (linguadub.can_admin(id));

-- members: visible to members; managed by admins through the server API
create policy members_select on linguadub.organisation_members for select using (linguadub.is_org_member(org_id));

-- invitations: admins only
create policy invitations_select on linguadub.team_invitations for select using (linguadub.can_admin(org_id));

-- languages: readable by everyone
create policy languages_select on linguadub.languages for select using (true);

-- projects
create policy projects_select on linguadub.projects for select using (linguadub.is_org_member(org_id));
create policy projects_insert on linguadub.projects for insert with check (linguadub.can_edit(org_id));
create policy projects_update on linguadub.projects for update using (linguadub.can_translate(org_id)) with check (linguadub.can_translate(org_id));
create policy projects_delete on linguadub.projects for delete using (linguadub.can_edit(org_id));

-- generic org scoped read for content tables
create policy media_select on linguadub.media_files for select using (linguadub.is_org_member(org_id));
create policy media_delete on linguadub.media_files for delete using (linguadub.can_edit(org_id));
create policy transcriptions_select on linguadub.transcriptions for select using (linguadub.is_org_member(org_id));
create policy speakers_select on linguadub.speakers for select using (linguadub.is_org_member(org_id));
create policy speakers_update on linguadub.speakers for update using (linguadub.can_translate(org_id)) with check (linguadub.can_translate(org_id));
create policy tseg_select on linguadub.transcript_segments for select using (linguadub.is_org_member(org_id));
create policy tseg_update on linguadub.transcript_segments for update using (linguadub.can_translate(org_id)) with check (linguadub.can_translate(org_id));
create policy trseg_select on linguadub.translation_segments for select using (linguadub.is_org_member(org_id));
create policy trseg_update on linguadub.translation_segments for update using (linguadub.can_translate(org_id)) with check (linguadub.can_translate(org_id));
create policy genaudio_select on linguadub.generated_audio for select using (linguadub.is_org_member(org_id));
create policy subtitles_select on linguadub.subtitles for select using (linguadub.is_org_member(org_id));
create policy jobs_select on linguadub.processing_jobs for select using (linguadub.is_org_member(org_id));
create policy exports_select on linguadub.export_records for select using (linguadub.is_org_member(org_id));
create policy usage_select on linguadub.usage_records for select using (linguadub.is_org_member(org_id));
create policy subs_select on linguadub.subscriptions for select using (linguadub.is_org_member(org_id));
create policy activity_select on linguadub.activity_logs for select using (linguadub.is_org_member(org_id));
create policy voices_select on linguadub.voice_profiles for select using (linguadub.is_org_member(org_id));
create policy consents_select on linguadub.voice_consents for select using (linguadub.is_org_member(org_id));
create policy favs_all on linguadub.voice_favourites for all using (user_id = auth.uid() and linguadub.is_org_member(org_id))
  with check (user_id = auth.uid() and linguadub.is_org_member(org_id));
create policy notifications_select on linguadub.notifications for select using (user_id = auth.uid());
create policy notifications_update on linguadub.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy payments_select on linguadub.payment_events for select using (org_id is not null and linguadub.can_admin(org_id));

-- ============================================================
-- STORAGE: private buckets, first path segment is the org id
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('linguadub-media','linguadub-media',false), ('linguadub-generated','linguadub-generated',false),
  ('linguadub-exports','linguadub-exports',false), ('linguadub-voice-samples','linguadub-voice-samples',false)
on conflict (id) do update set public = false;

drop policy if exists "linguadub read own org objects" on storage.objects;
create policy "linguadub read own org objects" on storage.objects for select using (
  bucket_id in ('linguadub-media','linguadub-generated','linguadub-exports','linguadub-voice-samples')
  and linguadub.is_org_member(((storage.foldername(name))[1])::uuid));

drop policy if exists "linguadub upload media" on storage.objects;
create policy "linguadub upload media" on storage.objects for insert with check (
  bucket_id in ('linguadub-media','linguadub-voice-samples')
  and linguadub.can_edit(((storage.foldername(name))[1])::uuid));

-- ============================================================
-- REALTIME
-- ============================================================
do $$ begin
  alter publication supabase_realtime add table linguadub.processing_jobs;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table linguadub.projects;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table linguadub.notifications;
exception when others then null; end $$;
