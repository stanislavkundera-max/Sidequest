import { supabase } from '@/lib/supabase';
import type {
  OnboardingCategory,
  OnboardingIntensity,
  OnboardingPace,
  OnboardingPreferences,
  OnboardingScaleAnswer,
  OnboardingState,
} from '@/src/features/onboarding/types';

const DEFAULT_CATEGORIES: OnboardingCategory[] = ['nature', 'adventure'];
const DEFAULT_INTENSITY: OnboardingIntensity = 'balanced';
const DEFAULT_PACE: OnboardingPace = 'steady';
const DEFAULT_SCALE_ANSWER: OnboardingScaleAnswer = 3;

export type Profile = {
  id: string;
  createdAt: string;
  displayName: string | null;
  onboardingCompleted: boolean;
  intensityPreference: OnboardingIntensity;
  preferredCategories: OnboardingCategory[];
  pacePreference: OnboardingPace;
  natureConnection: OnboardingScaleAnswer;
  isolation: OnboardingScaleAnswer;
};

function normalizeIntensity(value: unknown): OnboardingIntensity {
  if (value === 'light' || value === 'balanced' || value === 'bold') {
    return value;
  }
  return DEFAULT_INTENSITY;
}

function normalizePace(value: unknown): OnboardingPace {
  if (value === 'quick' || value === 'steady' || value === 'deep') {
    return value;
  }
  return DEFAULT_PACE;
}

function normalizeScaleAnswer(value: unknown): OnboardingScaleAnswer {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isInteger(n) && n >= 1 && n <= 5) {
    return n as OnboardingScaleAnswer;
  }
  return DEFAULT_SCALE_ANSWER;
}

function normalizeCategories(value: unknown): OnboardingCategory[] {
  if (!Array.isArray(value)) return DEFAULT_CATEGORIES;
  const categories = value.filter(
    (item): item is OnboardingCategory =>
      item === 'nature' ||
      item === 'adventure' ||
      item === 'social' ||
      item === 'relax'
  );
  return categories.length > 0 ? Array.from(new Set(categories)) : DEFAULT_CATEGORIES;
}

function mapProfileRow(row: any): Profile {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    displayName: (row.display_name as string | null) ?? null,
    onboardingCompleted: Boolean(row.onboarding_completed),
    intensityPreference: normalizeIntensity(row.intensity_preference),
    preferredCategories: normalizeCategories(row.preferred_categories),
    pacePreference: normalizePace(row.pace_preference),
    natureConnection: normalizeScaleAnswer(row.nature_connection),
    isolation: normalizeScaleAnswer(row.isolation_score),
  };
}

export async function ensureProfileForUser(user: {
  id: string;
  email?: string | null;
}): Promise<void> {
  const displayName =
    user.email?.split('@')[0]?.slice(0, 64) ||
    `Explorer-${user.id.slice(0, 8)}`;
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      display_name: displayName,
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProfileRow(data);
}

export async function getOnboardingStateForUser(
  userId: string
): Promise<OnboardingState> {
  const profile = await getProfile(userId);
  if (!profile) {
    return {
      complete: false,
      preferences: {
        categories: DEFAULT_CATEGORIES,
        intensity: DEFAULT_INTENSITY,
        pace: DEFAULT_PACE,
        natureConnection: DEFAULT_SCALE_ANSWER,
        isolation: DEFAULT_SCALE_ANSWER,
      },
      completedAt: null,
    };
  }

  return {
    complete: profile.onboardingCompleted,
    preferences: {
      categories: profile.preferredCategories,
      intensity: profile.intensityPreference,
      pace: profile.pacePreference,
      natureConnection: profile.natureConnection,
      isolation: profile.isolation,
    },
    completedAt: profile.onboardingCompleted ? profile.createdAt : null,
  };
}

/**
 * Tries each payload in order, falling back to the previous (more widely
 * compatible) one whenever the error looks like a missing-column error —
 * so older Supabase schemas that haven't run the latest migration yet keep
 * working instead of failing onboarding entirely.
 */
async function updateProfileWithFallback(
  userId: string,
  payloadAttempts: Record<string, unknown>[]
): Promise<any> {
  let lastError: { message?: string } | null = null;
  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();
    if (!error) return data;
    if (!isMissingColumnError(error.message)) throw error;
    lastError = error;
  }
  throw lastError;
}

export async function saveOnboardingStateForUser(
  userId: string,
  preferences: OnboardingPreferences
): Promise<OnboardingState> {
  const data = await updateProfileWithFallback(userId, [
    {
      onboarding_completed: true,
      intensity_preference: preferences.intensity,
      preferred_categories: preferences.categories,
      pace_preference: preferences.pace,
      nature_connection: preferences.natureConnection,
      isolation_score: preferences.isolation,
    },
    // Fallback: nature_connection/isolation columns not migrated yet.
    {
      onboarding_completed: true,
      intensity_preference: preferences.intensity,
      preferred_categories: preferences.categories,
      pace_preference: preferences.pace,
    },
    // Fallback: pace/categories columns not migrated yet either.
    {
      onboarding_completed: true,
      intensity_preference: preferences.intensity,
    },
  ]);

  const profile = mapProfileRow(data);
  return {
    complete: profile.onboardingCompleted,
    preferences: {
      categories: profile.preferredCategories,
      intensity: profile.intensityPreference,
      pace: profile.pacePreference,
      natureConnection: profile.natureConnection,
      isolation: profile.isolation,
    },
    completedAt: profile.createdAt,
  };
}

/** Admin tool: clears the completed flag so `/onboarding` runs again from step one. */
export async function resetOnboardingForUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: false })
    .eq('id', userId);
  if (error) throw error;
}

function isMissingColumnError(message?: string): boolean {
  if (!message) return false;
  return (
    message.includes('preferred_categories') ||
    message.includes('pace_preference') ||
    message.includes('nature_connection') ||
    message.includes('isolation_score')
  );
}
