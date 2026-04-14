import {
  getOnboardingState,
  saveOnboardingState,
  type OnboardingPreferences,
  type OnboardingState,
} from '@/src/features/onboarding';

export type { OnboardingPreferences, OnboardingState };

export async function getOnboardingComplete(): Promise<boolean> {
  const state = await getOnboardingState();
  return state.complete;
}

export async function setOnboardingComplete(
  preferences?: OnboardingPreferences
): Promise<void> {
  await saveOnboardingState(
    preferences ?? { categories: ['nature', 'adventure'], intensity: 'balanced' }
  );
}

export { getOnboardingState, saveOnboardingState };
