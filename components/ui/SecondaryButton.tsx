import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Dawn } from '@/constants/Theme';

type Props = {
  label: string;
  onPress: () => void;
  /** Drawn dark in a peach disc on the left. */
  icon: keyof typeof Ionicons.glyphMap;
  /** A chevron on the right, for actions that move you somewhere. */
  chevron?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/**
 * A secondary action on the Dawn ground ("Find another quest", "Share it",
 * "Continue without an account"): a solid peach outline, light text and the icon
 * in a peach disc (Standa, 2026-10-22, from canvas screen 16). Quieter than the
 * cream PrimaryButton, but never mistaken for an empty slot the way the dashed
 * version was. Dismissive actions (Close, Cancel) stay neutral text buttons.
 */
export function SecondaryButton({ label, onPress, icon, chevron = false, disabled = false, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        chevron ? styles.withChevron : null,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View style={styles.disc}>
        <Ionicons name={icon} size={18} color={Dawn.primaryText} />
      </View>
      <Text style={styles.text}>{label}</Text>
      {chevron ? <Ionicons name="chevron-forward" size={18} color={Dawn.secondaryText} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: Dawn.secondaryBorder,
    backgroundColor: Dawn.secondaryFill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 20,
    boxShadow: '0 6px 16px rgba(20, 18, 10, 0.3)',
  },
  withChevron: { paddingRight: 16 },
  disc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Dawn.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, color: Dawn.secondaryText, fontSize: 15, lineHeight: 20, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
