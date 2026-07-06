import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HubDiscoverUserQuestRow } from '@/components/quests/HubDiscoverUserQuestRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { QUEST_COPY } from '@/src/features/quests/questCopy';
import {
  activeQuestResumePath,
  countCompletedJourneySteps,
  getNextActionableStepLabel,
} from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import type { Quest, QuestTimeframe, UserQuest } from '@/src/types/quest';
import { useSessionStore } from '@/stores/session';

const TIMEFRAME_LABEL: Record<QuestTimeframe, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function categoryName(categoryId: string): string {
  return (
    useQuestDomainStore
      .getState()
      .categories.find((c) => c.id === categoryId)?.name ?? categoryId
  );
}

function rowTitle(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotTitle?.trim() || quest?.title || 'Side quest';
}

function rowShort(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotShort?.trim() || quest?.shortDescription || '';
}

function rowCategoryId(uq: UserQuest, quest?: Quest): string {
  return uq.snapshotCategoryId || quest?.categoryId || '';
}

function resumePath(quest: Quest | undefined, uq: UserQuest): string {
  if (quest) return activeQuestResumePath(quest, uq);
  return `/quest/${uq.questId}`;
}

function sortByStarted(a: { startedAt: string }, b: { startedAt: string }) {
  return a.startedAt.localeCompare(b.startedAt);
}

export default function ActiveQuestsScreen() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);

  const active = useMemo(() => {
    const list = userQuests.filter((uq) => uq.status === 'active');
    return [...list].sort(sortByStarted);
  }, [userQuests]);

  useFocusEffect(
    useCallback(() => {
      trackEvent('quest_list_viewed', {
        sourceScreen: 'active_quests',
      }).catch(() => undefined);
    }, [])
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.pad}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to see active quests."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Active path</Text>
        <Text style={styles.sub}>
          Up to three quests can be active at once. Tap a row to continue, or use Continue. Suggested picks
          and saved ideas live on the Journey tab.
        </Text>

        {active.length === 0 ? (
          <EmptyState
            title="Nothing on your path yet"
            message="Open Journey to pick something small to try today, or browse the full catalog when you want more ideas."
            actionLabel="Open Journey"
            onAction={() => router.push('/(tabs)/journey' as never)}
          />
        ) : (
          active.map((uq) => {
            const q = getQuestById(uq.questId);
            const cid = rowCategoryId(uq, q);
            const accent = categoryAccentForCategoryId(cid);
            const title = rowTitle(uq, q);
            const tfLabel = q ? TIMEFRAME_LABEL[q.timeframe] : TIMEFRAME_LABEL.weekly;
            const stepTotal = q?.actionSteps.length ?? 0;
            const stepDone = q && stepTotal > 0 ? countCompletedJourneySteps(uq, q) : 0;
            const nextLabel =
              q && stepTotal > 0 ? getNextActionableStepLabel(uq, q) : rowShort(uq, q) || 'Continue when you are ready';
            const metaSteps = stepTotal > 0 ? `${stepDone}/${stepTotal} steps` : 'In motion';
            const started = new Date(uq.startedAt).toLocaleDateString(undefined, { dateStyle: 'medium' });

            return (
              <View key={uq.id} style={styles.rowWrap}>
                <HubDiscoverUserQuestRow
                  accentColor={accent}
                  categoryMeta={`${cid ? categoryName(cid) : 'Side quest'} · ${tfLabel} · ${metaSteps}`}
                  title={title}
                  subtitle={nextLabel}
                  metaLight={`Started ${started}`}
                  onRowPress={() => router.push(resumePath(q, uq) as never)}
                  primaryAction={{
                    label: QUEST_COPY.continueQuest,
                    onPress: () => router.push(resumePath(q, uq) as never),
                  }}
                />
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  pad: { padding: 20 },
  scroll: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    color: Theme.textMuted,
    marginBottom: 20,
    lineHeight: 22,
  },
  rowWrap: { marginBottom: 10 },
});
