-- Cleanup: legacy active-path data (run in the Supabase SQL editor).
--
-- The app allows at most 3 active quests per user (MAX_ACTIVE_QUESTS) and one
-- active row per quest. Accounts created before those rules can have more —
-- this script brings them in line without losing anything:
--   1) Upgrades the status check constraint (same as production_prep.sql §5),
--      so 'saved_for_later' & friends are legal.
--   2) Deletes duplicate active rows per (user_id, quest_id), keeping the most
--      recently touched one (that is where step progress lives).
--   3) For users with more than 3 active quests, keeps the 3 most recently
--      touched and moves the rest to 'saved_for_later' (they show up in Liked).
--   4) Prints a per-user summary so you can eyeball the result.
--
-- Idempotent: running it twice changes nothing the second time.

-- 0) Columns this script relies on (no-op if production_prep.sql already ran).
alter table if exists public.user_quests
  add column if not exists status text not null default 'active',
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists saved_at timestamptz,
  add column if not exists dismissed_at timestamptz;

update public.user_quests
set updated_at = coalesce(updated_at, started_at, now())
where updated_at is null;

alter table if exists public.user_quests
  alter column updated_at set default now();

-- 1) Status constraint upgrade (no-op if production_prep.sql already ran).
alter table if exists public.user_quests drop constraint if exists user_quests_status_check;
alter table if exists public.user_quests drop constraint if exists user_quests_status_chk;

update public.user_quests uq
set status = case
  when uq.completed_at is not null then 'completed'
  when uq.status is null or uq.status not in ('chosen', 'active', 'saved_for_later', 'completed', 'dismissed') then 'active'
  else uq.status
end;

alter table public.user_quests
  add constraint user_quests_status_chk check (
    status in ('chosen', 'active', 'saved_for_later', 'completed', 'dismissed')
  );

-- 2) Drop duplicate ACTIVE rows for the same quest (keep the freshest).
with ranked_dupes as (
  select
    id,
    row_number() over (
      partition by user_id, quest_id
      order by coalesce(updated_at, started_at) desc, started_at desc, id desc
    ) as rn
  from public.user_quests
  where status = 'active'
)
delete from public.user_quests
where id in (select id from ranked_dupes where rn > 1);

-- 3) Trim each user to 3 active quests; the overflow becomes 'saved_for_later'.
with ranked_active as (
  select
    id,
    row_number() over (
      partition by user_id
      order by coalesce(updated_at, started_at) desc, started_at desc, id desc
    ) as rn
  from public.user_quests
  where status = 'active'
)
update public.user_quests uq
set
  status = 'saved_for_later',
  saved_at = now(),
  updated_at = now()
from ranked_active r
where uq.id = r.id
  and r.rn > 3;

-- 4) Summary: active counts per user after cleanup (expect max 3 everywhere).
select
  user_id,
  count(*) filter (where status = 'active') as active,
  count(*) filter (where status = 'saved_for_later') as saved_for_later,
  count(*) filter (where status = 'completed') as completed
from public.user_quests
group by user_id
order by active desc, user_id;
