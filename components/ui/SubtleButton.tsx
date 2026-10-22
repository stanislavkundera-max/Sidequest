import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Dawn } from '@/constants/Theme';

type Props = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Stretch to the card's width instead of hugging the label. */
  block?: boolean;
  accessibilityLabel?: string;
};

/**
 * A button that sits inside a cream card ("Continue" on a quest in motion, "Add a
 * memory"). A light rust tint with a thin outline and brown ink: a black pill there
 * broke the card (Standa, 2026-10-22). Ink measures 8.3:1 on the cream and 4.9:1
 * at the card's peach end.
 */
export function SubtleButton({ label, onPress, icon, block = false, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.button, block && styles.block, pressed && styles.pressed]}>
      {icon ? <Ionicons name={icon} size={16} color={Dawn.subtleText} /> : null}
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Dawn.subtleBorder,
    backgroundColor: Dawn.subtleFill,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  block: { alignSelf: 'stretch', minHeight: 46 },
  text: { color: Dawn.subtleText, fontSize: 14, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
