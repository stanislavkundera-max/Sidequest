import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  line: string;
  /** Journey column width for wrapping. */
  contentWidth: number;
  /** From `journeyUiScale` — scales type for small phones. */
  uiScale: number;
  onPress: () => void;
};

export function JourneyNarrative({ line, contentWidth, uiScale, onPress }: Props) {
  const padH = Math.round(12 + 4 * uiScale);
  const padV = Math.round(8 + 3 * uiScale);
  const fontSize = Math.round(12 + 2 * uiScale);
  const lineHeight = Math.round(fontSize * 1.38);
  const maxW = Math.min(contentWidth - padH * 2, 360);

  return (
    <View style={[styles.wrap, { left: padH, right: padH, bottom: Math.round(14 + 4 * uiScale) }]} accessibilityLiveRegion="polite">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Open quest chooser"
        style={({ pressed }) => [
          styles.pill,
          { maxWidth: maxW, paddingHorizontal: padH, paddingVertical: padV },
          pressed && styles.pillPressed,
        ]}>
        <Text style={[styles.text, { fontSize, lineHeight }]}>{line}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  pill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pillPressed: {
    opacity: 0.88,
  },
  text: {
    textAlign: 'center',
    color: 'rgba(28,26,22,0.94)',
    fontWeight: '600',
    letterSpacing: 0.15,
  },
});
