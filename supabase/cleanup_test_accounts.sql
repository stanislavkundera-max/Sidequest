-- Cleans up the throwaway anonymous accounts left behind by browser testing.
-- Run once, in the Supabase SQL editor. Two steps — run STEP 1, look, then STEP 2.
--
-- WHY THERE ARE TWO STEPS
--
-- The app gives anyone who taps "Continue without an account" an anonymous
-- session, so closed-test users can look exactly like test accounts: no email,
-- created recently. A blanket "delete anonymous accounts from this week" would
-- delete real testers. So step 1 only LISTS them, with what each has done, and
-- step 2 deletes the ids you name.
--
-- Accounts created while verifying round-2 fixes (2026-09-21 … 09-26), all
-- anonymous, all with a handful of quests at most and no photos:
--
--   a3747ca8-de80-46a1-9f83-6ace71464087   2026-09-21   (R2-29: the one the broken
--                                                         in-app deletion could not remove)
--   2561e940-881e-447b-a04d-546e2be52937   2026-09-21
--   8758e108-…                              2026-09-23   (full id: read it from step 1)
--   72f82818-7259-4ef6-8fac-8ea2bcfccd76   2026-09-26
--   52d168bc-4059-4c81-9115-2cea9f147075   2026-09-27   (code review; signed out to test the guest warning)
--   c3d2930b-f8f6-4d7d-b6f8-5a3af5d9fe7e   2026-09-27   (code review; one memory, its test photo already removed)
--
-- Their analytics events are removed too, not just anonymised. They were never
-- real usage, and left in they would count as "activated a quest" in the numbers
-- being collected from the closed test.

-- STEP 1 — list anonymous accounts, newest first, with their activity.
select u.id,
       u.created_at,
       u.last_sign_in_at,
       (select count(*) from public.user_quests q       where q.user_id = u.id) as quests,
       (select count(*) from public.memory_entries m    where m.user_id = u.id) as memories,
       (select count(*) from public.analytics_events a  where a.user_id = u.id) as events,
       (select count(*) from storage.objects o
         where o.bucket_id = 'quest-memory-photos'
           and (storage.foldername(o.name))[1] = u.id::text)                    as photos
  from auth.users u
 where u.is_anonymous
   and u.email is null
 order by u.created_at desc
 limit 50;

-- STEP 2 — delete the ones you recognise as yours. Put their ids in BOTH lists.
-- Order matters: events first, while they can still be tied to the account.
-- Deleting the auth user cascades to profiles, user_quests, memory_entries and
-- future_goals; it does not touch storage, so this is only for accounts whose
-- `photos` column in step 1 reads 0.
--
-- delete from public.analytics_events
--  where user_id in (
--    'a3747ca8-de80-46a1-9f83-6ace71464087',
--    '52d168bc-4059-4c81-9115-2cea9f147075',
--    'c3d2930b-f8f6-4d7d-b6f8-5a3af5d9fe7e',
--    '2561e940-881e-447b-a04d-546e2be52937',
--    '72f82818-7259-4ef6-8fac-8ea2bcfccd76'
--    -- , '8758e108-…'   <- full id from step 1
--  );
--
-- delete from auth.users
--  where id in (
--    'a3747ca8-de80-46a1-9f83-6ace71464087',
--    '52d168bc-4059-4c81-9115-2cea9f147075',
--    'c3d2930b-f8f6-4d7d-b6f8-5a3af5d9fe7e',
--    '2561e940-881e-447b-a04d-546e2be52937',
--    '72f82818-7259-4ef6-8fac-8ea2bcfccd76'
--    -- , '8758e108-…'
--  );
