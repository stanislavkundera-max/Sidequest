import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { journeyHubStyles as hub } from '@/components/journey/journeyHubStyles';
import type { useQuestActions } from '@/components/quests/useQuestActions';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { QUEST_COPY } from '@/src/features/quests/questCopy';
import { countCompletedJourneySteps } from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import type { Quest, UserQuest } from '@/src/types/quest';

type Props = {
  actions: Pick<ReturnType<typeof useQuestActions>, 'primaryBusy' | 'onStartNow'>;
};

function rowTitle(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotTitle?.trim() || quest?.title || 'Side quest';
}

function rowShort(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotShort?.trim() || quest?.shortDescription || '';
}

function rowCategoryId(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotCategoryId || quest?.categoryId || '';
}

/**
 * Journey tab: quests set aside (Leave, or hearted from Explore), split by
 * whether real step progress exists. Both share the `saved_for_later` status
 * in the DB, but "left mid-way" and "hearted, never started" are different
 * intents — testers lost the former inside the latter (bug #14), and the
 * Leave-confirmation copy promises this exact section (bug #15).
 */
export function PausedAndLikedSections({ actions }: Props) {
  const router = useRouter();
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const categories = useQuestDomainStore((s) => s.categories);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);

  const categoryLabel = useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? id,
    [categories]
  );

  const setAsideList = useMemo(
    () =>
      userQuests
        .filter((uq) => uq.status === 'saved_for_later')
        .sort((a, b) => (b.savedAt ?? b.startedAt).localeCompare(a.savedAt ?? a.startedAt)),
    [userQuests]
  );

  const questHasProgress = useCallback(
    (uq: UserQuest) => {
      const q = getQuestById(uq.questId);
      return Boolean(q && q.actionSteps.length > 0 && countCompletedJourneySteps(uq, q) > 0);
    },
    [getQuestById]
  );

  const pausedRows = useMemo(
    () => setAsideList.filter(questHasProgress),
    [setAsideList, questHasProgress]
  );
  const likedRows = useMemo(
    () => setAsideList.filter((uq) => !questHasProgress(uq)),
    [setAsideList, questHasProgress]
  );

  const renderRow = useCallback(
    (uq: UserQuest) => {
      const q = getQuestById(uq.questId);
      const accent = categoryAccentForCategoryId(rowCategoryId(uq, q));
      const stepTotal = q?.actionSteps.length ?? 0;
      const stepDone = q && stepTotal > 0 ? countCompletedJourneySteps(uq, q) : 0;
      const hasProgress = stepDone > 0;
      return (
        <Pressable
          key={uq.id}
          onPress={() => router.push(`/quest/${uq.questId}` as never)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${rowTitle(uq, q)}`}
          style={hub.likedCompactRow}>
          {uq.photoUri ? (
            <Image source={{ uri: uq.photoUri }} style={hub.likedThumb} resizeMode="cover" />
          ) : null}
          <View style={[hub.discoverQuestAccent, { backgroundColor: accent }]} />
          <View style={hub.likedCompactBody}>
            <Text style={hub.questRowMeta}>
              {categoryLabel(rowCategoryId(uq, q))}
              {hasProgress ? ` · ${stepDone}/${stepTotal} steps done` : ''}
            </Text>
            <Text style={hub.questRowTitle} numberOfLines={2}>
              {rowTitle(uq, q)}
            </Text>
            <Text style={hub.questRowSub} numberOfLines={2}>
              {rowShort(uq, q)}
            </Text>
            <View style={hub.questRowActions}>
              <Pressable
                disabled={actions.primaryBusy}
                onPress={() => void actions.onStartNow(uq.questId)}
                style={({ pressed }) => [
                  hub.btnSubtleSolid,
                  pressed && !actions.primaryBusy && hub.pressed,
                  actions.primaryBusy && hub.disabled,
                ]}>
                <Text style={hub.btnSubtleSolidText}>
                  {hasProgress ? QUEST_COPY.resumeQuest : QUEST_COPY.startNow}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      );
    },
    [actions, categoryLabel, getQuestById, router]
  );

  if (pausedRows.length === 0 && likedRows.length === 0) return null;

  return (
    <View style={styles.root}>
      {pausedRows.length > 0 ? (
        <View style={styles.section}>
          <View style={hub.sectionHead}>
            <Ionicons name="walk-outline" size={16} color={Theme.accent} />
            <Text style={hub.sectionHeadText}>{QUEST_COPY.pausedSectionTitle}</Text>
          </View>
          <View style={styles.list}>{pausedRows.map(renderRow)}</View>
        </View>
      ) : null}
      {likedRows.length > 0 ? (
        <View style={styles.section}>
          <View style={hub.sectionHead}>
            <Ionicons name="heart-outline" size={16} color={Theme.accent} />
            <Text style={hub.sectionHeadText}>{QUEST_COPY.forLaterSectionTitle}</Text>
          </View>
          <View style={styles.list}>{likedRows.map(renderRow)}</View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginBottom: 8 },
  section: { marginBottom: 16 },
  list: { gap: 10, paddingHorizontal: 16 },
});
