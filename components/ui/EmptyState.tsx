import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Dawn, Theme } from '@/constants/Theme';

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** A small illustration above the title (e.g. Memories' path to the cairn, screen 33). */
  art?: ReactNode;
};

/**
 * "Nothing here yet" and friends. Dawn (canvas screens 33, 38): centred on the ground, no box
 * around it, the one way forward a cream pill.
 */
export function EmptyState({ title, message, actionLabel, onAction, art }: Props) {
  return (
    <View style={styles.wrap}>
      {art ? <View style={styles.art}>{art}</View> : null}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12 },
  art: { marginBottom: 18 },
  title: {
    color: Theme.text,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#e6dfca',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  btn: {
    marginTop: 20,
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: Dawn.primaryFill,
    borderRadius: 24,
    paddingHorizontal: 22,
  },
  btnText: { color: Dawn.primaryText, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  pressed: { opacity: 0.88 },
});
