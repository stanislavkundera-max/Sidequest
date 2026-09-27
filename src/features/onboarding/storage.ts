import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { readForUser, writeForUser } from '@/src/lib/deviceStorage';
import {
  ensureProfileForUser,
  getOnboardingStateForUser,
  saveOnboardingStateForUser,
} from '@/src/repositories/profilesRepository';

import type {
  OnboardingCategory,
  OnboardingIntensity,
  OnboardingPace,
  OnboardingPreferences,
  OnboardingScaleAnswer,
  OnboardingState,
} from '@/src/features/onboarding/types';

const DEFAULT_SCALE_ANSWER: OnboardingScaleAnswer = 3;

const DEFAULT_PREFERENCES: OnboardingPreferences = {
  categories: ['nature', 'adventure'],
  intensity: 'balanced',
  pace: 'steady',
  natureConnection: DEFAULT_SCALE_ANSWER,
  isolation: DEFAULT_SCALE_ANSWER,
};
const KEY = '@side_quest_life/onboarding_state_v1';
/** The last state the server gave for an account, so a start without signal still knows it. */
const CACHE_KEY = '@side_quest_life/onboarding_state_cache_v1';

const DEFAULT_STATE: OnboardingState = {
  complete: false,
  preferences: DEFAULT_PREFERENCES,
  completedAt: null,
};

function toUniqueCategories(
  categories: OnboardingCategory[]
): OnboardingCategory[] {
  return Array.from(new Set(categories));
}

function normalizeIntensity(value: unknown): OnboardingIntensity {
  if (value === 'light' || value === 'balanced' || value === 'bold') {
    return value;
  }
  return 'balanced';
}

function normalizePace(value: unknown): OnboardingPace {
  if (value === 'quick' || value === 'steady' || value === 'deep') {
    return value;
  }
  return 'steady';
}

function normalizeScaleAnswer(value: unknown): OnboardingScaleAnswer {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isInteger(n) && n >= 1 && n <= 5) {
    return n as OnboardingScaleAnswer;
  }
  return DEFAULT_SCALE_ANSWER;
}

function parseState(raw: string | null): OnboardingState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      complete: Boolean(parsed.complete),
      preferences: {
        categories: toUniqueCategories(
          (parsed.preferences?.categories ?? DEFAULT_PREFERENCES.categories) as OnboardingCategory[]
        ),
        intensity: normalizeIntensity(parsed.preferences?.intensity),
        pace: normalizePace(parsed.preferences?.pace),
        natureConnection: normalizeScaleAnswer(parsed.preferences?.natureConnection),
        isolation: normalizeScaleAnswer(parsed.preferences?.isolation),
      },
      completedAt:
        typeof parsed.completedAt === 'string' ? parsed.completedAt : null,
    };
  } catch {
    return null;
  }
}

async function getLocalFallbackState(): Promise<OnboardingState> {
  return parseState(await AsyncStorage.getItem(KEY)) ?? DEFAULT_STATE;
}

/**
 * The signed-in user as this device knows them — no network.
 *
 * This used `supabase.auth.getUser()`, which asks the server; without signal it answers "no
 * user", the fallback said "onboarding not done", and people who had finished onboarding long
 * ago were sent back through it on a start in the woods — the place the app sends them (code
 * review 2026-09-27). It also cost a round trip on every Explore and Journey visit.
 */
async function sessionUser(): Promise<{ id: string; email?: string | null } | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

function cacheForUser(userId: string, state: OnboardingState): void {
  writeForUser(CACHE_KEY, JSON.stringify(state), userId).catch(() => undefined);
}

async function saveLocalFallbackState(
  preferences: OnboardingPreferences
): Promise<OnboardingState> {
  const next: OnboardingState = {
    complete: true,
    preferences: {
      categories: toUniqueCategories(preferences.categories),
      intensity: normalizeIntensity(preferences.intensity),
      pace: normalizePace(preferences.pace),
      natureConnection: normalizeScaleAnswer(preferences.natureConnection),
      isolation: normalizeScaleAnswer(preferences.isolation),
    },
    completedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const user = await sessionUser().catch(() => null);
  if (!user) return getLocalFallbackState();
  try {
    const state = await getOnboardingStateForUser(user.id);
    cacheForUser(user.id, state);
    return state;
  } catch {
    const cached = parseState(await readForUser(CACHE_KEY, user.id).catch(() => null));
    if (cached) return cached;
    // Signed in, no signal, nothing cached yet. Treat it as done: sending someone through
    // onboarding again because the network is down is the worse mistake, and the server's
    // answer takes over at the next start with signal.
    return { ...DEFAULT_STATE, complete: true };
  }
}

export async function saveOnboardingState(
  preferences: OnboardingPreferences
): Promise<OnboardingState> {
  const user = await sessionUser().catch(() => null);
  if (!user) {
    return saveLocalFallbackState(preferences);
  }

  const normalized: OnboardingPreferences = {
    categories: toUniqueCategories(preferences.categories),
    intensity: normalizeIntensity(preferences.intensity),
    pace: normalizePace(preferences.pace),
    natureConnection: normalizeScaleAnswer(preferences.natureConnection),
    isolation: normalizeScaleAnswer(preferences.isolation),
  };

  try {
    await ensureProfileForUser({ id: user.id, email: user.email });
    const saved = await saveOnboardingStateForUser(user.id, normalized);
    cacheForUser(user.id, saved);
    return saved;
  } catch {
    const saved = await saveLocalFallbackState(normalized);
    cacheForUser(user.id, saved);
    return saved;
  }
}
