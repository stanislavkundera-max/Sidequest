export type QuestTimeframe = 'weekly' | 'monthly' | 'yearly';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export type SuggestedProofType = 'none' | 'text' | 'photo';

/** One actionable step in a quest journey (catalog content). */
export type QuestActionStep = {
  id: string;
  title: string;
  detail?: string;
  estimateMinutes?: number;
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
};

export type UserQuestStatus = 'active' | 'completed';

/** stepId -> ISO timestamp when checked (absent = not done). */
export type UserQuestStepProgress = Record<string, string>;

export type UserQuest = {
  id: string;
  questId: string;
  status: UserQuestStatus;
  startedAt: string;
  completedAt: string | null;
  note: string | null;
  photoUri: string | null;
  stepProgress: UserQuestStepProgress;
};
