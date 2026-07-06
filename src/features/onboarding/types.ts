export type OnboardingCategory = 'nature' | 'adventure' | 'social' | 'relax';

export type OnboardingIntensity = 'light' | 'balanced' | 'bold';

/** How much time / what cadence the person wants — maps to quest timeframe. */
export type OnboardingPace = 'quick' | 'steady' | 'deep';

/** What the person is mainly after — softly nudges suggestion ordering. */
export type OnboardingFocus = 'comfort_zone' | 'calm' | 'connection' | 'wonder';

export type OnboardingPreferences = {
  categories: OnboardingCategory[];
  intensity: OnboardingIntensity;
  pace: OnboardingPace;
  focus: OnboardingFocus;
};

export type OnboardingState = {
  complete: boolean;
  preferences: OnboardingPreferences;
  completedAt: string | null;
};
