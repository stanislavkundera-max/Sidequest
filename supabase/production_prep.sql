-- Production prep for Stage 6 / small external testing (5-15 users).
-- Run AFTER schema.sql and seed.sql.

-- 1) Normalize legacy singular table name to plural if needed.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_quest'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_quests'
  ) then
    alter table public.user_quest rename to user_quests;
  end if;
end $$;

-- 2) Ensure required columns for current app shape.
alter table if exists public.user_quests
  add column if not exists status text not null default 'active' check (status in ('active', 'completed')),
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz,
  add column if not exists note text,
  add column if not exists photo_url text,
  add column if not exists step_progress jsonb not null default '{}'::jsonb,
  -- v2: stepId -> { completedAt, evidence } (schema.sql has this on fresh
  -- installs via CREATE TABLE; existing tables need it added explicitly).
  add column if not exists step_progress_v2 jsonb not null default '{}'::jsonb;

alter table if exists public.quests
  add column if not exists journey_intro text,
  add column if not exists action_steps jsonb not null default '[]'::jsonb;

-- 3) Ensure analytics events table exists.
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists analytics_events_name_time_idx
  on public.analytics_events (event_name, occurred_at desc);
create index if not exists analytics_events_user_time_idx
  on public.analytics_events (user_id, occurred_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_insert_own" on public.analytics_events;
create policy "analytics_events_insert_own"
  on public.analytics_events for insert
  to authenticated
  with check (user_id is null or auth.uid() = user_id);

drop policy if exists "analytics_events_select_own" on public.analytics_events;
create policy "analytics_events_select_own"
  on public.analytics_events for select
  to authenticated
  using (user_id is null or auth.uid() = user_id);

-- 5) Quest state system: expand statuses, snapshots, suggested groups.
alter table if exists public.quests
  add column if not exists suggested_group text;

alter table if exists public.user_quests
  add column if not exists updated_at timestamptz,
  add column if not exists saved_at timestamptz,
  add column if not exists dismissed_at timestamptz,
  add column if not exists memory_id uuid,
  add column if not exists snapshot_title text,
  add column if not exists snapshot_short text,
  add column if not exists snapshot_category_id text,
  add column if not exists snapshot_estimated_minutes integer,
  add column if not exists energy_level text,
  add column if not exists anchor_moment text;

update public.user_quests set updated_at = coalesce(updated_at, started_at, now()) where updated_at is null;

alter table if exists public.user_quests
  alter column updated_at set default now();

-- Relax legacy status check (name varies by PG version).
alter table if exists public.user_quests drop constraint if exists user_quests_status_check;
alter table if exists public.user_quests drop constraint if exists user_quests_status_chk;

-- Normalize legacy values before the new check constraint is applied.
update public.user_quests uq
set status = case
  when uq.completed_at is not null then 'completed'
  when uq.status is null or uq.status not in ('chosen', 'active', 'saved_for_later', 'completed', 'dismissed') then 'active'
  else uq.status
end;

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'user_quests' and c.conname = 'user_quests_status_chk'
  ) then
    alter table public.user_quests
      add constraint user_quests_status_chk check (
        status in ('chosen', 'active', 'saved_for_later', 'completed', 'dismissed')
      );
  end if;
end $$;

-- Backfill snapshot + presentation from catalog.
update public.user_quests uq
set
  snapshot_title = coalesce(uq.snapshot_title, q.title),
  snapshot_short = coalesce(uq.snapshot_short, q.short_description),
  snapshot_category_id = coalesce(uq.snapshot_category_id, q.category_id),
  snapshot_estimated_minutes = coalesce(uq.snapshot_estimated_minutes, q.estimated_duration_minutes),
  energy_level = coalesce(
    uq.energy_level,
    case q.difficulty
      when 'easy' then 'low'
      when 'medium' then 'medium'
      when 'hard' then 'high'
    end
  ),
  anchor_moment = coalesce(
    uq.anchor_moment,
    case q.timeframe
      when 'weekly' then 'This week, when you have a pocket of time'
      when 'monthly' then 'Sometime this month, without rushing'
      when 'yearly' then 'Across the year, when the season feels right'
    end
  )
from public.quests q
where q.id = uq.quest_id;

-- Optional: suggested_group check (ignore if invalid in seed).
do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'quests' and c.conname = 'quests_suggested_group_chk'
  ) then
    alter table public.quests
      add constraint quests_suggested_group_chk check (
        suggested_group is null
        or suggested_group in ('do_now', 'low_energy', 'outside', 'social', 'weekend')
      );
  end if;
end $$;

-- 6) Profile onboarding preference columns (categories / pace / focus).
alter table if exists public.profiles
  add column if not exists preferred_categories text[] not null default '{}'::text[],
  add column if not exists pace_preference text not null default 'steady',
  add column if not exists focus_preference text not null default 'comfort_zone';

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'profiles' and c.conname = 'profiles_pace_preference_chk'
  ) then
    alter table public.profiles
      add constraint profiles_pace_preference_chk
      check (pace_preference in ('quick', 'steady', 'deep'));
  end if;

  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'profiles' and c.conname = 'profiles_focus_preference_chk'
  ) then
    alter table public.profiles
      add constraint profiles_focus_preference_chk
      check (focus_preference in ('comfort_zone', 'calm', 'connection', 'wonder'));
  end if;
end $$;

-- 7) Profile baseline self-report columns (nature connection / isolation).
-- 1-5 scale, does not affect quest recommendation scoring — re-askable
-- later to measure change over time.
alter table if exists public.profiles
  add column if not exists nature_connection smallint not null default 3,
  add column if not exists isolation_score smallint not null default 3;

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'profiles' and c.conname = 'profiles_nature_connection_chk'
  ) then
    alter table public.profiles
      add constraint profiles_nature_connection_chk
      check (nature_connection between 1 and 5);
  end if;

  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'profiles' and c.conname = 'profiles_isolation_score_chk'
  ) then
    alter table public.profiles
      add constraint profiles_isolation_score_chk
      check (isolation_score between 1 and 5);
  end if;
end $$;

-- 8) Notification-intensity preference — settings-only (not asked during
-- onboarding). How much the app "bothers" the user; no real notification
-- sending is wired up to this yet (mentor decision #3, round-1 feedback).
alter table if exists public.profiles
  add column if not exists notification_intensity text not null default 'occasional';

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'profiles' and c.conname = 'profiles_notification_intensity_chk'
  ) then
    alter table public.profiles
      add constraint profiles_notification_intensity_chk
      check (notification_intensity in ('quiet', 'occasional', 'chatty'));
  end if;
end $$;

-- 9) Baseline re-ask timestamp — bumped whenever nature_connection/isolation
-- are (re-)saved, drives a 3-month nudge to re-answer them (round-1 plan).
alter table if exists public.profiles
  add column if not exists baseline_updated_at timestamptz not null default now();

-- 4) Sanity check output.
select
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) as has_profiles,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'quests'
  ) as has_quests,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_quests'
  ) as has_user_quests,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'memory_entries'
  ) as has_memory_entries,
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'analytics_events'
  ) as has_analytics_events;
