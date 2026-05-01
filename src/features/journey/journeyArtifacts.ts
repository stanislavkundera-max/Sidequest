import type { WorldState } from '@/src/features/journey/journeyWorld';
import type { QuestTimeframe } from '@/src/types/quest';
import { offsetFromPaintedPath, placeQuestsOnPaintedPath } from '@/src/features/journey/journeyImagePath';
import type { JourneyPathNode } from '@/src/features/journey/journeyPathGeometry';

export type JourneyArtifactCategory = 'nature' | 'adventure' | 'social' | 'relax';

export type ArtifactSize = 'small' | 'medium' | 'landmark';

export type JourneyArtifactVisual =
  | 'flower'
  | 'grass_patch'
  | 'small_tree'
  | 'grove'
  | 'stream'
  | 'meadow'
  | 'forest_clearing'
  | 'mountain_peak'
  | 'aurora'
  | 'trail_marker'
  | 'stepping_stone'
  | 'signpost'
  | 'bridge'
  | 'camp'
  | 'cliff_path'
  | 'mountain_pass'
  | 'island'
  | 'expedition_landmark'
  | 'lantern'
  | 'warm_window'
  | 'small_campfire'
  | 'village_lights'
  | 'shared_table'
  | 'gathering_place'
  | 'settlement'
  | 'festival_lights'
  | 'constellation'
  | 'mist'
  | 'soft_cloud'
  | 'pond_ripple'
  | 'lake'
  | 'moonlit_clearing'
  | 'quiet_garden'
  | 'sanctuary'
  | 'calm_valley'
  | 'night_sky';

export type JourneyArtifact = {
  id: string;
  category: JourneyArtifactCategory;
  type: JourneyArtifactVisual;
  linkedQuestId: string;
  linkedMemoryId: string | null;
  /** True when a memory is linked to this completion — slightly elevated presentation. */
  hasMemoryLink: boolean;
  completedAt: string;
  timeframe: QuestTimeframe;
  /** Normalized 0–1 stage coordinates */
  position: { x: number; y: number };
  size: ArtifactSize;
  pathT: number;
  side: -1 | 1;
};

const CATEGORY_ID: Record<string, JourneyArtifactCategory | undefined> = {
  'cat-nature': 'nature',
  'cat-adventure': 'adventure',
  'cat-social': 'social',
  'cat-relax': 'relax',
};

const NATURE_WEEKLY: JourneyArtifactVisual[] = ['flower', 'grass_patch', 'small_tree'];
const NATURE_MONTHLY: JourneyArtifactVisual[] = ['grove', 'stream', 'meadow'];
const NATURE_YEARLY: JourneyArtifactVisual[] = ['forest_clearing', 'mountain_peak', 'aurora'];

const ADVENTURE_WEEKLY: JourneyArtifactVisual[] = ['trail_marker', 'stepping_stone', 'signpost'];
const ADVENTURE_MONTHLY: JourneyArtifactVisual[] = ['bridge', 'camp', 'cliff_path'];
const ADVENTURE_YEARLY: JourneyArtifactVisual[] = ['mountain_pass', 'island', 'expedition_landmark'];

const SOCIAL_WEEKLY: JourneyArtifactVisual[] = ['lantern', 'warm_window', 'small_campfire'];
const SOCIAL_MONTHLY: JourneyArtifactVisual[] = ['village_lights', 'shared_table', 'gathering_place'];
const SOCIAL_YEARLY: JourneyArtifactVisual[] = ['settlement', 'festival_lights', 'constellation'];

const RELAX_WEEKLY: JourneyArtifactVisual[] = ['mist', 'soft_cloud', 'pond_ripple'];
const RELAX_MONTHLY: JourneyArtifactVisual[] = ['lake', 'moonlit_clearing', 'quiet_garden'];
const RELAX_YEARLY: JourneyArtifactVisual[] = ['sanctuary', 'calm_valley', 'night_sky'];

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function timeframeToArtifactSize(tf: QuestTimeframe): ArtifactSize {
  if (tf === 'weekly') return 'small';
  if (tf === 'monthly') return 'medium';
  return 'landmark';
}

