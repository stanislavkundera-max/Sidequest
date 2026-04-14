export type OnboardingCategory = 'nature' | 'adventure' | 'social' | 'relax';

export type OnboardingIntensity = 'light' | 'balanced' | 'bold';

export type OnboardingPreferences = {
  categories: OnboardingCategory[];
  intensity: OnboardingIntensity;
};

export type OnboardingState = {
  complete: boolean;
  preferences: OnboardingPreferences;
  completedAt: string | null;
};
