import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Theme.dangerBorder,
    borderRadius: 12,
    backgroundColor: Theme.dangerSoft,
    padding: 14,
  },
  title: { color: Theme.danger, fontWeight: '600', fontSize: 15, marginBottom: 4 },
  message: { color: Theme.danger, fontSize: 14, lineHeight: 20 },
  retry: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Theme.dangerBorder,
  },
  retryText: { color: Theme.danger, fontWeight: '600', fontSize: 14 },
  pressed: { opacity: 0.9 },
});
