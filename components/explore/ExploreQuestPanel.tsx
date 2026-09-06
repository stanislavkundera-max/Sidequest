import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { journeyHubStyles as styles } from '@/components/journey/journeyHubStyles';
import { CatalogQuestRow } from '@/components/quests/CatalogQuestRow';
import { HubDiscoverUserQuestRow } from '@/components/quests/HubDiscoverUserQuestRow';
import { PathFullModal } from '@/components/quests/PathFullModal';
import { useQuestActions } from '@/components/quests/useQuestActions';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { EXPLORE_COPY } from '@/src/constants/exploreMapMarkers';
import type { OnboardingPreferences } from '@/src/features/onboarding/types';
import { QUEST_COPY } from '@/src/features/quests/questCopy';
import {
  countCompletedJourneySteps,
  getNextActionableStepLabel,
} from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { loadSeenQuestIds } from '@/src/features/quests/seenQuests';
import {
  isRecentlyAdded,
  openQuestsInCategory,
} from '@/src/features/quests/suggestedQuests';
import type { Quest, UserQuest } from '@/src/types/quest';

type Props = {
  userId: string;
  categoryId: string | null;
  preferences: OnboardingPreferences | null;
  /** Kept for API compatibility; the surrounding sheet renders the header. */
  hideHeader?: boolean;
};