function pickVariant<T extends readonly JourneyArtifactVisual[]>(list: T, seed: string): T[number] {
  const idx = Math.floor(hashStr(seed) * list.length) % list.length;
  return list[idx]!;
}

function resolveType(
  category: JourneyArtifactCategory,
  size: ArtifactSize,
  seed: string
): JourneyArtifactVisual {
  const s = `${seed}:type`;
  if (category === 'nature') {
    if (size === 'small') return pickVariant(NATURE_WEEKLY, s);
    if (size === 'medium') return pickVariant(NATURE_MONTHLY, s);
    return pickVariant(NATURE_YEARLY, s);
  }
  if (category === 'adventure') {
    if (size === 'small') return pickVariant(ADVENTURE_WEEKLY, s);
    if (size === 'medium') return pickVariant(ADVENTURE_MONTHLY, s);
    return pickVariant(ADVENTURE_YEARLY, s);
  }
  if (category === 'social') {
    if (size === 'small') return pickVariant(SOCIAL_WEEKLY, s);
    if (size === 'medium') return pickVariant(SOCIAL_MONTHLY, s);
    return pickVariant(SOCIAL_YEARLY, s);
  }
  if (size === 'small') return pickVariant(RELAX_WEEKLY, s);
  if (size === 'medium') return pickVariant(RELAX_MONTHLY, s);
  return pickVariant(RELAX_YEARLY, s);
}

export type JourneyArtifactSourceNode = JourneyPathNode & {
  completedAt: string;
  timeframe: QuestTimeframe;
};

export function deriveJourneyArtifacts(nodes: JourneyArtifactSourceNode[]): JourneyArtifact[] {
  if (nodes.length === 0) return [];
  const pathNodes: JourneyPathNode[] = nodes.map((n) => ({
    userQuestId: n.userQuestId,
    questId: n.questId,
    categoryId: n.categoryId,
    memory: n.memory,
  }));
  const placements = placeQuestsOnPaintedPath(pathNodes);
  const out: JourneyArtifact[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    const pl = placements[i];
    if (!pl) continue;
    const category = CATEGORY_ID[n.categoryId];
    if (!category) continue;
    const size = timeframeToArtifactSize(n.timeframe);
    const seed = `${n.userQuestId}|${n.completedAt}|${i}`;
    const type = resolveType(category, size, seed);
    const pos = offsetFromPaintedPath(pl, size, seed);
    out.push({
      id: `artifact:${n.userQuestId}`,
      category,
      type,
      linkedQuestId: n.questId,
      linkedMemoryId: n.memory?.id ?? null,
      hasMemoryLink: Boolean(n.memory?.id),
      completedAt: n.completedAt,
      timeframe: n.timeframe,
      position: pos,
      size,
      pathT: pl.t,
      side: pl.side,
    });
  }
  return out;
}

export function getJourneyMicroLine(world: WorldState): string {
  const counts = {
    nature: world.nature.count,
    adventure: world.adventure.count,
    social: world.social.count,
    relax: world.relax.count,
  };
  const total = counts.nature + counts.adventure + counts.social + counts.relax;
  if (total === 0) return 'Your journey is gaining texture.';
  const max = Math.max(counts.nature, counts.adventure, counts.social, counts.relax);
  const tied = [counts.nature, counts.adventure, counts.social, counts.relax].filter((c) => c === max).length;
  if (tied >= 3 || (max > 0 && max <= total * 0.28)) {
    return 'Your journey is gaining texture.';
  }
  if (counts.nature === max) return 'Your path is growing more alive.';
  if (counts.social === max) return 'Warm lights are appearing along your way.';
  if (counts.adventure === max) return 'Your path is opening into unknown ground.';
  return 'Your world is becoming softer and quieter.';
}
