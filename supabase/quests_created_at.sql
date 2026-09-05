-- Adds quests.created_at and backfills the existing catalogue.
-- Run once, in the Supabase SQL editor.
--
-- WHY
--
-- The Journey hub shows a small suggested set (pickSuggestedQuests, capped at 9)
-- and now sorts recently added quests to the top, so new content surfaces
-- instead of sinking under the original seed catalogue. That ordering needs a
-- date, and the quests table had none.
--
-- The backfill matters as much as the column. `default now()` would stamp every
-- existing quest with today's date, so the entire catalogue would read as "new"
-- at once and the ordering would mean nothing. Existing rows are therefore
-- pushed back to a date that predates this change.

alter table public.quests
  add column if not exists created_at timestamptz not null default now();

-- Backfill: everything already in the catalogue is established content, not new.
-- Safe to re-run — the second run matches nothing, because rows written after
-- this migration will have their own real timestamps.
update public.quests
   set created_at = timestamptz '2026-07-01 00:00:00+00'
 where created_at >= timestamptz '2026-09-05 00:00:00+00'
   and id in (
     -- The 19 quests that made up the catalogue before 2026-09-05.
     select id from public.quests where id ~ '^q-[wmy]-[0-9]+$'
   );

-- Verify: the original catalogue should read as July, anything newer as itself.
select
  count(*) filter (where created_at < timestamptz '2026-08-01') as established,
  count(*) filter (where created_at >= timestamptz '2026-08-01') as recent
from public.quests;
