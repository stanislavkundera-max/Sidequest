import { supabase } from '@/lib/supabase';
import type {
  OnboardingCategory,
  OnboardingFocus,
  OnboardingIntensity,
  OnboardingPace,
  OnboardingPreferences,
  OnboardingState,
} from '@/src/features/onboarding/types';

const DEFAULT_CATEGORIES: OnboardingCategory[] = ['nature', 'adventure'];
const DEFAULT_INTENSITY: OnboardingIntensity = 'balanced';
const DEFAULT_PACE: OnboardingPace = 'steady';
const DEFAULT_FOCUS: OnboardingFocus = 'comfort_zone';

export type Profile = {
  id: string;
  createdAt: string;
  displayName: string | null;
  onboardingCompleted: boolean;
  intensityPreference: OnboardingIntensity;
  preferredCategories: OnboardingCategory[];
  pacePreference: OnboardingPace;
  focusPreference: OnboardingFocus;
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

function normalizeFocus(value: unknown): OnboardingFocus {
  if (
    value === 'comfort_zone' ||
    value === 'calm' ||
    value === 'connection' ||
    value === 'wonder'
  ) {
    return value;
  }
  return DEFAULT_FOCUS;
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
    focusPreference: normalizeFocus(row.focus_preference),
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
        focus: DEFAULT_FOCUS,
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
      focus: profile.focusPreference,
    },
    completedAt: profile.onboardingCompleted ? profile.createdAt : null,
  };
}

export async function saveOnboardingStateForUser(
  userId: string,
  preferences: OnboardingPreferences
): Promise<OnboardingState> {
  const primaryUpdate = {
    onboarding_completed: true,
    intensity_preference: preferences.intensity,
    preferred_categories: preferences.categories,
    pace_preference: preferences.pace,
    focus_preference: preferences.focus,
  };
  let { data, error } = await supabase
    .from('profiles')
    .update(primaryUpdate)
    .eq('id', userId)
    .select('*')
    .single();

  // Backward-compatible fallback for projects that have not applied the
  // newest schema columns yet (preferred_categories / pace / focus).
  if (error && typeof error.message === 'string' && isMissingColumnError(error.message)) {
    const fallback = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        intensity_preference: preferences.intensity,
      })
      .eq('id', userId)
      .select('*')
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  const profile = mapProfileRow(data);
  return {
    complete: profile.onboardingCompleted,
    preferences: {
      categories: profile.preferredCategories,
      intensity: profile.intensityPreference,
      pace: profile.pacePreference,
      focus: profile.focusPreference,
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

function isMissingColumnError(message: string): boolean {
  return (
    message.includes('preferred_categories') ||
    message.includes('pace_preference') ||
    message.includes('focus_preference')
  );
}
