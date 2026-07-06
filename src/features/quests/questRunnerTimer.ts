import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'sidequestlife:questRunnerTimer:';

/**
 * Wall-clock step timers for the guided runner.
 *
 * We persist only `startedAt`; elapsed time is always derived from the real
 * clock, so timers keep "running" while the phone is locked, the app is
 * backgrounded, or even after a restart. One timer per (userQuestId, stepId).
 */

function keyFor(userQuestId: string, stepId: string): string {
  return `${KEY_PREFIX}${userQuestId}:${stepId}`;
}

export async function readStepTimerStart(
  userQuestId: string,
  stepId: string
): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userQuestId, stepId));
    if (!raw?.trim()) return null;
    const ts = Number(raw);
    if (!Number.isFinite(ts) || ts <= 0) return null;
    // Clock skew guard: a start in the future would freeze the timer forever.
    if (ts > Date.now()) return null;
    return ts;
  } catch {
    return null;
  }
}

/** Starts the timer if not already running; returns the effective startedAt. */
export async function startStepTimer(
  userQuestId: string,
  stepId: string
): Promise<number> {
  const existing = await readStepTimerStart(userQuestId, stepId);
  if (existing != null) return existing;
  const now = Date.now();
  await AsyncStorage.setItem(keyFor(userQuestId, stepId), String(now));
  return now;
}

export async function clearStepTimer(userQuestId: string, stepId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(userQuestId, stepId));
  } catch {
    // Best effort — a stale key only costs a few bytes.
  }
}

export function elapsedSeconds(startedAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

/** mm:ss for short timers, h:mm:ss above an hour. */
export function formatTimerClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
}
