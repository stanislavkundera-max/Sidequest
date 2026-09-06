import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { journeyHubStyles as styles } from '@/components/journey/journeyHubStyles';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { questDurationLabel, QUEST_COPY } from '@/src/features/quests/questCopy';
import { isRecentlyAdded } from '@/src/features/quests/suggestedQuests';
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
    // Deliberately has no accessibilityRole: it contains the Start and Like
    // buttons, and a button inside a button is invalid markup and confuses
    // screen readers. Tapping the card is a shortcut to the detail screen;
    // the two real actions inside carry the accessible roles.
    // TODO: the shortcut itself is still not reachable by keyboard or screen
    // reader. Fixing that properly means giving the card an explicit "details"
    // control rather than making the whole surface a button.
    <Pressable
      onPress={() => onOpen(quest.id)}
      style={({ pressed }) => [styles.discoverQuestRow, pressed && styles.pressed]}>
      <View style={[styles.discoverQuestAccent, { backgroundColor: accent }]} />
      <View style={styles.discoverQuestRowBody}>
        <View style={styles.metaRow}>
          <Text style={[styles.questRowMeta, { color: accent }]}>{categoryLabel}</Text>
          {/* The catalogue already sorts new quests to the top; this is the
              only thing that says so. Amber on dark text — the one pairing the
              brand colour passes contrast in (6.61:1). */}
          {isRecentlyAdded(quest) ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          ) : null}
        </View>
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
            accessibilityRole="button"
            accessibilityLabel={`${QUEST_COPY.startNow}: ${quest.title}`}
            accessibilityState={{ disabled: busy }}
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
              accessibilityRole="button"
              accessibilityLabel={`${QUEST_COPY.likeQuest}: ${quest.title}`}
              accessibilityState={{ disabled: busy }}
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
