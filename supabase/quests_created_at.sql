-- Adds quests.created_at and backfills the existing catalogue.
-- Run once, in the Supabase SQL editor.
--
-- WHY
--
-- The Journey tab shows only five quests per category, and sorts recently added
-- ones to the top so new content surfaces instead of sinking under the original
-- seed catalogue. With a cap that tight, a quest that never reaches the top five
-- is a quest nobody sees. That ordering needs a date, and the quests table had
-- none.
--
-- The backfill matters as much as the column. `default now()` would stamp every
-- existing quest with today's date, so the entire catalogue would read as "new"
-- at once and the ordering would mean nothing. Existing rows are therefore
-- pushed back to a date that predates this change.

alter table public.quests
  add column if not exists created_at timestamptz not null default now();

-- Backfill: everything that was already in the catalogue is established content,
-- not new.
--
-- The list is written out rather than matched by pattern. An earlier version
-- selected `id ~ '^q-[wmy]-[0-9]+$'`, which is the shape of *every* quest id
-- including the ones added on 2026-09-05 — so running this file after
-- quests_catalogue.sql would have back-dated the new quests too and quietly
-- emptied the "newly added" ordering of any meaning. Naming the nineteen makes
-- the file safe to run in either order, and safe to re-run.
update public.quests
   set created_at = timestamptz '2026-07-01 00:00:00+00'
 where created_at >= timestamptz '2026-09-05 00:00:00+00'
   and id in (
     'q-w-01', 'q-w-02', 'q-w-03', 'q-w-04', 'q-w-05',
     'q-w-06', 'q-w-07', 'q-w-08', 'q-w-09', 'q-w-10',
     'q-m-01', 'q-m-02', 'q-m-03', 'q-m-05', 'q-m-06',
     'q-y-01', 'q-y-02', 'q-y-03', 'q-y-04'
   );

-- Verify: the original catalogue should read as July, anything newer as itself.
select
  count(*) filter (where created_at < timestamptz '2026-08-01') as established,
  count(*) filter (where created_at >= timestamptz '2026-08-01') as recent
from public.quests;
