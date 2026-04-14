import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import {
  ensureProfileForUser,
  getOnboardingStateForUser,
  saveOnboardingStateForUser,
} from '@/src/repositories/profilesRepository';

import type {
  OnboardingCategory,
  OnboardingIntensity,
  OnboardingPreferences,
  OnboardingState,
} from '@/src/features/onboarding/types';

const DEFAULT_PREFERENCES: OnboardingPreferences = {
  categories: ['nature', 'adventure'],
  intensity: 'balanced',
};
const KEY = '@side_quest_life/onboarding_state_v1';

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

async function getLocalFallbackState(): Promise<OnboardingState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      complete: Boolean(parsed.complete),
      preferences: {
        categories: toUniqueCategories(
          (parsed.preferences?.categories ?? DEFAULT_PREFERENCES.categories) as OnboardingCategory[]
        ),
        intensity: normalizeIntensity(parsed.preferences?.intensity),
      },
      completedAt:
        typeof parsed.completedAt === 'string' ? parsed.completedAt : null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

async function saveLocalFallbackState(
  preferences: OnboardingPreferences
): Promise<OnboardingState> {
  const next: OnboardingState = {
    complete: true,
    preferences: {
      categories: toUniqueCategories(preferences.categories),
      intensity: normalizeIntensity(preferences.intensity),
    },
    completedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return getLocalFallbackState();
    await ensureProfileForUser({ id: user.id, email: user.email });
    return await getOnboardingStateForUser(user.id);
  } catch {
    return getLocalFallbackState();
  }
}

export async function saveOnboardingState(
  preferences: OnboardingPreferences
): Promise<OnboardingState> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return saveLocalFallbackState(preferences);
  }

  const normalized: OnboardingPreferences = {
    categories: toUniqueCategories(preferences.categories),
    intensity: normalizeIntensity(preferences.intensity),
  };

  try {
    await ensureProfileForUser({ id: user.id, email: user.email });
    return await saveOnboardingStateForUser(user.id, normalized);
  } catch {
    return saveLocalFallbackState(normalized);
  }
}
