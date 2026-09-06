import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={Theme.accent} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    color: Theme.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
