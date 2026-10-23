import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { Dawn, Theme } from '@/constants/Theme';

const RESEARCH_NOTE =
  "People who get outside for at least two hours a week report meaningfully " +
  "better health and wellbeing than people who don't — and it doesn't have to " +
  'be one big trip, short visits add up the same way (White et al., 2019). A ' +
  'single 90-minute walk in nature measurably quiets the part of the brain ' +
  'tied to rumination (Bratman et al., 2015). And on the other side of it: ' +
  'minds running on autopilot are reliably less happy than minds that are ' +
  'actually somewhere, doing something — regardless of what that something ' +
  'is (Killingsworth & Gilbert, 2010).';

/**
 * Tucked-away credibility note — collapsed by default, for the curious. Dawn (screen 34): a
 * quiet card with an info mark and one line saying what is inside.
 */
export function ScienceNote() {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Hide why this works' : 'Why this works'}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
        <Ionicons name="information-circle-outline" size={20} color={Theme.accent} />
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleText}>Why this works</Text>
          <Text style={styles.toggleHint}>Small real things, a memory each time</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Theme.accent} />
      </Pressable>
      {open ? <Text style={styles.note}>{RESEARCH_NOTE}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
    backgroundColor: 'rgba(246, 234, 214, 0.1)',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: MIN_TOUCH_TARGET + 14,
    paddingHorizontal: 16,
  },
  toggleTextWrap: { flex: 1 },
  toggleText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  toggleHint: { marginTop: 2, fontSize: 12, fontFamily: 'Inter_400Regular', color: Theme.textMuted },
  note: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: '#e6dfca',
  },
  pressed: { opacity: 0.85 },
});
