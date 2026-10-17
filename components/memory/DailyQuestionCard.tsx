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
 * Memories tab is the journal, so the question belongs there, always visible and drawn like a
 * page — "nějak hezky vizualizovaná". One question per calendar day, the same for everyone;
 * nothing counted, no notification.
 *
 * The top is a band of the valley painting at sunrise — a path running into the mountains — so
 * the card opens the tab on something hopeful rather than a form (Standa: "pozitivní vizuál,
 * inspirativní"). The same painting the Journey tab is drawn from, so it belongs to the app.
 *
 * Paper is recommended, writing here is offered ("some people will want to journal on the
 * tram"): **Write it here** opens a new memory titled with the question.
 */
/** 571×1024, a sunrise valley with a path into the mountains (also used by Journey). */
const VALLEY = require('@/assets/images/journey-valley-background.png');
const VALLEY_ASPECT = 1024 / 571;
const BAND_HEIGHT = 140;
/** Where the band starts, as a share of the painting's height: the peaks and the path's first bends. */
const BAND_FROM = 0.27;

export function DailyQuestionCard() {
  const router = useRouter();
  const [bandWidth, setBandWidth] = useState(0);
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
    <View style={styles.page} accessibilityRole="summary">
      <View style={styles.band} onLayout={(e) => setBandWidth(e.nativeEvent.layout.width)}>
        {bandWidth > 0 ? (
          <Image
            source={VALLEY}
            accessible={false}
            style={{
              position: 'absolute',
              left: 0,
              width: bandWidth,
              height: bandWidth * VALLEY_ASPECT,
              top: -bandWidth * VALLEY_ASPECT * BAND_FROM,
            }}
          />
        ) : null}
        <View style={styles.headRow}>
          {/* Amber as a filled tab behind dark text — the only way it reads (Theme.accentWarm). */}
          <View style={styles.tab}>
            <Ionicons name="create-outline" size={13} color={Theme.accentWarmText} />
            <Text style={styles.tabText}>Today&apos;s question</Text>
          </View>
          <View style={styles.dayPill}>
            <Text style={styles.day}>{day}</Text>
          </View>
        </View>
      </View>

      <View style={styles.paper}>
        <Text style={styles.question}>{prompt}</Text>

        {/* Two ruled lines: a page waiting to be written on. */}
        <View style={styles.rule} />
        <View style={styles.rule} />

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
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  band: {
    height: BAND_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#e9d6b8',
    padding: 12,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  paper: { paddingTop: 14, paddingBottom: 12, paddingHorizontal: 16 },
  // A light chip so the date reads on any part of the sky.
  dayPill: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(252, 251, 248, 0.85)',
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
  day: { fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  question: {
    fontSize: 18,
    lineHeight: 25,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.text,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Theme.border,
    marginTop: 18,
  },
  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  note: { flexShrink: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  writeBtn: {
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Theme.accent,
    backgroundColor: Theme.accentSoft,
  },
  writeBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.accent },
  pressed: { opacity: 0.85 },
});
