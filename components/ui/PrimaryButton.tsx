import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Dawn } from '@/constants/Theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

/**
 * The one main action on a screen. Dawn: a cream pill with dark ink — the brightest
 * thing on the warm ground, so it reads first without a loud colour. Secondary
 * actions use SecondaryButton; a button inside a cream card uses SubtleButton.
 */
export function PrimaryButton({ label, onPress, disabled = false, loading = false }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}>
      {loading ? <ActivityIndicator color={Dawn.primaryText} /> : <Text style={styles.text}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Dawn.primaryFill,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: { color: Dawn.primaryText, fontWeight: '700', fontSize: 16, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.5 },
});
