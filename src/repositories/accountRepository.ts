import { isAuthError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { deleteAllPhotosForUser } from '@/src/repositories/photoRepository';

/**
 * Turning a guest into an account — the same account, so every quest, memory and photo stays.
 *
 * Everyone starts as a guest (app/index.tsx signs in anonymously). A guest who signed out lost
 * everything for good, and the dialog said "You can sign back in anytime"; the sign-in screen's
 * "Create account" made a *new*, empty account (code review 2026-09-27).
 *
 * Supabase's order is fixed: add the e-mail, confirm it, then set a password — a guest cannot
 * set a password before the e-mail is confirmed. The user id never changes along the way.
 */

/** Step 1: attach the e-mail. Supabase sends a confirmation e-mail to it. */
export async function addEmailToGuestAccount(email: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: email.trim() });
  if (error) throw error;
}

/** Sends the confirmation e-mail again. */
export async function resendGuestAccountEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'email_change', email: email.trim() });
  if (error) throw error;
}

/**
 * Step 2, by code: confirms the e-mail with the code from the confirmation e-mail. The code is
 * only in the e-mail once the "Change email address" template includes {{ .Token }} — the link
 * works either way (see `refreshGuestAccount`).
 */
export async function confirmGuestEmailWithCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: 'email_change',
  });
  if (error) throw error;
}

/**
 * Step 2, by link: after the link was tapped in the browser, asks the server again. True when the
 * e-mail is confirmed and the account is no longer a guest.
 */
export async function refreshGuestAccount(): Promise<boolean> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  const user = data.user ?? data.session?.user ?? null;
  return Boolean(user && !user.is_anonymous && user.email);
}

/** Step 3: the password, possible once the e-mail is confirmed. */
export async function setAccountPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/** Plain-language messages for what can go wrong while saving a guest account. */
export function describeAccountSaveError(e: unknown): string {
  const code = isAuthError(e) ? e.code : undefined;
  const message = e instanceof Error ? e.message : '';
  if (code === 'email_exists' || /already (been )?registered/i.test(message)) {
    return 'That e-mail already has an account. Your quests are in this guest account, so use a different e-mail to keep them.';
  }
  // The built-in Supabase mailer refuses any address outside the project team; until the project
  // has its own SMTP, every guest gets this. Their data is untouched — say so, and that it is not
  // their doing (docs/play-store-roadmap.md, "Custom SMTP").
  if (code === 'email_address_not_authorized' || /not authorized/i.test(message)) {
    return "We can't send e-mails yet — that's on our side, not yours. Your quests and memories stay safe in this guest account; try again in a few days.";
  }
  if (code === 'over_email_send_rate_limit' || /rate limit/i.test(message)) {
    return 'Too many e-mails in a short time. Wait a few minutes, then try again.';
  }
  if (code === 'email_address_invalid' || /invalid format|validate email/i.test(message)) {
    return 'That does not look like an e-mail address.';
  }
  if (code === 'otp_expired' || /token has expired or is invalid/i.test(message)) {
    return 'That code did not work. Check it, or send the e-mail again for a new one.';
  }
  if (code === 'weak_password' || /password/i.test(message)) {
    return message || 'Choose a stronger password.';
  }
  if (e instanceof TypeError || /network|fetch/i.test(message)) {
    return 'No connection. Try again when you have signal.';
  }
  return message || 'Something went wrong. Try again in a moment.';
}

/**
 * Permanently deletes the signed-in user's account and all their data
 * (profile, quests, memories, photos; analytics events are anonymized, not
 * deleted). Photos go first through the Storage API (see `deleteAllPhotosForUser`),
 * then the `delete_own_account` Postgres function (see `supabase/schema.sql`)
 * removes the rest. It operates on `auth.uid()` only — there is no way to pass
 * a different user id, by design. Irreversible.
 */
export async function deleteOwnAccount(): Promise<void> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth.user?.id;
  if (!userId) throw new Error('Not signed in.');

  await deleteAllPhotosForUser(userId);

  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
}
