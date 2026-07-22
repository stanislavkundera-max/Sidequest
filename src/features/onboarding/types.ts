export type OnboardingCategory = 'nature' | 'adventure' | 'social' | 'relax';

/** How much of a stretch the person wants — nudges suggestions by quest difficulty. */
export type OnboardingIntensity = 'light' | 'balanced' | 'bold';

/** How much time / what cadence the person wants — maps to quest timeframe. */
export type OnboardingPace = 'quick' | 'steady' | 'deep';

/** 1 (not at all) – 5 (very much) self-report scale. */
export type OnboardingScaleAnswer = 1 | 2 | 3 | 4 | 5;

export type OnboardingPreferences = {
  categories: OnboardingCategory[];
  intensity: OnboardingIntensity;
  pace: OnboardingPace;
  /**
   * Baseline self-report only — does not affect quest recommendation
   * scoring. Kept here so it travels with the rest of onboarding answers
   * and can be re-asked later to measure change over time.
   */
  natureConnection: OnboardingScaleAnswer;
  /** Baseline self-report only — see `natureConnection`. */
  isolation: OnboardingScaleAnswer;
};

export type OnboardingState = {
  complete: boolean;
  preferences: OnboardingPreferences;
  completedAt: string | null;
};
