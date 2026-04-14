import { supabase } from '@/lib/supabase';
import type {
  OnboardingCategory,
  OnboardingIntensity,
  OnboardingPreferences,
  OnboardingState,
} from '@/src/features/onboarding/types';

const DEFAULT_CATEGORIES: OnboardingCategory[] = ['nature', 'adventure'];
const DEFAULT_INTENSITY: OnboardingIntensity = 'balanced';

export type Profile = {
  id: string;
  createdAt: string;
  displayName: string | null;
  onboardingCompleted: boolean;
  intensityPreference: OnboardingIntensity;
  preferredCategories: OnboardingCategory[];
};

function normalizeIntensity(value: unknown): OnboardingIntensity {
  if (value === 'light' || value === 'balanced' || value === 'bold') {
    return value;
  }
  return DEFAULT_INTENSITY;
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
      },
      completedAt: null,
    };
  }

  return {
    complete: profile.onboardingCompleted,
    preferences: {
      categories: profile.preferredCategories,
      intensity: profile.intensityPreference,
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
  };
  let { data, error } = await supabase
    .from('profiles')
    .update(primaryUpdate)
    .eq('id', userId)
    .select('*')
    .single();

  // Backward-compatible fallback for projects that have not applied
  // the newest schema column yet.
  if (
    error &&
    typeof error.message === 'string' &&
    error.message.includes('preferred_categories')
  ) {
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
    },
    completedAt: profile.createdAt,
  };
}
