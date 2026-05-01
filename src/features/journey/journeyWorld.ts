import type { UserQuest } from '@/src/types/quest';
import type { Quest } from '@/src/types/quest';
import { Theme } from '@/constants/Theme';

export type JourneyCategory = 'nature' | 'social' | 'adventure' | 'relax';

export type WorldState = Record<JourneyCategory, { count: number; level: number }>;

export type JourneyVisualState = {
  /** Subtle background tint layers (top to bottom). */
  environmentLayers: Array<{ color: string; opacity: number }>;
  /** How much the path can sway horizontally (pixels). */
  pathSwayAmplitude: number;
  /** Base path styling. */
  pathColor: string;
  pathWidth: number;
  /** Node styling. */
  currentNodeRingColor: string;
};

const CATEGORY_ID_TO_JOURNEY: Record<string, JourneyCategory> = {
  'cat-nature': 'nature',
  'cat-social': 'social',
  'cat-adventure': 'adventure',
  'cat-relax': 'relax',
};

export function getCategoryLevel(count: number): number {
  if (count >= 11) return 3;
  if (count >= 6) return 2;
  if (count >= 3) return 1;
  return 0;
}

export function getWorldStateFromCompletedQuests(params: {
  completedUserQuests: UserQuest[];
  questCatalog: Quest[];
}): WorldState {
  const questById = new Map(params.questCatalog.map((q) => [q.id, q]));
  const counts: Record<JourneyCategory, number> = {
    nature: 0,
    social: 0,
    adventure: 0,
    relax: 0,
  };

  for (const uq of params.completedUserQuests) {
    const quest = questById.get(uq.questId);
    if (!quest) continue;
    const journeyCategory = CATEGORY_ID_TO_JOURNEY[quest.categoryId];
    if (!journeyCategory) continue;
    counts[journeyCategory] += 1;
  }

  return {
    nature: { count: counts.nature, level: getCategoryLevel(counts.nature) },
    social: { count: counts.social, level: getCategoryLevel(counts.social) },
    adventure: { count: counts.adventure, level: getCategoryLevel(counts.adventure) },
    relax: { count: counts.relax, level: getCategoryLevel(counts.relax) },
  };
}

export function getJourneyVisualState(worldState: WorldState): JourneyVisualState {
  // Slightly stronger category veils so the diorama reads at a glance (still calm).
  const natureOpacity = [0, 0.055, 0.09, 0.13][worldState.nature.level] ?? 0;
  const socialOpacity = [0, 0.05, 0.085, 0.12][worldState.social.level] ?? 0;
  const relaxOpacity = [0, 0.045, 0.075, 0.11][worldState.relax.level] ?? 0;

  const adventureLevel = worldState.adventure.level;
  const pathSwayAmplitude = [0, 6, 10, 14][adventureLevel] ?? 0;
  const pathWidth = [3, 3, 4, 4][adventureLevel] ?? 3;

  return {
    environmentLayers: [
      // Nature: a green veil
      { color: Theme.nature, opacity: natureOpacity },
      // Social: warm light (soft amber)
      { color: '#b77a4a', opacity: socialOpacity },
      // Relax: soft lavender haze
      { color: Theme.relax, opacity: relaxOpacity },
    ],
    pathSwayAmplitude,
    pathColor: Theme.border,
    pathWidth,
    currentNodeRingColor: Theme.accent,
  };
}

