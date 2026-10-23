import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { useQuestActions } from '@/components/quests/useQuestActions';
import { Dawn, Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { QUEST_COPY, TIMEFRAME_LABEL } from '@/src/features/quests/questCopy';
import { countCompletedJourneySteps } from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { isPausedQuest } from '@/src/features/quests/suggestedQuests';
import type { Quest, UserQuest } from '@/src/types/quest';

type Props = {
  actions: Pick<ReturnType<typeof useQuestActions>, 'primaryBusy' | 'onStartNow' | 'onUnlike'>;
};

function rowTitle(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotTitle?.trim() || quest?.title || 'Side quest';
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

  // Paused = started and set aside, with or without a finished step. Only a quest that was never
  // started is a like (isPausedQuest; code review 2026-09-27).
  const wasStarted = useCallback(
    (uq: UserQuest) => {
      const q = getQuestById(uq.questId);
      const hasProgress = Boolean(
        q && q.actionSteps.length > 0 && countCompletedJourneySteps(uq, q) > 0
      );
      return hasProgress || isPausedQuest(uq);
    },
    [getQuestById]
  );

  const pausedRows = useMemo(
    () => setAsideList.filter(wasStarted),
    [setAsideList, wasStarted]
  );
  const likedRows = useMemo(
    () => setAsideList.filter((uq) => !wasStarted(uq)),
    [setAsideList, wasStarted]
  );

  // Dawn (screen 34): one compact row each — a category dot, the name, where it stands, and
  // the one action. The photo thumbnail and the long description made two quests fill a screen.
  const renderRow = useCallback(
    (uq: UserQuest) => {
      const q = getQuestById(uq.questId);
      const accent = categoryAccentForCategoryId(rowCategoryId(uq, q));
      const stepTotal = q?.actionSteps.length ?? 0;
      const stepDone = q && stepTotal > 0 ? countCompletedJourneySteps(uq, q) : 0;
      const started = wasStarted(uq);
      const meta = [
        categoryLabel(rowCategoryId(uq, q)),
        started && stepTotal > 0 ? `${stepDone} of ${stepTotal} steps` : q ? TIMEFRAME_LABEL[q.timeframe] : '',
      ]
        .filter(Boolean)
        .join(' · ');
      return (
        <Pressable
          key={uq.id}
          onPress={() => router.push(`/quest/${uq.questId}` as never)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          {started ? (
            <View style={[styles.dot, { backgroundColor: accent }]} />
          ) : (
            <Ionicons name="heart" size={14} color={Theme.accent} />
          )}
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {rowTitle(uq, q)}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {meta}
            </Text>
          </View>
          <Pressable
            disabled={actions.primaryBusy}
            onPress={() => void actions.onStartNow(uq.questId)}
            accessibilityRole="button"
            accessibilityLabel={`${started ? QUEST_COPY.resumeQuest : QUEST_COPY.startNow}: ${rowTitle(uq, q)}`}
            style={({ pressed }) => [styles.action, pressed && styles.pressed, actions.primaryBusy && styles.disabled]}>
            <Text style={styles.actionText}>{started ? QUEST_COPY.resumeQuest : QUEST_COPY.startNow}</Text>
          </Pressable>
          {!started ? (
            <Pressable
              disabled={actions.primaryBusy}
              onPress={() => void actions.onUnlike(uq.id)}
              accessibilityRole="button"
              accessibilityLabel={`Unlike ${rowTitle(uq, q)}`}
              hitSlop={6}
              style={({ pressed }) => [styles.unlike, pressed && styles.pressed]}>
              <Text style={styles.unlikeText}>Unlike</Text>
            </Pressable>
          ) : null}
        </Pressable>
      );
    },
    [actions, categoryLabel, getQuestById, router, wasStarted]
  );

  if (pausedRows.length === 0 && likedRows.length === 0) return null;

  return (
    <View style={styles.root}>
      {pausedRows.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{QUEST_COPY.pausedSectionTitle}</Text>
          <View style={styles.list}>{pausedRows.map(renderRow)}</View>
        </View>
      ) : null}
      {likedRows.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{QUEST_COPY.forLaterSectionTitle}</Text>
          <View style={styles.list}>{likedRows.map(renderRow)}</View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text, marginBottom: 10, marginHorizontal: 2 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 60,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 18,
    backgroundColor: Dawn.card,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
  },
  dot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(246, 234, 214, 0.8)' },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  rowMeta: { marginTop: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  action: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: Dawn.cream,
    justifyContent: 'center',
  },
  actionText: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Dawn.primaryText },
  unlike: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 4 },
  unlikeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.textMuted },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
