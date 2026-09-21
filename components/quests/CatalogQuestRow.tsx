import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { journeyHubStyles as styles } from '@/components/journey/journeyHubStyles';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
import { questDurationLabel, QUEST_COPY, TIMEFRAME_LABEL } from '@/src/features/quests/questCopy';
import type { Quest } from '@/src/types/quest';

function questMetaLine(q: Quest): string {
  return [TIMEFRAME_LABEL[q.timeframe], questDurationLabel(q.estimatedDurationMinutes)]
    .filter(Boolean)
    .join(' · ');
}

type Props = {
  quest: Quest;
  categoryLabel: string;
  busy?: boolean;
  /**
   * Show the NEW badge — new in the catalogue or newly opened to *you*, and not
   * yet opened either way. Parent's call.
   */
  isNew?: boolean;
  /**
   * Already hearted. The card stays where it is, pinned at the top of its
   * category, and the heart becomes the way to take the like back (R2-05).
   */
  liked?: boolean;
  onOpen: (questId: string) => void;
  onStart: (questId: string) => void;
  onLike?: (questId: string) => void;
  /** Required for the heart to do anything on a liked card. */
  onUnlike?: () => void;
};

/** Shared catalog-quest row (Explore recommendations + Journey full list). */
export function CatalogQuestRow({
  quest,
  categoryLabel,
  busy = false,
  isNew = false,
  liked = false,
  onOpen,
  onStart,
  onLike,
  onUnlike,
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
              brand colour passes contrast in (6.61:1).
              The parent decides: recently added *and* not yet opened. */}
          {isNew ? (
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
          {liked && onUnlike ? (
            <Pressable
              disabled={busy}
              onPress={onUnlike}
              accessibilityRole="button"
              accessibilityLabel={`Liked — tap to unlike: ${quest.title}`}
              accessibilityState={{ disabled: busy, selected: true }}
              style={({ pressed }) => [
                styles.btnSubtleLight,
                { backgroundColor: Theme.accentSoft, borderColor: Theme.accent },
                pressed && !busy && styles.pressed,
                busy && styles.disabled,
              ]}>
              <Ionicons name="heart" size={13} color={Theme.accent} />
              <Text style={styles.btnSubtleLightText}>Liked</Text>
            </Pressable>
          ) : !liked && onLike ? (
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
              {/* Outline until liked, so the filled heart on a liked card reads as a state. */}
              <Ionicons name="heart-outline" size={13} color={Theme.accent} />
              <Text style={styles.btnSubtleLightText}>{QUEST_COPY.likeQuest}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
