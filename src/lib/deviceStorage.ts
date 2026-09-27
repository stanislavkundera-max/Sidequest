import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSessionStore } from '@/stores/session';

/**
 * Device-local state that belongs to an account, not to the phone.
 *
 * Quests seen, quests someone can't do where they live, map categories revealed, the
 * notification setting: all of it sat under one key per phone, so a second account on the same
 * phone — or a new guest account after a sign-out — inherited the first one's choices (code
 * review 2026-09-27). Each key now carries the account id.
 *
 * Values written before that are handed to the first account that reads them, once, and the
 * old key is removed. On a phone with one account, which is every phone in the closed test,
 * nothing is lost.
 */

function scopedKey(base: string, userId: string): string {
  return `${base}:${userId}`;
}

function resolveUserId(userId?: string | null): string | null {
  return userId ?? useSessionStore.getState().user?.id ?? null;
}

/** The value for this account, or null. With no account there is nothing to read. */
export async function readForUser(base: string, userId?: string | null): Promise<string | null> {
  const uid = resolveUserId(userId);
  if (!uid) return null;
  const own = await AsyncStorage.getItem(scopedKey(base, uid));
  if (own != null) return own;
  const legacy = await AsyncStorage.getItem(base);
  if (legacy == null) return null;
  await AsyncStorage.setItem(scopedKey(base, uid), legacy);
  await AsyncStorage.removeItem(base);
  return legacy;
}

/**
 * Stores the value for this account. With no account it is dropped — there is no one to keep it
 * for. A value still under the old shared key is removed: this account now has its own, and left
 * there it would be handed to the next account that reads.
 */
export async function writeForUser(
  base: string,
  value: string,
  userId?: string | null
): Promise<void> {
  const uid = resolveUserId(userId);
  if (!uid) return;
  await AsyncStorage.setItem(scopedKey(base, uid), value);
  await AsyncStorage.removeItem(base);
}
