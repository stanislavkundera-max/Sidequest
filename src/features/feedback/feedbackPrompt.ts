import { readForUser, writeForUser } from '@/src/lib/deviceStorage';
import { logError } from '@/src/lib/monitoring/errorLogger';

import {
  isFeedbackPromptDue,
  parseFeedbackPromptState,
  withAsk,
  withOpenDay,
  withSent,
  type FeedbackPromptState,
} from './feedbackPromptRules';

/**
 * The feedback pop-up's memory (task 60): kept on the phone, per account, so it needs no server.
 * The rules themselves are in `feedbackPromptRules.ts`.
 */

const KEY = 'sidequestlife:feedbackPrompt:v1';

async function read(userId?: string): Promise<FeedbackPromptState> {
  return parseFeedbackPromptState(await readForUser(KEY, userId));
}

async function update(
  change: (s: FeedbackPromptState) => FeedbackPromptState,
  userId?: string
): Promise<void> {
  try {
    const before = await read(userId);
    const after = change(before);
    if (after !== before) await writeForUser(KEY, JSON.stringify(after), userId);
  } catch (e) {
    logError('feedbackPrompt.update', e);
  }
}

/** The app was opened, or came back to the foreground. */
export function recordAppOpenDay(userId: string): Promise<void> {
  return update((s) => withOpenDay(s, new Date()), userId);
}

export async function feedbackPromptDue(hasSomethingToSay: boolean): Promise<boolean> {
  try {
    return isFeedbackPromptDue(await read(), hasSomethingToSay, Date.now());
  } catch {
    return false;
  }
}

export function recordFeedbackPromptShown(): Promise<void> {
  return update((s) => withAsk(s, Date.now()));
}

/** Sent from the pop-up or from Settings — either way, the pop-up stops asking. */
export function recordFeedbackSent(): Promise<void> {
  return update(withSent);
}
