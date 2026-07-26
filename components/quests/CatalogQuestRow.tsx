import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { journeyHubStyles as styles } from '@/components/journey/journeyHubStyles';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { questDurationLabel, QUEST_COPY } from '@/src/features/quests/questCopy';
import type { Quest } from '@/src/types/quest';

const TF_META: Record<Quest['timeframe'], string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function questMetaLine(q: Quest): string {
  return [TF_META[q.timeframe], questDurationLabel(q.estimatedDurationMinutes)]
    .filter(Boolean)
    .join(' · ');
}

type Props = {
  quest: Quest;
  categoryLabel: string;
  busy?: boolean;
  onOpen: (questId: string) => void;
  onStart: (questId: string) => void;
  onLike?: (questId: string) => void;
};

/** Shared catalog-quest row (Explore recommendations + Journey full list). */
export function CatalogQuestRow({
  quest,
  categoryLabel,
  busy = false,
  onOpen,
  onStart,
  onLike,
}: Props) {
  const accent = categoryAccentForCategoryId(quest.categoryId);
  return (
    <Pressable
      onPress={() => onOpen(quest.id)}
      style={({ pressed }) => [styles.discoverQuestRow, pressed && styles.pressed]}>
      <View style={[styles.discoverQuestAccent, { backgroundColor: accent }]} />
      <View style={styles.discoverQuestRowBody}>
        <Text style={styles.questRowMeta}>{categoryLabel}</Text>
        <Text style={styles.questRowTitle} numberOfLines={3}>
          {quest.title}
        </Text>
        <Text style={styles.questRowSub} numberOfLines={3}>
          {quest.shortDescription}
        </Text>
        <Text style={styles.questRowMetaLight}>{questMetaLine(quest)}</Text>
        <View style={styles.questRowActions}>
          <Pressable
            disabled={busy}
            onPress={() => onStart(quest.id)}
            style={({ pressed }) => [
              styles.btnSubtleSolid,
              pressed && !busy && styles.pressed,
              busy && styles.disabled,
            ]}>
            <Text style={styles.btnSubtleSolidText}>{QUEST_COPY.startNow}</Text>
          </Pressable>
          {onLike ? (
            <Pressable
              disabled={busy}
              onPress={() => onLike(quest.id)}
              style={({ pressed }) => [
                styles.btnSubtleLight,
                pressed && !busy && styles.pressed,
                busy && styles.disabled,
              ]}>
              <Ionicons name="heart" size={13} color={Theme.accent} />
              <Text style={styles.btnSubtleLightText}>{QUEST_COPY.likeQuest}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
