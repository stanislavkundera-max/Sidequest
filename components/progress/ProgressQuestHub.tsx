import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { journeyHubStyles as styles } from '@/components/journey/journeyHubStyles';
import { HubDiscoverUserQuestRow } from '@/components/quests/HubDiscoverUserQuestRow';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { journeyBackgroundForTimeframe } from '@/src/features/journey/journeyTimeframeBackground';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { QUEST_COPY } from '@/src/features/quests/questCopy';
import {
  activeQuestResumePath,
  countCompletedJourneySteps,
  getNextActionableStepLabel,
} from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import type { Quest, QuestTimeframe, UserQuest } from '@/src/types/quest';

const TIMEFRAME_ORDER: QuestTimeframe[] = ['weekly', 'monthly', 'yearly'];
const HERO_EMPTY_H = 200;

type Scope = 'active' | 'completed';

function rowTitle(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotTitle?.trim() || quest?.title || 'Side quest';
}

function rowShort(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotShort?.trim() || quest?.shortDescription || '';
}

function rowCategoryId(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotCategoryId || quest?.categoryId || '';
}

function categoryLabel(categoryId: string): string {
  return useQuestDomainStore.getState().categories.find((c) => c.id === categoryId)?.name ?? categoryId;
}

function timeframeDiscoverHeading(tf: QuestTimeframe): string {
  switch (tf) {
    case 'weekly':
      return QUEST_COPY.discoverTimeframeWeekly;
    case 'monthly':
      return QUEST_COPY.discoverTimeframeMonthly;
    default:
      return QUEST_COPY.discoverTimeframeYearly;
  }
}

function resolveTimeframe(uq: UserQuest, quest?: Quest): QuestTimeframe {
  return quest?.timeframe ?? 'weekly';
}

function resumePath(quest: Quest | undefined, uq: UserQuest): string {
  if (quest) return activeQuestResumePath(quest, uq);
  return `/quest/${uq.questId}`;
}

