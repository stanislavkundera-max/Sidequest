import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { JourneyWorldScene } from '@/components/journey/JourneyWorldScene';
import { Theme } from '@/constants/Theme';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import {
  deriveJourneyArtifacts,
  getJourneyMicroLine,
} from '@/src/features/journey/journeyArtifacts';
import { journeyContentWidth } from '@/src/features/journey/journeyLayoutMetrics';
import { getWorldStateFromCompletedQuests } from '@/src/features/journey/journeyWorld';
import type { MemoryEntry } from '@/src/types/memory';
import type { Quest, UserQuest } from '@/src/types/quest';
import { useSessionStore } from '@/stores/session';

type PathNode = {
  userQuestId: string;
  questId: string;
  completedAt: string;
  questTitle: string;
  categoryId: string;
  memory?: {
    id: string;
    title: string;
    createdAt: string;
    hasPhoto: boolean;
    isLinkedToThisCompletion: boolean;
  };
  categoryLabel: string;
};

function findRelatedMemory(
  memories: MemoryEntry[],
  uq: UserQuest
): { memory: MemoryEntry; isLinkedToThisCompletion: boolean } | undefined {
  const direct = memories.find((m) => m.userQuestId === uq.id);
  if (direct) return { memory: direct, isLinkedToThisCompletion: true };
  const withSameQuest = memories.filter((m) => m.questId === uq.questId);
  if (withSameQuest.length === 0) return undefined;
  const memory = [...withSameQuest].sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  )[0];
  if (!memory) return undefined;
  return { memory, isLinkedToThisCompletion: false };
}

function categoryName(categoryId: string): string {
  return useQuestDomainStore.getState().categories.find((c) => c.id === categoryId)?.name ?? '—';
}

