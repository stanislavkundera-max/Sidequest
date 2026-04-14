import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Theme } from '@/constants/Theme';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { useSessionStore } from '@/stores/session';

export default function MemoriesScreen() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const memories = useMemoryStore((s) => s.memories);
  const loading = useMemoryStore((s) => s.loading);
  const error = useMemoryStore((s) => s.error);
  const refresh = useMemoryStore((s) => s.refresh);

  useFocusEffect(
    useCallback(() => {
      trackEvent('memories_timeline_viewed', {
        sourceScreen: 'memories_tab',
      }).catch(() => undefined);
    }, [])
  );

  const ordered = useMemo(
    () =>
      [...memories].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [memories]
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: 20 }}>
          <EmptyState
            title="Sign in required"
            message="Please sign in to view your memories."
            actionLabel="Go to sign in"
            onAction={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading && ordered.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState label="Loading memories..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Memories</Text>
        <Pressable
          onPress={() => {
            trackEvent('memory_creation_started', {
              sourceScreen: 'memories_tab',
            }).catch(() => undefined);
            router.push('/memory/new');
          }}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.addBtnText}>+ New</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>
        Your reflections in reverse chronological order.
      </Text>
      {error ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <ErrorState
            message={error}
            onRetry={
              user
                ? () => {
                    refresh(user.id);
                  }
                : undefined
            }
          />
        </View>
      ) : null}

      <FlatList
        data={ordered}
        keyExtractor={(m) => m.id}
        contentContainerStyle={
          ordered.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <EmptyState
            title="No memories yet"
            message="Complete a quest or add a short reflection to begin your timeline."
            actionLabel="Pick a quest"
            onAction={() => router.push('/quest/select' as never)}
          />
        }
        renderItem={({ item }) => (
          <MemoryRow id={item.id} onPress={(id) => router.push(`/memory/${id}`)} />
        )}
      />
    </SafeAreaView>
  );
}

function MemoryRow({
  id,
  onPress,
}: {
  id: string;
  onPress: (id: string) => void;
}) {
  const entry = useMemoryStore((s) => s.memories.find((m) => m.id === id));
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  if (!entry) return null;
  const quest = entry.questId ? getQuestById(entry.questId) : undefined;

  return (
    <Pressable
      onPress={() => onPress(entry.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Text style={styles.cardDate}>
        {new Date(entry.createdAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </Text>
      {entry.title ? (
        <Text style={styles.cardTitle} numberOfLines={2}>
          {entry.title}
        </Text>
      ) : null}
      {quest ? <Text style={styles.cardMeta}>{quest.title}</Text> : null}
      {entry.photoUri ? (
        <Image source={{ uri: entry.photoUri }} style={styles.cardImage} />
      ) : (
        <Text style={styles.noPhotoText}>No photo</Text>
      )}
      <Text style={styles.cardBody} numberOfLines={3}>
        {entry.body}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: { fontSize: 28, fontWeight: '600', color: Theme.text },
  addBtn: {
    backgroundColor: Theme.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  sub: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 16,
    color: Theme.textMuted,
    fontSize: 15,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  cardPressed: { opacity: 0.92 },
  cardDate: { fontSize: 12, color: Theme.textMuted, marginBottom: 8 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 6,
  },
  cardMeta: { fontSize: 13, color: Theme.textMuted, marginBottom: 10 },
  cardImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: Theme.border,
  },
  noPhotoText: { color: Theme.textMuted, fontSize: 12, marginBottom: 10 },
  cardBody: { fontSize: 16, lineHeight: 24, color: Theme.text },
});
