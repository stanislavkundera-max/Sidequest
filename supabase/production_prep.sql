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
  add column if not exists step_progress jsonb not null default '{}'::jsonb;

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
