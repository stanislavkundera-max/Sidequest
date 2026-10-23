/**
 * When the feedback pop-up (redesign screen 39) may ask on its own — task 60, decided by Standa
 * 2026-10-22. Pure rules, no storage, so they can be unit-tested; `feedbackPrompt.ts` keeps the
 * state on the phone and `FeedbackPromptHost` picks the moment.
 *
 * 1. Only after the app was opened on three different days (three opens in one afternoon count
 *    once) and the person has done something — a quest step or a memory — so there is something
 *    to say. Asking before that gets empty answers.
 * 2. At most twice in total. After "Not now" it may ask once more, no sooner than 30 days later.
 *    After sending — from the pop-up or from Settings — never again. Asking more turns into the
 *    nagging AGENTS.md rules out.
 */

export type FeedbackPromptState = {
  /** Local calendar days the app was opened on, oldest first; only the first three are kept. */
  openDays: string[];
  /** How many times the pop-up has asked on its own. */
  asks: number;
  /** When it last asked, in ms. */
  lastAskedAt: number | null;
  /** Feedback was sent — the pop-up never asks again. */
  sent: boolean;
};

export const EMPTY_FEEDBACK_PROMPT_STATE: FeedbackPromptState = {
  openDays: [],
  asks: 0,
  lastAskedAt: null,
  sent: false,
};

export const OPEN_DAYS_NEEDED = 3;
export const MAX_ASKS = 2;
export const ASK_AGAIN_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

/** The phone's own calendar day, not UTC: an evening open and the next morning are two days. */
export function localDayKey(at: Date): string {
  const m = String(at.getMonth() + 1).padStart(2, '0');
  const d = String(at.getDate()).padStart(2, '0');
  return `${at.getFullYear()}-${m}-${d}`;
}

export function withOpenDay(state: FeedbackPromptState, now: Date): FeedbackPromptState {
  const day = localDayKey(now);
  if (state.openDays.includes(day) || state.openDays.length >= OPEN_DAYS_NEEDED) return state;
  return { ...state, openDays: [...state.openDays, day] };
}

export function isFeedbackPromptDue(
  state: FeedbackPromptState,
  hasSomethingToSay: boolean,
  now: number
): boolean {
  if (state.sent || state.asks >= MAX_ASKS) return false;
  if (state.openDays.length < OPEN_DAYS_NEEDED || !hasSomethingToSay) return false;
  if (state.asks === 0) return true;
  return state.lastAskedAt != null && now - state.lastAskedAt >= ASK_AGAIN_AFTER_MS;
}

/** Counted when it is shown, so closing the app on the pop-up still uses up an ask. */
export function withAsk(state: FeedbackPromptState, now: number): FeedbackPromptState {
  return { ...state, asks: state.asks + 1, lastAskedAt: now };
}

export function withSent(state: FeedbackPromptState): FeedbackPromptState {
  return { ...state, sent: true };
}

/** Reads what was stored, falling back field by field so a damaged value never throws. */
export function parseFeedbackPromptState(raw: string | null): FeedbackPromptState {
  if (!raw) return EMPTY_FEEDBACK_PROMPT_STATE;
  try {
    const v = JSON.parse(raw) as Partial<FeedbackPromptState> | null;
    if (!v || typeof v !== 'object') return EMPTY_FEEDBACK_PROMPT_STATE;
    return {
      openDays: Array.isArray(v.openDays)
        ? v.openDays.filter((d): d is string => typeof d === 'string').slice(0, OPEN_DAYS_NEEDED)
        : [],
      asks: typeof v.asks === 'number' && Number.isFinite(v.asks) ? v.asks : 0,
      lastAskedAt: typeof v.lastAskedAt === 'number' ? v.lastAskedAt : null,
      sent: v.sent === true,
    };
  } catch {
    return EMPTY_FEEDBACK_PROMPT_STATE;
  }
}
