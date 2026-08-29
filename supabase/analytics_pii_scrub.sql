-- Analytics PII scrub — run once, in the Supabase SQL editor.
--
-- WHY THIS EXISTS
--
-- analytics_events.user_id is "on delete set null", which was assumed to make
-- deleted users' rows anonymous. It does not. The properties jsonb is a
-- free-form blob and two keys were being written into it that defeat the
-- nulling entirely:
--
--   'userId'  a verbatim copy of the user's UUID, written by the quest
--             feedback card. The column gets nulled on deletion; the copy
--             inside the jsonb does not, so the row stays fully identifying.
--   'note'    free text the user typed as quest feedback.
--
-- app/legal/delete-account.tsx tells users, in public, that after deletion the
-- account reference "cannot be restored or traced back to you" and that what
-- remains contains "nothing you wrote". Until this runs, both statements are
-- false for anyone who ever submitted quest feedback.
--
-- The app side is already fixed: QuestFeedbackCard no longer writes 'userId'
-- at all, and schema.sql's delete_own_account() now strips both keys before
-- deleting the auth row. This file handles the two things those cannot:
-- updating an already-deployed database, and cleaning up rows written before
-- the fix.
--
-- Run section 1 and 2 together. Section 3 is a verification query — it should
-- come back with no rows.

-- ---------------------------------------------------------------------------
-- 1) Bring the deployed delete_own_account() up to date.
--    Identical to the definition in schema.sql; repeated here so this file can
--    be run on its own without re-running the whole schema.
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 2) Clean up rows written before the fix.
-- ---------------------------------------------------------------------------

-- 2a) The duplicated identifier is redundant on EVERY row — live or orphaned.
--     Live rows already carry the real user_id in its own column, so nothing
--     is lost, and orphaned rows stop being re-identifiable.
update public.analytics_events
   set properties = properties - 'userId'
 where properties ? 'userId';

-- 2b) Free-text notes are only a problem once the author is gone. Rows whose
--     user_id is null belong to a deleted account, so their notes should have
--     been removed at deletion time and were not. Notes on live accounts are
--     left alone — that is legitimate product feedback you may still want to
--     read, and it disappears the moment that user deletes their account.
update public.analytics_events
   set properties = properties - 'note'
 where user_id is null
   and properties ? 'note';

-- ---------------------------------------------------------------------------
-- 3) Verify. Both counts must be 0.
-- ---------------------------------------------------------------------------

select
  count(*) filter (where properties ? 'userId')                     as rows_with_duplicated_user_id,
  count(*) filter (where user_id is null and properties ? 'note')   as orphaned_rows_with_user_text
from public.analytics_events;
