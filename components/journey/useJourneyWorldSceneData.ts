import { useMemo } from 'react';

import { deriveJourneyWorldSceneData } from '@/src/features/journey/journeyPathAdapter';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';

/** Live quest/memory state, shaped for `JourneyWorldScene`. */
export function useJourneyWorldSceneData() {
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const quests = useQuestDomainStore((s) => s.quests);
  const memories = useMemoryStore((s) => s.memories);

  return useMemo(
    () => deriveJourneyWorldSceneData({ userQuests, quests, memories }),
    [userQuests, quests, memories]
  );
}
