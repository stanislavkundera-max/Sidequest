import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    backgroundColor: Theme.surface,
    padding: 16,
  },
  title: { color: Theme.text, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  message: { color: Theme.textMuted, fontSize: 14, lineHeight: 21 },
  btn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: Theme.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  btnText: { color: Theme.accent, fontWeight: '600', fontSize: 14 },
  pressed: { opacity: 0.9 },
});
