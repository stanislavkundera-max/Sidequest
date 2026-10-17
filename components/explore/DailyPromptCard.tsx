import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { dailyPromptFor } from '@/src/constants/dailyPrompts';
import { trackEvent } from '@/src/lib/analytics';

/**
 * Today's journaling question, on the map (task 57, option A — Standa, 2026-10-17).
 *
 * Folded into a small "Today's question" pill in the corner opposite the map's info button, so
 * the painting stays the screen; tapping opens the card. One question a day, nothing counted, no
 * notification — opening the app tomorrow simply shows a new one.
 *
 * Paper is recommended, writing here is offered: "some people will want to journal on the
 * tram" (Standa). Writing here opens a new memory with the question as its title.
 */
export function DailyPromptCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Read when opened, so an app left open overnight shows the new day's question.
  const [prompt, setPrompt] = useState(() => dailyPromptFor());

  const toggle = () => {
    if (!open) {
      setPrompt(dailyPromptFor());
      trackEvent('daily_prompt_opened', { sourceScreen: 'explore' }).catch(() => undefined);
    }
    setOpen((o) => !o);
  };

  const writeHere = () => {
    trackEvent('daily_prompt_write_tapped', { sourceScreen: 'explore' }).catch(() => undefined);
    setOpen(false);
    router.push({ pathname: '/memory/new', params: { prompt } } as never);
  };

  return (
    <View style={styles.corner} pointerEvents="box-none">
      <Pressable
        onPress={toggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={open ? "Hide today's question" : "Today's question"}
        style={[styles.pill, open && styles.pillOpen]}>
        <Ionicons
          name={open ? 'close' : 'create-outline'}
          size={14}
          color={open ? Theme.text : 'rgba(255, 255, 255, 0.95)'}
        />
        <Text style={[styles.pillText, open && styles.pillTextOpen]}>Today&apos;s question</Text>
      </Pressable>

      {open ? (
        <View style={styles.card}>
          <Text style={styles.prompt}>{prompt}</Text>
          <Text style={styles.note}>Best on paper — take a pen. On the move? Write it here.</Text>
          <Pressable
            onPress={writeHere}
            accessibilityRole="button"
            accessibilityLabel="Write the answer in the app"
            style={({ pressed }) => [styles.writeBtn, pressed && styles.pressed]}>
            <Text style={styles.writeBtnText}>Write it here</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Top left: the info button holds the top right (ExploreMapScene).
  corner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 56,
    alignItems: 'flex-start',
    zIndex: 3,
  },
  // Same quiet glass as the map's info button, so it reads as part of the map's chrome.
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 24, 18, 0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  pillOpen: {
    backgroundColor: 'rgba(252, 251, 248, 0.95)',
    borderColor: Theme.border,
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  pillTextOpen: { color: Theme.text },
  card: {
    marginTop: 8,
    maxWidth: 320,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(252, 251, 248, 0.97)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    gap: 10,
  },
  prompt: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.text,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
    color: Theme.textMuted,
  },
  writeBtn: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Theme.accent,
    backgroundColor: Theme.accentSoft,
  },
  writeBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.accent,
  },
  pressed: { opacity: 0.85 },
});
