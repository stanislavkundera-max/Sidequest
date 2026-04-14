import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Theme } from '@/constants/Theme';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const loading = useMemoryStore((s) => s.loading);
  const memory = useMemoryStore((s) =>
    id ? s.memories.find((m) => m.id === id) : undefined
  );
  const quest = useMemo(
    () => (memory?.questId ? getQuestById(memory.questId) : undefined),
    [memory, getQuestById]
  );

  useLayoutEffect(() => {
    if (!memory) return;
    trackEvent('memory_viewed', {
      sourceScreen: 'memory_detail',
      memoryId: memory.id,
      questId: memory.questId,
      hasPhoto: Boolean(memory.photoUri),
    }).catch(() => undefined);
  }, [memory]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Memory',
    });
  }, [navigation]);

  if (loading && !memory) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <LoadingState label="Loading memory..." />
      </SafeAreaView>
    );
  }

  if (!memory) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.scroll}>
          <EmptyState
            title="Memory not found"
            message="This memory may have been removed."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.date}>
          {new Date(memory.createdAt).toLocaleString(undefined, {
            dateStyle: 'full',
            timeStyle: 'short',
          })}
        </Text>
        {memory.title ? <Text style={styles.title}>{memory.title}</Text> : null}
        {quest ? (
          <Text style={styles.questContext}>From quest: {quest.title}</Text>
        ) : null}
        {memory.photoUri ? (
          <Image source={{ uri: memory.photoUri }} style={styles.image} />
        ) : null}
        <Text style={styles.body}>{memory.body}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.bg,
  },
  muted: { color: Theme.textMuted },
  date: { fontSize: 13, color: Theme.textMuted, marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: Theme.border,
  },
  questContext: {
    marginBottom: 14,
    color: Theme.textMuted,
    fontSize: 14,
  },
  body: { fontSize: 18, lineHeight: 28, color: Theme.text },
});
