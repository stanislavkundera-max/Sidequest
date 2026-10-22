import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Dawn, Theme } from '@/constants/Theme';

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

// Dawn (canvas screen 38): a quiet card with a warm-red rim — what went wrong, in plain words,
// and a cream "Try again". The white button it had read 2:1 once the ground went dark.
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Theme.dangerBorder,
    borderRadius: 20,
    backgroundColor: Dawn.card,
    padding: 16,
  },
  title: { color: Theme.text, fontWeight: '700', fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  message: { color: Theme.textMuted, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  retry: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: Dawn.primaryFill,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  retryText: { color: Dawn.primaryText, fontWeight: '700', fontSize: 14, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.9 },
});