export default function JourneyScreen() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const journeyLayoutWidth = useMemo(() => journeyContentWidth(windowWidth), [windowWidth]);
  const [journeyStageHeight, setJourneyStageHeight] = useState(windowHeight);
  const onJourneyStageLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setJourneyStageHeight(h);
  }, []);
  const user = useSessionStore((s) => s.user);

  const quests = useQuestDomainStore((s) => s.quests);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const memories = useMemoryStore((s) => s.memories);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const completed = useMemo(() => {
    const list = userQuests
      .filter((uq) => uq.status === 'completed' && uq.completedAt)
      .filter((uq) => Boolean(getQuestById(uq.questId)));
    return list.sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));
  }, [userQuests, getQuestById]);

  const nodes = useMemo<PathNode[]>(() => {
    const out: PathNode[] = [];
    for (const uq of completed) {
      const q = getQuestById(uq.questId);
      if (!q || !uq.completedAt) continue;
      const related = findRelatedMemory(memories, uq);
      out.push({
        userQuestId: uq.id,
        questId: q.id,
        completedAt: uq.completedAt,
        questTitle: q.title,
        categoryId: q.categoryId,
        memory: related
          ? {
              id: related.memory.id,
              title: related.memory.title,
              createdAt: related.memory.createdAt,
              hasPhoto: Boolean(related.memory.photoUri),
              isLinkedToThisCompletion: related.isLinkedToThisCompletion,
            }
          : undefined,
        categoryLabel: categoryName(q.categoryId),
      });
    }
    return out;
  }, [completed, getQuestById, memories]);

  const activeOnPath = useMemo(
    () =>
      userQuests
        .filter((uq) => uq.status === 'active' && getQuestById(uq.questId))
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    [userQuests, getQuestById]
  );

  const worldState = useMemo(
    () =>
      getWorldStateFromCompletedQuests({
        completedUserQuests: completed,
        questCatalog: quests,
      }),
    [completed, quests]
  );

  const artifactSourceNodes = useMemo(() => {
    return nodes
      .map((n) => {
        const q = getQuestById(n.questId);
        if (!q || !n.completedAt) return null;
        return {
          userQuestId: n.userQuestId,
          questId: n.questId,
          categoryId: n.categoryId,
          completedAt: n.completedAt,
          timeframe: q.timeframe,
          memory: n.memory
            ? { id: n.memory.id, title: n.memory.title, hasPhoto: n.memory.hasPhoto }
            : undefined,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [nodes, getQuestById]);

  const worldPathNodes = useMemo(() => {
    const completedLeg = artifactSourceNodes.map((n) => ({
      userQuestId: n.userQuestId,
      questId: n.questId,
      categoryId: n.categoryId,
      completedAt: n.completedAt,
      timeframe: n.timeframe,
      memory: n.memory,
      journeyStatus: 'completed' as const,
    }));
    const activeLeg = activeOnPath.map((uq) => {
      const q = getQuestById(uq.questId)!;
      const related = findRelatedMemory(memories, uq);
      return {
        userQuestId: uq.id,
        questId: q.id,
        categoryId: q.categoryId,
        timeframe: q.timeframe,
        memory: related
          ? { id: related.memory.id, title: related.memory.title, hasPhoto: Boolean(related.memory.photoUri) }
          : undefined,
        journeyStatus: 'active' as const,
      };
    });
    return [...completedLeg, ...activeLeg];
  }, [artifactSourceNodes, activeOnPath, getQuestById, memories]);

  const artifacts = useMemo(() => deriveJourneyArtifacts(artifactSourceNodes), [artifactSourceNodes]);
  const microLine = useMemo(() => getJourneyMicroLine(worldState), [worldState]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: 20 }}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to view your Journey."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stage}>
        {worldPathNodes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Journey</Text>
            <Text style={styles.emptyBody}>
              Your path is quiet for now. Complete one real-world quest and this landscape will start to
              hold it.
            </Text>
            <EmptyState
              title="No steps yet"
              message="Pick a small quest to begin. Later, your memories will appear here as quiet traces."
              actionLabel="Pick a quest"
              onAction={() => router.push('/quest/select' as never)}
            />
          </View>
        ) : (
          <View style={styles.journeyPhoneColumn}>
            <View
              style={[styles.journeyPhoneStage, { width: journeyLayoutWidth }]}
              onLayout={onJourneyStageLayout}>
              <JourneyWorldScene
                layoutWidth={journeyLayoutWidth}
                layoutHeight={Math.max(1, journeyStageHeight)}
                world={worldState}
                nodes={worldPathNodes}
                artifacts={artifacts}
                microLine={microLine}
                onOpenTimeline={() => setTimelineOpen(true)}
                onOpenMemory={(id) => router.push(`/memory/${id}`)}
                onOpenQuest={(id) => router.push(`/quest/${id}`)}
                onOpenHome={() => router.push('/choose-quest')}
              />
            </View>
          </View>
        )}

        {timelineOpen ? (
          <View style={styles.timelineOverlay} accessibilityViewIsModal>
            <Pressable
              style={StyleSheet.absoluteFill}
              accessibilityRole="button"
              accessibilityLabel="Close timeline"
              onPress={() => setTimelineOpen(false)}
            />
            <View style={styles.timelineCard}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineTitle}>Timeline</Text>
                <Pressable
                  onPress={() => setTimelineOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close timeline"
                  style={({ pressed }) => [styles.timelineClose, pressed && { opacity: 0.9 }]}>
                  <Text style={styles.timelineCloseText}>Close</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.timelineScroll}>
                {nodes
                  .slice()
                  .reverse()
                  .map((node) => {
                    const primaryTitle = node.memory?.title?.trim() ? node.memory.title : node.questTitle;
                    const date = new Date(node.memory?.createdAt ?? node.completedAt);
                    const meta = `${date.toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })} · ${node.categoryLabel.toLowerCase()}`;

                    return (
                      <Pressable
                        key={node.userQuestId}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${primaryTitle}`}
                        onPress={() => {
                          setTimelineOpen(false);
                          if (node.memory?.id) {
                            router.push(`/memory/${node.memory.id}`);
                            return;
                          }
                          router.push(`/quest/${node.questId}`);
                        }}
                        style={({ pressed }) => [styles.timelineRow, pressed && styles.timelineRowPressed]}>
                        <Text style={styles.timelineRowTitle} numberOfLines={2}>
                          {primaryTitle}
                        </Text>
                        <Text style={styles.timelineRowMeta}>{meta}</Text>
                      </Pressable>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  stage: { flex: 1, backgroundColor: Theme.bg },
  journeyPhoneColumn: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: Theme.bg,
  },
  journeyPhoneStage: {
    flex: 1,
    maxWidth: '100%',
  },
  emptyWrap: { flex: 1, padding: 20, paddingTop: 16 },
  emptyTitle: { fontSize: 28, fontWeight: '600', color: Theme.text, marginBottom: 10 },
  emptyBody: { fontSize: 15, lineHeight: 22, color: Theme.textMuted, marginBottom: 16 },
  timelineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  timelineCard: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    maxHeight: '72%',
    overflow: 'hidden',
  },
  timelineHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  timelineTitle: { fontSize: 16, fontWeight: '800', color: Theme.text, letterSpacing: 0.2 },
  timelineClose: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.bg,
  },
  timelineCloseText: { fontSize: 13, fontWeight: '800', color: Theme.text },
  timelineScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 10, paddingBottom: 18 },
  timelineRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  timelineRowPressed: { opacity: 0.92 },
  timelineRowTitle: { color: Theme.text, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  timelineRowMeta: { marginTop: 6, color: Theme.textMuted, fontSize: 13 },
});

