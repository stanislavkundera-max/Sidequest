import type { JourneyCategory } from '@/src/features/journey/journeyWorld';

export type JourneyPathNode = {
  userQuestId: string;
  questId: string;
  categoryId: string;
  memory?: { id: string; title: string; hasPhoto: boolean };
  /** Active quests render dimmer markers ahead on the same path. Omitted = completed. */
  journeyStatus?: 'completed' | 'active';
};

const CATEGORY_MAP: Record<string, JourneyCategory | undefined> = {
  'cat-nature': 'nature',
  'cat-social': 'social',
  'cat-adventure': 'adventure',
  'cat-relax': 'relax',
};

export function journeyPathCategoryForId(categoryId: string): JourneyCategory | undefined {
  return CATEGORY_MAP[categoryId];
}

export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function trailWidthAtT(t: number) {
  return mix(0.28, 0.025, smoothstep(1 - clamp01(t)));
}

export function scaleAtT(t: number) {
  return mix(1.15, 0.25, smoothstep(1 - clamp01(t)));
}

export type QuestPlacement = {
  key: string;
  questId: string;
  cat: JourneyCategory | undefined;
  memory?: { id: string; title: string; hasPhoto: boolean };
  t: number;
  side: -1 | 1;
  isCurrent: boolean;
  journeyLeg: 'completed' | 'active';
};

