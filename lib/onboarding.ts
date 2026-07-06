import { supabase } from '@/lib/supabase';
import {
  getOnboardingState,
  saveOnboardingState,
  type OnboardingPreferences,
  type OnboardingState,
} from '@/src/features/onboarding';
import { ensureProfileForUser, resetOnboardingForUser } from '@/src/repositories/profilesRepository';

export type { OnboardingPreferences, OnboardingState };

export async function getOnboardingComplete(): Promise<boolean> {
  const state = await getOnboardingState();
  return state.complete;
}

export async function setOnboardingComplete(
  preferences?: OnboardingPreferences
): Promise<void> {
  await saveOnboardingState(
    preferences ?? {
      categories: ['nature', 'adventure'],
      intensity: 'balanced',
      pace: 'steady',
      focus: 'comfort_zone',
    }
  );
}

/** Admin tool: clears onboarding_completed so `/onboarding` can be walked again. */
export async function resetOnboardingComplete(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in with your admin account to redo onboarding.');
  await ensureProfileForUser({ id: user.id, email: user.email });
  await resetOnboardingForUser(user.id);
}

export { getOnboardingState, saveOnboardingState };
