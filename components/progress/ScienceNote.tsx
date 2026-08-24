import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';
import { Theme } from '@/constants/Theme';

const RESEARCH_NOTE =
  "People who get outside for at least two hours a week report meaningfully " +
  "better health and wellbeing than people who don't — and it doesn't have to " +
  'be one big trip, short visits add up the same way (White et al., 2019). A ' +
  'single 90-minute walk in nature measurably quiets the part of the brain ' +
  'tied to rumination (Bratman et al., 2015). And on the other side of it: ' +
  'minds running on autopilot are reliably less happy than minds that are ' +
  'actually somewhere, doing something — regardless of what that something ' +
  'is (Killingsworth & Gilbert, 2010).';

/** Tucked-away credibility note — collapsed by default, for the curious. */
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
        <Text style={styles.toggleText}>Why this works</Text>
        <Ionicons
          name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={14}
          color={Theme.textMuted}
        />
      </Pressable>
      {open ? <Text style={styles.note}>{RESEARCH_NOTE}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginTop: 4, marginBottom: 20 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    minHeight: MIN_TOUCH_TARGET,
    paddingRight: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.textMuted,
    textDecorationLine: 'underline',
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: Theme.textMuted,
  },
  pressed: { opacity: 0.85 },
});
