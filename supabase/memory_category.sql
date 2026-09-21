-- Adds memory_entries.category_id — an optional category for memories that are
-- not tied to a quest. Run once, in the Supabase SQL editor. Safe to re-run.
--
-- WHY
--
-- Round-2 closed-test feedback (R2-11, Eva): a memory you write yourself could
-- not be put in any category, so the Memories tab's category filter could never
-- find it. A quest's memory still takes its category from the quest — this
-- column is only written for free-standing memories, and is always optional.
--
-- ORDER
--
-- The app does not need this to have run first: memoriesRepository.ts retries
-- without the column if it is missing, so an older database just can't store
-- the category yet. Nothing breaks either way.
--
-- Also recorded as section 12 of production_prep.sql and in schema.sql, so a
-- fresh project gets it without this file.

alter table public.memory_entries
  add column if not exists category_id text
    references public.categories (id) on delete set null;

-- Sanity check: should return one row, data_type = text.
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'memory_entries'
   and column_name = 'category_id';
