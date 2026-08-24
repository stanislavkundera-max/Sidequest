import {
  deriveJourneyArtifacts,
  type JourneyArtifact,
  type JourneyArtifactSourceNode,
} from '@/src/features/journey/journeyArtifacts';
import { getJourneyMicrocopy } from '@/src/features/journey/journeyNarrative';
import type { JourneyWorldSceneNode } from '@/src/features/journey/journeyPathGeometry';
import { getWorldStateFromCompletedQuests, type WorldState } from '@/src/features/journey/journeyWorld';
import type { MemoryEntry } from '@/src/types/memory';
import type { Quest, UserQuest } from '@/src/types/quest';

/**
 * The painted path has 5 apex points inside the completed leg — placements
 * start colliding past ~11 completed quests and are badly stacked by 50.
 * Cap what's rendered on the path; `world`/microcopy below stay uncapped.
 */
export const JOURNEY_PATH_MAX_COMPLETED = 10;

export type JourneyWorldSceneData = {
  world: WorldState;
  nodes: JourneyWorldSceneNode[];
  artifacts: JourneyArtifact[];
  microLine: string;
};

function findLinkedMemory(userQuestId: string, memories: MemoryEntry[]): MemoryEntry | undefined {
  return memories.find((m) => m.userQuestId === userQuestId);
}

/**
 * Turns live quest/memory state into what `JourneyWorldScene` expects.
 * Never existed even in the original build — this is the actual missing
 * piece that kept the world scene from ever going live.
 */
export function deriveJourneyWorldSceneData(params: {
  userQuests: UserQuest[];
  quests: Quest[];
  memories: MemoryEntry[];
  maxPathNodes?: number;
}): JourneyWorldSceneData {
  const { userQuests, quests, memories, maxPathNodes = JOURNEY_PATH_MAX_COMPLETED } = params;
  const questById = new Map(quests.map((q) => [q.id, q]));

  const completed = userQuests
    .filter((uq): uq is UserQuest & { completedAt: string } => uq.status === 'completed' && !!uq.completedAt)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const active = userQuests
    .filter((uq) => uq.status === 'active')
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  // Full, uncapped history — category levels/badges stay lifetime-accurate.
  const world = getWorldStateFromCompletedQuests({ completedUserQuests: completed, questCatalog: quests });

  // Only the rendered path is capped, keeping the most recent completions.
  const cappedCompleted = completed.slice(-maxPathNodes);

  // Built with completedAt required (always populated below) so this can
  // feed deriveJourneyArtifacts directly; still structurally a JourneyWorldSceneNode[].
  const nodes: JourneyArtifactSourceNode[] = [];
  for (const uq of [...cappedCompleted, ...active]) {
    const quest = questById.get(uq.questId);
    if (!quest) continue;
    const linkedMemory = findLinkedMemory(uq.id, memories);
    nodes.push({
      userQuestId: uq.id,
      questId: uq.questId,
      categoryId: quest.categoryId,
      memory: linkedMemory
        ? { id: linkedMemory.id, title: linkedMemory.title, hasPhoto: !!linkedMemory.photoUri }
        : undefined,
      journeyStatus: uq.status === 'active' ? 'active' : 'completed',
      // Active quests have no completedAt yet — startedAt is always present
      // and stable, and only feeds the artifact-variant hash seed below.
      completedAt: uq.completedAt ?? uq.startedAt,
      timeframe: quest.timeframe,
    });
  }

  const artifacts = deriveJourneyArtifacts(nodes);
  const microLine = getJourneyMicrocopy({
    world,
    completedCount: completed.length, // uncapped
    memoryCount: memories.length,
  });

  return { world, nodes, artifacts, microLine };
}
