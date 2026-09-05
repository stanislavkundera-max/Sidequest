create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  display_name text,
  onboarding_completed boolean not null default false,
  intensity_preference text not null default 'balanced'
    check (intensity_preference in ('light', 'balanced', 'bold')),
  preferred_categories text[] not null default '{}'::text[],
  pace_preference text not null default 'steady'
    check (pace_preference in ('quick', 'steady', 'deep')),
  focus_preference text not null default 'comfort_zone'
    check (focus_preference in ('comfort_zone', 'calm', 'connection', 'wonder')),
  -- Baseline self-report only (1-5) — does not affect quest recommendation
  -- scoring. Re-askable later to measure change over time.
  nature_connection smallint not null default 3
    check (nature_connection between 1 and 5),
  isolation_score smallint not null default 3
    check (isolation_score between 1 and 5),
  -- How much the app "bothers" the user — settings-only, not asked during
  -- onboarding. No real notification sending is wired up to this yet.
  notification_intensity text not null default 'occasional'
    check (notification_intensity in ('quiet', 'occasional', 'chatty')),
  -- Bumped whenever nature_connection/isolation are (re-)saved — drives the
  -- 3-month re-ask nudge, not a general profile "last edited" timestamp.
  baseline_updated_at timestamptz not null default now(),
  -- The user's FIRST-ever nature_connection/isolation answer, set once and
  -- never overwritten — lets a future re-ask compare "now" against "day
  -- one" instead of against whatever was last saved. Null until the first
  -- onboarding save populates it.
  nature_connection_baseline smallint,
  isolation_baseline smallint
);

create table if not exists public.categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null
);

create table if not exists public.quests (
  id text primary key,
  title text not null,
  short_description text not null,
  full_description text not null,
  category_id text not null references public.categories (id) on delete restrict,
  timeframe text not null check (timeframe in ('weekly', 'monthly', 'yearly')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  estimated_duration_minutes integer not null default 30 check (estimated_duration_minutes > 0),
  prompt_for_reflection text not null,
  suggested_proof_type text not null default 'none'
    check (suggested_proof_type in ('none', 'text', 'photo')),
  is_active boolean not null default true,
  journey_intro text,
  action_steps jsonb not null default '[]'::jsonb,
  -- When the quest entered the catalogue. Drives the "newly added first"
  -- ordering in pickSuggestedQuests, so a quest written today surfaces instead
  -- of sinking under the original seed set. Added 2026-09-05; existing rows are
  -- backfilled to a past date by supabase/quests_created_at.sql, otherwise the
  -- whole catalogue would read as new at once.
  created_at timestamptz not null default now(),
  suggested_group text
    check (
      suggested_group is null
      or suggested_group in ('do_now', 'low_energy', 'outside', 'social', 'weekend')
    )
);

create table if not exists public.user_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quest_id text not null references public.quests (id) on delete restrict,
  status text not null default 'active'
    constraint user_quests_status_chk check (
      status in ('chosen', 'active', 'saved_for_later', 'completed', 'dismissed')
    ),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  saved_at timestamptz,
  dismissed_at timestamptz,
  memory_id uuid,
  note text,
  photo_url text,
  snapshot_title text,
  snapshot_short text,
  snapshot_category_id text references public.categories (id) on delete set null,
  snapshot_estimated_minutes integer,
  energy_level text check (energy_level is null or energy_level in ('low', 'medium', 'high')),
  anchor_moment text,
  step_progress jsonb not null default '{}'::jsonb,
  /** v2: stepId -> { completedAt, evidence } */
  step_progress_v2 jsonb not null default '{}'::jsonb
);

create table if not exists public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_quest_id uuid references public.user_quests (id) on delete set null,
  title text not null,
  body text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.future_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  timeframe text not null check (timeframe in ('weekly', 'monthly', 'yearly')),
  category_id text references public.categories (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists user_quests_user_status_idx
  on public.user_quests (user_id, status);
create index if not exists user_quests_user_started_idx
  on public.user_quests (user_id, started_at desc);
create index if not exists user_quests_user_quest_idx
  on public.user_quests (user_id, quest_id);
create index if not exists memory_entries_user_created_idx
  on public.memory_entries (user_id, created_at desc);
create index if not exists memory_entries_user_quest_idx
  on public.memory_entries (user_quest_id);
create index if not exists analytics_events_name_time_idx
  on public.analytics_events (event_name, occurred_at desc);
create index if not exists analytics_events_user_time_idx
  on public.analytics_events (user_id, occurred_at desc);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.quests enable row level security;
alter table public.user_quests enable row level security;
alter table public.memory_entries enable row level security;
alter table public.future_goals enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "categories_select_authenticated" on public.categories;
create policy "categories_select_authenticated"
  on public.categories for select
  to authenticated
  using (true);

drop policy if exists "quests_select_authenticated" on public.quests;
create policy "quests_select_authenticated"
  on public.quests for select
  to authenticated
  using (true);

drop policy if exists "user_quests_all_own" on public.user_quests;
create policy "user_quests_all_own"
  on public.user_quests for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "memory_entries_all_own" on public.memory_entries;
create policy "memory_entries_all_own"
  on public.memory_entries for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "future_goals_all_own" on public.future_goals;
create policy "future_goals_all_own"
  on public.future_goals for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), concat('Explorer-', left(new.id::text, 8)))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- Self-service account deletion (App Store Guideline 5.1.1(v) / Google Play
-- account deletion policy — both require an in-app option, not just a
-- "deactivate" toggle). Operates on auth.uid() only, never a parameter, so a
-- caller can only ever delete their own account. profiles/user_quests/
-- memory_entries/future_goals all cascade automatically via their existing
-- "on delete cascade" FK to auth.users. Storage objects don't cascade, so
-- they're removed explicitly first.
--
-- analytics_events.user_id is "on delete set null" so aggregate analytics
-- survive the deletion. That alone is NOT enough to call the row anonymous:
-- the properties jsonb is a free-form blob, and anything identifying copied
-- into it survives untouched while the real column is nulled. Two keys were
-- found doing exactly that — 'userId' (a duplicate of the column) and 'note'
-- (free text the user typed into quest feedback) — so they are stripped here,
-- before the delete, because once user_id is null there is no way left to
-- find which rows belonged to whom.
--
-- IF YOU ADD AN EVENT PROPERTY THAT CARRIES USER-WRITTEN TEXT OR ANY
-- IDENTIFIER, ADD ITS KEY TO THE strip list below. app/legal/delete-account.tsx
-- publicly promises that nothing the user wrote survives deletion; this
-- statement is what makes that promise true.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from storage.objects
    where bucket_id = 'quest-memory-photos'
      and (storage.foldername(name))[1] = uid::text;

  update public.analytics_events
     set properties = properties - 'note' - 'userId'
   where user_id = uid;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

insert into storage.buckets (id, name, public)
values ('quest-memory-photos', 'quest-memory-photos', false)
on conflict (id) do nothing;

drop policy if exists "quest_memory_photos_select_own" on storage.objects;
create policy "quest_memory_photos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'quest-memory-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "quest_memory_photos_insert_own" on storage.objects;
create policy "quest_memory_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'quest-memory-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "quest_memory_photos_update_own" on storage.objects;
create policy "quest_memory_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'quest-memory-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "quest_memory_photos_delete_own" on storage.objects;
create policy "quest_memory_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'quest-memory-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