export function ProgressQuestHub() {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>('active');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const categories = useQuestDomainStore((s) => s.categories);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const memoryCount = useMemoryStore((s) => s.memories.length);

  const activeScopeCount = useMemo(
    () => userQuests.filter((uq) => uq.status === 'active').length,
    [userQuests]
  );
  const completedScopeCount = useMemo(
    () => userQuests.filter((uq) => uq.status === 'completed').length,
    [userQuests]
  );

  const scopedList = useMemo(
    () => userQuests.filter((uq) => uq.status === (scope === 'active' ? 'active' : 'completed')),
    [userQuests, scope]
  );

  const sortedScoped = useMemo(() => {
    const arr = [...scopedList];
    if (scope === 'active') {
      arr.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    } else {
      arr.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    }
    return arr;
  }, [scopedList, scope]);

  const categoryIds = useMemo(() => {
    const seen = new Set<string>();
    for (const uq of sortedScoped) {
      const q = getQuestById(uq.questId);
      const cid = rowCategoryId(uq, q);
      if (cid) seen.add(cid);
    }
    const ordered = categories.filter((c) => seen.has(c.id)).map((c) => c.id);
    for (const id of seen) {
      if (!ordered.includes(id)) ordered.push(id);
    }
    return ordered;
  }, [categories, sortedScoped, getQuestById]);

  const activeCategoryId =
    selectedCategoryId && categoryIds.includes(selectedCategoryId)
      ? selectedCategoryId
      : (categoryIds[0] ?? null);

  const userQuestsByTimeframe = useMemo(() => {
    const buckets: Record<QuestTimeframe, UserQuest[]> = {
      weekly: [],
      monthly: [],
      yearly: [],
    };
    if (!activeCategoryId) return buckets;
    for (const uq of sortedScoped) {
      const q = getQuestById(uq.questId);
      const cid = rowCategoryId(uq, q);
      if (cid !== activeCategoryId) continue;
      buckets[resolveTimeframe(uq, q)].push(uq);
    }
    for (const tf of TIMEFRAME_ORDER) {
      buckets[tf].sort((a, b) => {
        if (scope === 'active') return a.startedAt.localeCompare(b.startedAt);
        return (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
      });
    }
    return buckets;
  }, [activeCategoryId, sortedScoped, getQuestById, scope]);

  const categoryQuestTotal = useMemo(() => {
    if (!activeCategoryId) return 0;
    return TIMEFRAME_ORDER.reduce((n, tf) => n + userQuestsByTimeframe[tf].length, 0);
  }, [activeCategoryId, userQuestsByTimeframe]);

  const onContinue = useCallback(
    (uq: UserQuest) => {
      const q = getQuestById(uq.questId);
      router.push(resumePath(q, uq) as never);
    },
    [getQuestById, router]
  );

  const emptyScopeCopy = useMemo(() => {
    if (scope === 'active') {
      return {
        title: QUEST_COPY.progressEmptyActiveTitle,
        sub: QUEST_COPY.progressEmptyActiveSub,
      };
    }
    return {
      title: QUEST_COPY.progressEmptyCompletedTitle,
      sub: QUEST_COPY.progressEmptyCompletedSub,
    };
  }, [scope]);

  return (
    <View style={styles.root}>
      <View style={styles.sectionHead}>
        <Ionicons name="map-outline" size={16} color={Theme.accent} />
        <Text style={styles.sectionHeadText}>{QUEST_COPY.progressHubSectionTitle}</Text>
      </View>

      <View style={[styles.chipsRowFlush, scopePillStyles.scopeRow]}>
        {(['active', 'completed'] as const).map((s) => {
          const selected = scope === s;
          const count = s === 'active' ? activeScopeCount : completedScopeCount;
          const label =
            s === 'active' ? QUEST_COPY.progressScopeActive : QUEST_COPY.progressScopeCompleted;
          return (
            <Pressable
              key={s}
              onPress={() => {
                setScope(s);
                setSelectedCategoryId(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label}: ${count}`}
              style={({ pressed }) => [
                scopePillStyles.pill,
                selected && scopePillStyles.pillSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[scopePillStyles.pillText, selected && scopePillStyles.pillTextSelected]}>
                {label} {count}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${QUEST_COPY.progressScopeMemories}: ${memoryCount}. Opens memories.`}
          accessibilityHint="Opens your memories timeline"
          onPress={() => router.push('/(tabs)/memories' as never)}
          style={({ pressed }) => [scopePillStyles.pill, pressed && styles.pressed]}>
          <Text style={scopePillStyles.pillText}>
            {QUEST_COPY.progressScopeMemories} {memoryCount}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Ionicons name="layers-outline" size={16} color={Theme.accent} />
        <Text style={styles.sectionHeadText}>{QUEST_COPY.chooseCategoryTitle}</Text>
      </View>
      <View style={styles.chipsRowFlush}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}>
          {categoryIds.map((id) => {
            const selected = id === activeCategoryId;
            return (
              <Pressable
                key={id}
                onPress={() => setSelectedCategoryId(id)}
                style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{categoryLabel(id)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.discoverBlock}>
        {sortedScoped.length === 0 ? (
          <View style={[styles.heroCard, styles.heroEmptyPadded, { minHeight: HERO_EMPTY_H * 0.85 }]}>
            <Text style={styles.emptyTitleSolid}>{emptyScopeCopy.title}</Text>
            <Text style={styles.emptyBodySolid}>{emptyScopeCopy.sub}</Text>
          </View>
        ) : !activeCategoryId ? (
          <View style={[styles.heroCard, { height: HERO_EMPTY_H }]}>
            <View style={[styles.heroSolid, { height: HERO_EMPTY_H }]}>
              <Text style={styles.heroEmptyTitle}>No categories yet</Text>
              <Text style={styles.heroEmptySub}>Check back after your path loads.</Text>
            </View>
          </View>
        ) : categoryQuestTotal === 0 ? (
          <View style={[styles.heroCard, styles.heroEmptyPadded, { minHeight: HERO_EMPTY_H * 0.85 }]}>
            <Text style={styles.emptyTitleSolid}>{QUEST_COPY.progressEmptyCategoryTitle}</Text>
            <Text style={styles.emptyBodySolid}>{QUEST_COPY.progressEmptyCategorySub}</Text>
          </View>
        ) : (
          <>
            {TIMEFRAME_ORDER.map((tf) => {
              const bucket = userQuestsByTimeframe[tf];
              if (bucket.length === 0) return null;
              return (
                <View key={tf} style={styles.timeframeSection}>
                  <View style={styles.timeframeSplit}>
                    <View style={styles.timeframeImageCol}>
                      <ImageBackground
                        source={journeyBackgroundForTimeframe(tf)}
                        style={styles.timeframeImageBg}
                        imageStyle={styles.bgImage}>
                        <View
                          style={[
                            styles.scrim,
                            { backgroundColor: `${categoryAccentForCategoryId(activeCategoryId)}45` },
                          ]}
                        />
                        <View style={styles.timeframeImageLabels}>
                          <Text style={styles.footerMeta}>{categoryLabel(activeCategoryId)}</Text>
                          <Text style={styles.heroHeadline} numberOfLines={2}>
                            {timeframeDiscoverHeading(tf)}
                          </Text>
                          <Text style={styles.heroHint} numberOfLines={2}>
                            {QUEST_COPY.discoverTimeframeQuestCounts(bucket.length)}
                          </Text>
                        </View>
                      </ImageBackground>
                    </View>
                    <View style={styles.timeframeQuestCol}>
                      {bucket.map((uq) => {
                        const q = getQuestById(uq.questId);
                        const cid = rowCategoryId(uq, q);
                        const accent = categoryAccentForCategoryId(cid || activeCategoryId);
                        const title = rowTitle(uq, q);
                        const short = rowShort(uq, q);

                        if (scope === 'completed') {
                          const when = uq.completedAt
                            ? new Date(uq.completedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
                            : '';
                          return (
                            <HubDiscoverUserQuestRow
                              key={uq.id}
                              accentColor={accent}
                              categoryMeta={cid ? categoryLabel(cid) : 'Side quest'}
                              title={title}
                              subtitle={short || undefined}
                              metaLight={when ? `Completed · ${when}` : 'Completed'}
                              onRowPress={() => router.push(`/quest/${uq.questId}` as never)}
                            />
                          );
                        }

                        const stepTotal = q?.actionSteps.length ?? 0;
                        const stepDone = q && stepTotal > 0 ? countCompletedJourneySteps(uq, q) : 0;
                        const nextLabel =
                          q && stepTotal > 0 ? getNextActionableStepLabel(uq, q) : short || 'Continue when you are ready';
                        const metaSteps =
                          stepTotal > 0 ? `${stepDone}/${stepTotal} steps` : 'In motion';
                        const started = new Date(uq.startedAt).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        });

                        return (
                          <HubDiscoverUserQuestRow
                            key={uq.id}
                            accentColor={accent}
                            categoryMeta={`${cid ? categoryLabel(cid) : 'Side quest'} · ${metaSteps}`}
                            title={title}
                            subtitle={nextLabel}
                            metaLight={`Started ${started}`}
                            onRowPress={() => onContinue(uq)}
                            primaryAction={{
                              label: QUEST_COPY.continueQuest,
                              onPress: () => onContinue(uq),
                              disabled: false,
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </View>
    </View>
  );
}

const scopePillStyles = StyleSheet.create({
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  pillSelected: {
    backgroundColor: Theme.accentSoft,
    borderColor: Theme.accent,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.textMuted,
  },
  pillTextSelected: {
    color: Theme.accent,
  },
});
