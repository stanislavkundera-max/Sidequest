import type { WorldState } from '@/src/features/journey/journeyWorld';

function maxCategory(world: WorldState): { key: keyof WorldState; level: number; count: number } {
  const entries = Object.entries(world) as Array<[keyof WorldState, { level: number; count: number }]>;
  return entries.reduce(
    (best, [key, v]) => {
      if (v.level > best.level) return { key, level: v.level, count: v.count };
      if (v.level === best.level && v.count > best.count) return { key, level: v.level, count: v.count };
      return best;
    },
    { key: 'nature' as keyof WorldState, level: world.nature.level, count: world.nature.count }
  );
}

function label(key: keyof WorldState): string {
  switch (key) {
    case 'nature':
      return 'nature';
    case 'social':
      return 'connection';
    case 'adventure':
      return 'new ground';
    case 'relax':
      return 'softness';
    default:
      return 'texture';
  }
}

export function getJourneyMicrocopy(params: {
  world: WorldState;
  completedCount: number;
  memoryCount: number;
}): string {
  const { world, completedCount, memoryCount } = params;
  if (completedCount === 0) {
    return 'Your path is quiet for now—one small step is enough to begin.';
  }

  const strongest = maxCategory(world);
  const hasMemories = memoryCount > 0;

  if (completedCount < 3) {
    return hasMemories
      ? 'You’ve started stepping outside your routine. Your first moments are already taking shape.'
      : 'You’ve started stepping outside your routine. Keep it small and real.';
  }

  if (strongest.level >= 3) {
    return `Your world is growing richer—more ${label(strongest.key)} is showing up in your weeks.`;
  }

  if (strongest.level >= 2) {
    return `Your path is becoming more alive. You’re building a life with more ${label(strongest.key)}.`;
  }

  // Balanced / early growth
  const levels = [world.nature.level, world.social.level, world.adventure.level, world.relax.level];
  const spread = Math.max(...levels) - Math.min(...levels);
  if (spread <= 1) {
    return hasMemories
      ? 'Your journey is gaining texture—steps and moments are starting to connect.'
      : 'Your journey is gaining texture—keep moving gently, one step at a time.';
  }

  return hasMemories
    ? 'Your world is shifting—some themes are pulling forward, and your moments are catching it.'
    : 'Your world is shifting—some themes are pulling forward. Add a moment when one feels meaningful.';
}

