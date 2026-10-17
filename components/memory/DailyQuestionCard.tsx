import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { dailyPromptFor } from '@/src/constants/dailyPrompts';
import { trackEvent } from '@/src/lib/analytics';

/**
 * Today's journaling question, at the top of Memories (task 57, option A).
 *
 * It started as a folded pill on the map; Standa moved it here the same day (2026-10-17): the
 * Memories tab is the journal, so the question belongs there, always visible — "pozitivní vizuál,
 * inspirativní", then "ať to zabírá míň místa… písmo zajímavou barvou, dej to na ten obrázek".
 * So the whole card is the valley painting at sunrise (the sky and the peaks, from the painting
 * the Journey tab is drawn from) under a light cream veil, the question written on it in the
 * brand's forest green. One question per calendar day, the same for everyone; nothing counted,
 * no notification.
 *
 * Paper is recommended, writing here is offered ("some people will want to journal on the
 * tram"): **Write it here** opens a new memory titled with the question.
 */

/** 571×1024, a sunrise valley with a path into the mountains (also used by Journey). */
const VALLEY = require('@/assets/images/journey-valley-background.png');
const VALLEY_ASPECT = 1024 / 571;
/** Where the card's window starts, as a share of the painting's height: the sunrise sky and peaks. */
const WINDOW_FROM = 0.16;

/**
 * Words on the painting, measured (2026-10-17) against every pixel of the card's window after the
 * veil below: the question in forest green, worst 4.11:1 (19 px bold needs 3:1); the date and the
 * note in the regular ink, worst 6.0:1 (small text needs 4.5:1). A dark overlay with cream words
 * was tried first — readable, but it turned the sunrise into dusk.
 */
const FOREST = '#33471f'; // BRANDING.md §2 — the splash and icon ground
const VEIL = 'rgba(255, 244, 220, 0.35)';
const CREAM_TEXT = '#fff4dc';

export function DailyQuestionCard() {
  const router = useRouter();
  const [width, setWidth] = useState(0);
  const [now, setNow] = useState(() => new Date());
  // Re-read on every visit, so a tab left open overnight moves on to the new day's question.
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
    }, [])
  );
  const prompt = dailyPromptFor(now);
  const day = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  const writeHere = () => {
    trackEvent('daily_prompt_write_tapped', { sourceScreen: 'memories_tab' }).catch(() => undefined);
    router.push({ pathname: '/memory/new', params: { prompt } } as never);
  };

  return (
    <View
      style={styles.card}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="summary">
      {width > 0 ? (
        <Image
          source={VALLEY}
          accessible={false}
          style={{
            position: 'absolute',
            left: 0,
            width,
            height: width * VALLEY_ASPECT,
            top: -width * VALLEY_ASPECT * WINDOW_FROM,
          }}
        />
      ) : null}
      {/* A light morning veil: keeps the sunrise, lifts the darkest hills enough for green words. */}
      <View style={styles.veil} />

      <View style={styles.headRow}>
        {/* Amber as a filled tab behind dark text — the only way it reads (Theme.accentWarm). */}
        <View style={styles.tab}>
          <Ionicons name="create-outline" size={13} color={Theme.accentWarmText} />
          <Text style={styles.tabText}>Today&apos;s question</Text>
        </View>
        <Text style={styles.day}>{day}</Text>
      </View>

      <Text style={styles.question}>{prompt}</Text>

      <View style={styles.footRow}>
        <Text style={styles.note}>Best on paper — take a pen.</Text>
        <Pressable
          onPress={writeHere}
          accessibilityRole="button"
          accessibilityLabel="Write the answer in the app"
          style={({ pressed }) => [styles.writeBtn, pressed && styles.pressed]}>
          <Text style={styles.writeBtnText}>Write it here</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3dfc4',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VEIL,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: Theme.accentWarm,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.accentWarmText,
  },
  day: { flexShrink: 1, fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  question: {
    fontSize: 19,
    lineHeight: 26,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: FOREST,
  },
  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  note: { flexShrink: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  writeBtn: {
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: FOREST,
  },
  writeBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', fontWeight: '700', color: CREAM_TEXT },
  pressed: { opacity: 0.85 },
});
