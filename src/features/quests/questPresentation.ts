import type { Quest, QuestDifficulty, QuestEnergyLevel, QuestTimeframe } from '@/src/types/quest';

export function difficultyToEnergy(difficulty: QuestDifficulty): QuestEnergyLevel {
  switch (difficulty) {
    case 'easy':
      return 'low';
    case 'medium':
      return 'medium';
    case 'hard':
      return 'high';
    default:
      return 'medium';
  }
}

export function energyLevelLabel(level: QuestEnergyLevel): string {
  switch (level) {
    case 'low':
      return 'Low energy';
    case 'medium':
      return 'Medium energy';
    case 'high':
      return 'Higher energy';
    default:
      return 'Medium energy';
  }
}

/** Gentle anchor phrasing — no deadlines or pressure. */
export function anchorMomentForQuest(timeframe: QuestTimeframe): string {
  switch (timeframe) {
    case 'weekly':
      return 'This week, when you have a pocket of time';
    case 'monthly':
      return 'Sometime this month, without rushing';
    case 'yearly':
      return 'Across the year, when the season feels right';
    default:
      return 'When the moment feels right';
  }
}

export function deriveQuestPresentation(quest: Quest) {
  const energyLevel = difficultyToEnergy(quest.difficulty);
  return {
    energyLevel,
    energyLabel: energyLevelLabel(energyLevel),
    anchorMoment: anchorMomentForQuest(quest.timeframe),
  };
}
