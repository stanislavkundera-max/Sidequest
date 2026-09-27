-- analytics_events: each account reads and writes only its own rows.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- WHY
--
-- Both policies allowed `user_id is null`. So any signed-in account — including an anonymous
-- one, which anyone gets by opening the app — could read every event without a user (the
-- events of deleted accounts, and until 2026-09-27 every cold-start `app_opened`), and could
-- insert events with no user, which would land in the closed-test numbers
-- (code review 2026-09-27).
--
-- The app no longer sends events without a user: `app_opened` is counted after the user is
-- identified (app/_layout.tsx). An insert the policy refuses is ignored by the app, so nothing
-- breaks if one slips through.
--
-- Account deletion is unaffected: delete_own_account() runs as security definer, and the
-- "on delete set null" that anonymises a deleted account's events is a foreign-key action,
-- not a policy check. Your own queries in the SQL editor run as postgres and still see
-- everything, deleted accounts' events included.

drop policy if exists "analytics_events_insert_own" on public.analytics_events;
create policy "analytics_events_insert_own"
  on public.analytics_events for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "analytics_events_select_own" on public.analytics_events;
create policy "analytics_events_select_own"
  on public.analytics_events for select
  to authenticated
  using (auth.uid() = user_id);

-- Check: both rows should mention auth.uid() = user_id and nothing about "is null".
select policyname, cmd, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'analytics_events';
