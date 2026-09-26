import type { Ionicons } from '@expo/vector-icons';

import type { QuestActionStep } from '@/src/types/quest';

/**
 * One icon per kind of step — the runner and the quest's step list share it, so
 * a camera means "photo" and a clock means "timer" everywhere.
 *
 * It lives in one place because the step list on the quest screen used to
 * explain these things in sentences instead ("worth having your camera ready").
 * The shape of a quest is better shown than told (2026-09-26).
 */
export function stepKindIcon(step: QuestActionStep): keyof typeof Ionicons.glyphMap {
  if (step.action?.kind === 'calendar') return 'calendar-outline';
  switch (step.interaction?.kind) {
    case 'timer':
      return 'time-outline';
    case 'input':
      return 'create-outline';
    case 'counter':
      return 'list-outline';
    case 'photo':
      return 'camera-outline';
    default:
      return 'checkmark-circle-outline';
  }
}
