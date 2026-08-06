import { supabase } from '@/lib/supabase';

/**
 * Permanently deletes the signed-in user's account and all their data
 * (profile, quests, memories; analytics events are anonymized, not deleted).
 * Calls the `delete_own_account` Postgres function (see `supabase/schema.sql`),
 * which operates on `auth.uid()` only — there is no way to pass a different
 * user id, by design. Irreversible.
 */
export async function deleteOwnAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
}
