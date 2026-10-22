import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Dawn, Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { questArtFor } from '@/lib/questArt';
import { questDurationLabel, QUEST_COPY, TIMEFRAME_LABEL } from '@/src/features/quests/questCopy';
import type { Quest } from '@/src/types/quest';

function questMetaLine(q: Quest): string {
  return [TIMEFRAME_LABEL[q.timeframe], questDurationLabel(q.estimatedDurationMinutes)]
    .filter(Boolean)
    .join(' · ');
}

type Props = {
  quest: Quest;
  /** Kept for callers; the category now shows in the picture and the filter above. */
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

/**
 * A quest on offer in Journey (redesign screen 17): the category's illustrated scene on the
 * left, the name, one line about it, then Start now and a heart. The scene replaces the thin
 * colour stripe — the category shows in the land and the light (Standa: "aby všechny
 * kategorie měly odlišné obrázky", 2026-10-22).
 */
export function CatalogQuestRow({
  quest,
  busy = false,
  isNew = false,
  liked = false,
  onOpen,
  onStart,
  onLike,
  onUnlike,
}: Props) {
  const canHeart = liked ? Boolean(onUnlike) : Boolean(onLike);
  return (
    // Deliberately has no accessibilityRole: it contains the Start and Like
    // buttons, and a button inside a button is invalid markup and confuses
    // screen readers. Tapping the card is a shortcut to the detail screen;
    // the two real actions inside carry the accessible roles.
    <Pressable onPress={() => onOpen(quest.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* A fixed frame: the image fills it, so its own aspect ratio never sets the card's height. */}
      <View style={styles.artFrame}>
        <Image source={questArtFor(quest.id, quest.categoryId)} style={styles.art} resizeMode="cover" accessible={false} />
      </View>
      <View style={styles.body}>
        <View style={styles.metaRow}>
          {liked ? (
            <View style={[styles.badge, styles.badgeLiked]}>
              <Text style={styles.badgeText}>LIKED</Text>
            </View>
          ) : isNew ? (
            <View style={[styles.badge, styles.badgeNew]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          ) : null}
          <Text style={styles.meta} numberOfLines={1}>
            {questMetaLine(quest)}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {quest.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {quest.shortDescription}
        </Text>
        <View style={styles.actions}>
          <Pressable
            disabled={busy}
            onPress={() => onStart(quest.id)}
            accessibilityRole="button"
            accessibilityLabel={`${QUEST_COPY.startNow}: ${quest.title}`}
            accessibilityState={{ disabled: busy }}
            hitSlop={{ top: 4, bottom: 4 }}
            style={({ pressed }) => [styles.start, pressed && !busy && styles.pressed, busy && styles.disabled]}>
            <Text style={styles.startText}>{QUEST_COPY.startNow}</Text>
          </Pressable>
          {canHeart ? (
            <Pressable
              disabled={busy}
              onPress={() => (liked ? onUnlike?.() : onLike?.(quest.id))}
              accessibilityRole="button"
              accessibilityLabel={liked ? `Liked — tap to unlike: ${quest.title}` : `${QUEST_COPY.likeQuest}: ${quest.title}`}
              accessibilityState={{ disabled: busy, selected: liked }}
              hitSlop={(MIN_TOUCH_TARGET - 34) / 2}
              style={({ pressed }) => [
                styles.heart,
                liked && styles.heartOn,
                pressed && !busy && styles.pressed,
                busy && styles.disabled,
              ]}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? Theme.accent : Theme.text} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 140,
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Dawn.card,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
    boxShadow: '0 6px 16px rgba(20, 18, 10, 0.25)',
  },
  artFrame: { width: 104, alignSelf: 'stretch', overflow: 'hidden' },
  art: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  body: { flex: 1, minWidth: 0, paddingVertical: 12, paddingHorizontal: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeLiked: { backgroundColor: Theme.accent },
  badgeNew: { backgroundColor: '#e0823d' },
  badgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 0.8, color: Theme.onAccent },
  meta: { flexShrink: 1, fontSize: 12, fontFamily: 'Inter_500Medium', fontWeight: '500', color: Theme.textMuted },
  title: { marginTop: 4, fontSize: 15, lineHeight: 19, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  sub: { marginTop: 3, fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  actions: { marginTop: 'auto', paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  start: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#fff4e2',
    justifyContent: 'center',
    boxShadow: '0 3px 8px rgba(20, 18, 10, 0.3)',
  },
  startText: { fontSize: 13, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Dawn.primaryText },
  heart: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'rgba(243, 242, 236, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartOn: { borderColor: Theme.accent, backgroundColor: Theme.accentSoft },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.45 },
});