export function ExploreQuestPanel({ userId, categoryId, preferences }: Props) {
  const router = useRouter();
  const quests = useQuestDomainStore((s) => s.quests);
  const categories = useQuestDomainStore((s) => s.categories);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);

  const actions = useQuestActions(userId);

  const categoryLabel = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

  const questCategoryId = (uq: UserQuest): string =>
    uq.snapshotCategoryId || getQuestById(uq.questId)?.categoryId || '';

  const inProgress = useMemo(() => {
    if (!categoryId) return [];
    return userQuests
      .filter((uq) => uq.status === 'active' && questCategoryId(uq) === categoryId)
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, userQuests]);

  // A pool of picks, not one forced choice — testers (all 4) wanted to choose
  // from a few options instead of a single slot that vanishes once taken.
  //
  // Drawn from the same five the Journey tab offers, top three. It used to have
  // its own ranking and its own exclusion rule, which meant the map could
  // surface a quest the Journey tab was still holding back — five plus three
  // reachable per category instead of five. "Discover more" leads to the rest
  // of the same five.
  const recommended = useMemo(() => {
    if (!categoryId) return [] as Quest[];
    return openQuestsInCategory({
      catalog: quests,
      userQuests,
      categoryId,
      preferences,
      limit: 3,
    });
  }, [categoryId, quests, userQuests, preferences]);

  const [seenQuestIds, setSeenQuestIds] = useState<Set<string>>(new Set());
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadSeenQuestIds().then((v) => { if (alive) setSeenQuestIds(v); });
      return () => { alive = false; };
    }, [])
  );

  const nothingToShow =
    categoryId != null && inProgress.length === 0 && recommended.length === 0;

  return (
    <View style={panelStyles.root}>
      <ScrollView
        style={panelStyles.scroll}
        contentContainerStyle={panelStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {!categoryId ? (
          <View style={[styles.heroCard, styles.heroEmptyPadded, panelStyles.emptyCard]}>
            <Text style={styles.emptyTitleSolid}>{EXPLORE_COPY.panelSelectHint}</Text>
          </View>
        ) : (
          <>
            {inProgress.length > 0 ? (
              <>
                <View style={styles.sectionHead}>
                  <Ionicons name="walk-outline" size={16} color={Theme.accent} />
                  <Text style={styles.sectionHeadText}>In progress</Text>
                </View>
                <View style={panelStyles.list}>
                  {inProgress.map((uq) => {
                    const q = getQuestById(uq.questId);
                    const cid = questCategoryId(uq) || categoryId;
                    const accent = categoryAccentForCategoryId(cid);
                    const title = uq.snapshotTitle?.trim() || q?.title || 'Side quest';
                    const stepTotal = q?.actionSteps.length ?? 0;
                    const stepDone = q && stepTotal > 0 ? countCompletedJourneySteps(uq, q) : 0;
                    const nextLabel =
                      q && stepTotal > 0
                        ? getNextActionableStepLabel(uq, q)
                        : uq.snapshotShort?.trim() || q?.shortDescription || 'Continue when ready';
                    const metaSteps = stepTotal > 0 ? `${stepDone}/${stepTotal} steps` : 'In motion';
                    return (
                      <HubDiscoverUserQuestRow
                        key={uq.id}
                        accentColor={accent}
                        categoryMeta={`${categoryLabel(cid)} · ${metaSteps}`}
                        title={title}
                        subtitle={nextLabel}
                        onRowPress={() => actions.onContinue(uq)}
                        primaryAction={{
                          label: QUEST_COPY.continueQuest,
                          onPress: () => actions.onContinue(uq),
                          disabled: actions.primaryBusy,
                        }}
                      />
                    );
                  })}
                </View>
              </>
            ) : null}

            <View style={styles.sectionHead}>
              <Ionicons name="sparkles-outline" size={16} color={Theme.accent} />
              <Text style={styles.sectionHeadText}>Recommended for you</Text>
            </View>
            {!nothingToShow ? (
              <Text style={panelStyles.recommendedCaption}>
                Based on your answers — every quest is still yours to try.
              </Text>
            ) : null}
            {nothingToShow ? (
              <View style={[styles.heroCard, styles.heroEmptyPadded, panelStyles.emptyCard]}>
                <Text style={styles.emptyTitleSolid}>{EXPLORE_COPY.panelEmptyTitle}</Text>
                <Text style={styles.emptyBodySolid}>{EXPLORE_COPY.panelEmptyBody}</Text>
              </View>
            ) : recommended.length === 0 ? (
              <View style={[styles.heroCard, styles.heroEmptyPadded, panelStyles.emptyCard]}>
                <Text style={styles.emptyBodySolid}>
                  You have picked up everything here. Nice pace — check the Journey tab for more.
                </Text>
              </View>
            ) : (
              <View style={panelStyles.list}>
                {recommended.map((q) => (
                  <CatalogQuestRow
                    key={q.id}
                    quest={q}
                    categoryLabel={categoryLabel(q.categoryId)}
                    isNew={isRecentlyAdded(q) && !seenQuestIds.has(q.id)}
                    busy={actions.primaryBusy}
                    onOpen={actions.openQuest}
                    onStart={(id) => void actions.onStartNow(id)}
                    onLike={(id) => void actions.onLike(id)}
                  />
                ))}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Discover more ${categoryLabel(categoryId)} quests in Journey`}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/journey',
                  params: { category: categoryId },
                } as never)
              }
              style={({ pressed }) => [panelStyles.discoverMore, pressed && panelStyles.pressed]}>
              <Ionicons name="map-outline" size={16} color={Theme.accent} />
              <Text style={panelStyles.discoverMoreText}>Discover more</Text>
              <Ionicons name="chevron-forward" size={14} color={Theme.accent} />
            </Pressable>
          </>
        )}
      </ScrollView>

      {actions.primaryBusy ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={Theme.accent} />
        </View>
      ) : null}

      <PathFullModal
        visible={actions.pathFullOpen}
        activeForModal={actions.activeForModal}
        getQuestById={getQuestById}
        onLetWait={(id) => void actions.onLetWait(id)}
        onClose={actions.closePathFull}
      />
    </View>
  );
}

const panelStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24, paddingTop: 4 },
  list: { gap: 10, paddingHorizontal: 16, paddingBottom: 4 },
  recommendedCaption: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Theme.textMuted,
    paddingHorizontal: 16,
    marginTop: -6,
    marginBottom: 10,
  },
  emptyCard: { minHeight: 120, marginHorizontal: 16 },
  discoverMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.accent,
    backgroundColor: Theme.accentSoft,
  },
  discoverMoreText: { fontSize: 14, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.accent },
  pressed: { opacity: 0.85 },
});
