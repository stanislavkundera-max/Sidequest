export type QuestTimeframe = 'weekly' | 'monthly' | 'yearly';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export type SuggestedProofType = 'none' | 'text' | 'photo';

/** Hub grouping for suggested picks (catalog + optional DB `suggested_group`). */
export type QuestSuggestedGroup =
  | 'do_now'
  | 'low_energy'
  | 'outside'
  | 'social'
  | 'weekend';

/** One actionable step in a quest journey (catalog content). */
export type QuestActionStep = {
  id: string;
  title: string;
  detail?: string;
  /** Soft nudge for the runner—optional in JSON; catalog fills when missing. */
  tip?: string;
  estimateMinutes?: number;
  /**
   * Optional guided action the app can launch for this step.
   * When present, the quest runner uses this to lead the user through the step.
   */
  action?: QuestStepAction;
  /**
   * How the runner asks the user to actually do this step.
   * Missing = plain confirm. Calendar steps keep using `action`.
   */
  interaction?: QuestStepInteraction;
};

/**
 * Runner interaction per step — "smart friction" so completing a step
 * takes roughly as much effort as doing it (see docs/quest-runner.md).
 */
export type QuestStepInteraction =
  | { kind: 'confirm' }
  | {
      kind: 'timer';
      /** Step unlocks only after this many seconds have elapsed. */
      minSeconds: number;
      /** Short line shown while the timer runs. */
      runningHint?: string;
    }
  | {
      kind: 'input';
      /** Question the user answers in writing. */
      prompt: string;
      /** Minimum trimmed length before the step can complete (default 20). */
      minChars?: number;
      placeholder?: string;
    }
  | {
      kind: 'counter';
      /** What to collect, e.g. "Name each sound you noticed". */
      prompt: string;
      /** How many named items are required. */
      count: number;
      /** Singular noun for one item, e.g. "sound", "plant". */
      itemLabel?: string;
    }
  | {
      kind: 'photo';
      /** What to capture. */
      prompt?: string;
    };

export type QuestStepAction =
  | {
      kind: 'calendar';
      template?: {
        /** Suggested title for the calendar event. Defaults to quest/step title. */
        title?: string;
        /** Suggested notes/description. */
        notes?: string;
        /** Suggested duration in minutes (fallback: step estimate, else 30). */
        durationMinutes?: number;
      };
    };

export type Quest = {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  timeframe: QuestTimeframe;
  difficulty: QuestDifficulty;
  estimatedDurationMinutes: number;
  promptForReflection: string;
  suggestedProofType: SuggestedProofType;
  /** Short narrative frame above the checklist (optional). */
  journeyIntro?: string;
  /** Ordered steps the user can check off while the quest is active. */
  actionSteps: QuestActionStep[];
  /** When false, excluded from suggested picks. Omitted = treat as active in catalog. */
  isActive?: boolean;
  suggestedGroup?: QuestSuggestedGroup | null;
};

/** Persisted user ↔ quest engagement (suggested is virtual UI only). */
export type UserQuestStatus =
  | 'chosen'
  | 'active'
  | 'saved_for_later'
  | 'completed'
  | 'dismissed';

export type UserQuestStepEvidence =
  | {
      kind: 'calendar';
      eventId: string;
    }
  | {
      /** User confirmed a non-calendar step in the guided runner (no device evidence). */
      kind: 'self_attest';
    }
  | {
      /** Backwards-compatible placeholder for pre-runner manual progress. */
      kind: 'legacy_manual';
    }
  | {
      /** A step-timer ran to its minimum duration. */
      kind: 'timer';
      seconds: number;
    }
  | {
      /** Written answer collected during the run. */
      kind: 'text';
      text: string;
    }
  | {
      /** Named items collected during the run (counter steps). */
      kind: 'items';
      items: string[];
    }
  | {
      /** Photo captured/picked during the run (local URI; memory upload happens later). */
      kind: 'photo';
      photoUri: string;
    };

/** stepId -> completion + evidence (absent = not done). */
export type UserQuestStepProgress = Record<
  string,
  {
    completedAt: string;
    evidence: UserQuestStepEvidence;
  }
>;

export type QuestEnergyLevel = 'low' | 'medium' | 'high';

export type UserQuest = {
  id: string;
  questId: string;
  status: UserQuestStatus;
  startedAt: string;
  completedAt: string | null;
  updatedAt?: string;
  savedAt?: string | null;
  dismissedAt?: string | null;
  memoryId?: string | null;
  note: string | null;
  photoUri: string | null;
  stepProgress: UserQuestStepProgress;
  /** Denormalized from catalog at last transition — UI fallback if catalog changes. */
  snapshotTitle?: string | null;
  snapshotShort?: string | null;
  snapshotCategoryId?: string | null;
  snapshotEstimatedMinutes?: number | null;
  energyLevel?: QuestEnergyLevel | null;
  anchorMoment?: string | null;
};
