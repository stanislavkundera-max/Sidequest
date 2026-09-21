-- Fixes self-service account deletion. Run once, in the Supabase SQL editor.
-- Safe to re-run. URGENT: account deletion is currently broken for everyone.
--
-- WHAT WAS WRONG
--
-- delete_own_account() removed the user's photos with
--
--     delete from storage.objects where bucket_id = 'quest-memory-photos' ...
--
-- Supabase now blocks that for the whole statement — even when no row matches:
--
--     42501  Direct deletion from storage tables is not allowed.
--            Use the Storage API instead.
--
-- So every call failed and the app showed "Could not delete your account".
-- Found 2026-09-21 while verifying round-2 fixes, on a throwaway account with
-- no photos at all. Google Play (and the public deletion page,
-- app/legal/delete-account.tsx) require this to work.
--
-- THE FIX
--
-- 1. The app now deletes the user's photos through the Storage API first
--    (src/repositories/accountRepository.ts), using the existing
--    quest_memory_photos_delete_own policy.
-- 2. This function no longer touches storage.objects.
--
-- ORDER: run this before shipping the build that contains the app half.
-- Running it early is harmless — the old app never gets past this function
-- today anyway. The new app against the OLD function still fails, so the build
-- must not reach testers until this has been run.
--
-- This is the complete function, including the analytics anonymization from
-- 90aee6a — production_prep.sql's copy had drifted and lacked it, so whichever
-- version is live now, running this leaves the right one.

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

  update public.analytics_events
     set properties = properties - 'note' - 'userId'
   where user_id = uid;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- The app half depends on users being able to delete their own photos. This
-- policy already exists in schema.sql; re-created here so this file does not
-- depend on which setup script ran last.
drop policy if exists "quest_memory_photos_delete_own" on storage.objects;
create policy "quest_memory_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'quest-memory-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Sanity check: the function body must no longer mention storage.objects.
select position('storage.objects' in pg_get_functiondef('public.delete_own_account()'::regprocedure)) = 0
  as storage_delete_removed;
