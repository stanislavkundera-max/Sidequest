import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { InMotionCard } from '@/components/explore/InMotionCard';
import type { useQuestActions } from '@/components/quests/useQuestActions';
import { Dawn } from '@/constants/Theme';
import { QUEST_COPY } from '@/src/features/quests/questCopy';
import { countCompletedJourneySteps } from '@/src/features/quests/questHelpers';
import { useQuestDomainStore } from '@/src/features/quests/questStore';

type Props = {
  actions: Pick<ReturnType<typeof useQuestActions>, 'onContinue' | 'primaryBusy'>;
};

const SIDE = 16;
const GAP = 10;

/**
 * Every quest in motion, one card each, along the bottom of the map (redesign screen 15).
 * Quests in motion live only on Explore since Journey stopped listing them (Standa,
 * 2026-10-21), so this is where they are always one tap away. Swipe for the next; the next
 * card peeks in from the right so it is clear there is more.
 */
export function InMotionCarousel({ actions }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const userQuests = useQuestDomainStore((s) => s.userQuests);
  const categories = useQuestDomainStore((s) => s.categories);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const [index, setIndex] = useState(0);

  const active = useMemo(
    () =>
      userQuests
        .filter((uq) => uq.status === 'active')
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    [userQuests]
  );

  if (active.length === 0) return null;

  // One card leaves room for the next to peek in.
  const cardWidth = active.length > 1 ? width - SIDE * 2 - 40 : width - SIDE * 2;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP));
    if (i !== index) setIndex(Math.max(0, Math.min(active.length - 1, i)));
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      {active.length > 1 ? (
        <View style={styles.dots} accessible={false}>
          {active.map((uq, i) => (
            <View key={uq.id} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={styles.row}
        accessibilityLabel={`Quests in motion, ${active.length}`}>
        {active.map((uq) => {
          const q = getQuestById(uq.questId);
          const cid = uq.snapshotCategoryId || q?.categoryId || '';
          const stepTotal = q?.actionSteps.length ?? 0;
          return (
            <View key={uq.id} style={{ width: cardWidth }}>
              <InMotionCard
                compact
                categoryId={cid}
                categoryName={categories.find((c) => c.id === cid)?.name ?? ''}
                title={uq.snapshotTitle?.trim() || q?.title || 'Side quest'}
                stepDone={q && stepTotal > 0 ? countCompletedJourneySteps(uq, q) : 0}
                stepTotal={stepTotal}
                actionLabel={QUEST_COPY.continueQuest}
                onPress={() => router.push(`/quest/${uq.questId}` as never)}
                onAction={() => actions.onContinue(uq)}
                disabled={actions.primaryBusy}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0, bottom: 12 },
  row: { paddingHorizontal: SIDE, gap: GAP, paddingVertical: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(246, 234, 214, 0.45)' },
  dotOn: { width: 18, backgroundColor: Dawn.cream },
});
