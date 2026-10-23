-- App feedback — run once, in the Supabase SQL editor (task 60, 2026-10-23).
--
-- WHY THIS EXISTS
--
-- "Send feedback" (Settings, and the occasional pop-up) used to open the
-- person's own mail app, so they had to send it from their private address.
-- Standa, 1.1.0 phone test: feedback should go instantly, with no e-mail of
-- their own. The app now inserts the message here; read it in the dashboard
-- (Table Editor → app_feedback).
--
-- WHAT IT PROMISES
--
-- - A person can add their own message and nothing else: no reading back, no
--   editing, no one else's rows (RLS insert-only, user_id = auth.uid()).
-- - Deleting the account deletes their messages (on delete cascade), which is
--   what app/legal/delete-account.tsx promises: nothing they wrote remains.
--
-- Section 2 is a check — it should return one row with insert_only = true.
-- Same definition as in schema.sql.

-- ---------------------------------------------------------------------------
-- 1) The table and its one policy.
-- ---------------------------------------------------------------------------

create table if not exists public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 1 and 4000),
  source text not null check (source in ('settings', 'prompt')),
  app_version text,
  platform text,
  os_version text,
  created_at timestamptz not null default now()
);

create index if not exists app_feedback_created_idx
  on public.app_feedback (created_at desc);

alter table public.app_feedback enable row level security;

drop policy if exists "app_feedback_insert_own" on public.app_feedback;
create policy "app_feedback_insert_own"
  on public.app_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2) Check: RLS on, and the only policy is the insert one.
-- ---------------------------------------------------------------------------

select
  c.relrowsecurity as rls_on,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'app_feedback') = 1
  and (select cmd from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'app_feedback') = 'INSERT' as insert_only
from pg_class c
where c.oid = 'public.app_feedback'::regclass;
