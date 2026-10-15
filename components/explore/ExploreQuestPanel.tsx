import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { journeyHubStyles as styles } from '@/components/journey/journeyHubStyles';
import { CatalogLoadFailed, useCatalogLoadFailed } from '@/components/quests/CatalogLoadFailed';
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
import { questsInMotionInCategory } from '@/src/features/quests/suggestedQuests';

type Props = {
  userId: string;
  categoryId: string | null;
  /** Kept for API compatibility; the panel no longer recommends quests. */
  preferences: OnboardingPreferences | null;
  /** Kept for API compatibility; the surrounding sheet renders the header. */
  hideHeader?: boolean;
};

/**
 * A place on the map shows what you have going on there — quests in motion, then quests paused
 * part-way — and nothing else (Standa, 2026-10-15, task 46). It used to repeat Journey's offer
 * (three picks, liked quests, "Discover more") with the quests in motion squeezed in above, and
 * people did not know where to find what they had started. Choosing something new is Journey's
 * job; the button below leads there, to this category.
 */
export function ExploreQuestPanel({ userId, categoryId }: Props) {
  const router = useRouter();
  const quests = useQuestDomainStore((s) => s.quests);
  const categories = useQuestDomainStore((s) => s.categories);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);

  const actions = useQuestActions(userId, 'explore');

  const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const inMotion = useMemo(
    () =>
      categoryId ? questsInMotionInCategory({ catalog: quests, userQuests, categoryId }) : [],
    [categoryId, quests, userQuests]
  );

  const catalogFailed = useCatalogLoadFailed();

  const openJourney = () =>
    router.push({ pathname: '/(tabs)/journey', params: { category: categoryId } } as never);

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
        ) : catalogFailed ? (
          <CatalogLoadFailed />
        ) : (
          <>
            {inMotion.length === 0 ? (
              <View style={[styles.heroCard, styles.heroEmptyPadded, panelStyles.emptyCard]}>
                <Text style={styles.emptyTitleSolid}>{EXPLORE_COPY.panelEmptyTitle}</Text>
                <Text style={styles.emptyBodySolid}>{EXPLORE_COPY.panelEmptyBody}</Text>
              </View>
            ) : (
              <View style={panelStyles.list}>
                {inMotion.map((uq) => {
                  const q = getQuestById(uq.questId);
                  const cid = uq.snapshotCategoryId || q?.categoryId || categoryId;
                  const title = uq.snapshotTitle?.trim() || q?.title || 'Side quest';
                  const stepTotal = q?.actionSteps.length ?? 0;
                  const stepDone = q && stepTotal > 0 ? countCompletedJourneySteps(uq, q) : 0;
                  const paused = uq.status !== 'active';
                  const nextLabel =
                    q && stepTotal > 0
                      ? getNextActionableStepLabel(uq, q)
                      : uq.snapshotShort?.trim() || q?.shortDescription || 'Continue when ready';
                  const progress = stepTotal > 0 ? `${stepDone}/${stepTotal} steps` : 'In motion';
                  return (
                    <HubDiscoverUserQuestRow
                      key={uq.id}
                      accentColor={categoryAccentForCategoryId(cid)}
                      categoryMeta={`${paused ? 'Paused' : categoryLabel(cid)} · ${progress}`}
                      title={title}
                      subtitle={nextLabel}
                      onRowPress={() =>
                        paused ? router.push(`/quest/${uq.questId}` as never) : actions.onContinue(uq)
                      }
                      primaryAction={{
                        label: paused ? QUEST_COPY.resumeQuest : QUEST_COPY.continueQuest,
                        onPress: () =>
                          paused ? void actions.onStartNow(uq.questId) : actions.onContinue(uq),
                        disabled: actions.primaryBusy,
                      }}
                    />
                  );
                })}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Find ${categoryLabel(categoryId)} quests in Journey`}
              onPress={openJourney}
              style={({ pressed }) => [panelStyles.discoverMore, pressed && panelStyles.pressed]}>
              <Ionicons name="map-outline" size={16} color={Theme.accent} />
              <Text style={panelStyles.discoverMoreText}>
                {inMotion.length === 0 ? EXPLORE_COPY.panelFindFirst : EXPLORE_COPY.panelFindMore}
              </Text>
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
        waitingUserQuestId={actions.waitingUserQuestId}
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
