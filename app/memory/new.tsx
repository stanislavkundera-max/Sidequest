import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Theme } from '@/constants/Theme';
import { memoryTitleFromBody } from '@/src/features/memories/memoryTitle';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

export default function NewMemoryScreen() {
  const router = useRouter();
  const { questId } = useLocalSearchParams<{ questId?: string }>();
  const user = useSessionStore((s) => s.user);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const memoryError = useMemoryStore((s) => s.error);
  const memorySaving = useMemoryStore((s) => s.saving);
  const createMemoryForQuest = useMemoryStore((s) => s.createMemoryForQuest);

  const quest = useMemo(
    () => (questId ? getQuestById(String(questId)) : undefined),
    [questId]
  );

  const [title, setTitle] = useState<string>(quest?.title ?? '');
  const [body, setBody] = useState('');
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const startedTracked = useRef(false);
  const hasForeignQuestId = Boolean(questId);
  const invalidQuestId = hasForeignQuestId && !quest;

  useEffect(() => {
    if (startedTracked.current) return;
    startedTracked.current = true;
    trackEvent('memory_creation_started', {
      sourceScreen: 'memory_new',
      questId: quest?.id ?? null,
    }).catch(() => undefined);
  }, [quest?.id]);

  async function pickImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission', 'Photo access is needed to attach an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setLocalUri(result.assets[0].uri);
      }
    } catch (e: unknown) {
      logError('memory.new.pickImage', e);
      Alert.alert(
        'Could not open gallery',
        e instanceof Error ? e.message : 'Please try again.'
      );
    }
  }

  async function save() {
    const text = body.trim();
    if (!text) {
      Alert.alert('Write something', 'Add a few words about the experience.');
      return;
    }
    const resolvedTitle = title.trim() || memoryTitleFromBody(text);
    const qid = quest?.id ?? null;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to save memories.');
      return;
    }

    setSaving(true);
    try {
      const entry = await createMemoryForQuest(user.id, {
        questId: qid,
        title: resolvedTitle,
        body: text,
        photoUri: localUri,
      });
      trackEvent('memory_created', {
        sourceScreen: 'memory_new',
        memoryId: entry.id,
        questId: qid,
        hasPhoto: Boolean(localUri),
      }).catch(() => undefined);
      Alert.alert('Memory saved', 'Your reflection was added to memories.', [
        {
          text: 'View memory',
          onPress: () => router.replace(`/memory/${entry.id}`),
        },
        { text: 'Go to memories', onPress: () => router.replace('/(tabs)/memories') },
      ]);
    } catch (e: unknown) {
      trackEvent('memory_creation_failed', {
        sourceScreen: 'memory_new',
        questId: qid,
        hasPhoto: Boolean(localUri),
      }).catch(() => undefined);
      logError('memory.new.save', e, { questId: qid, hasPhoto: Boolean(localUri) });
      Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        {invalidQuestId ? (
          <EmptyState
            title="Quest not available"
            message="This memory can still be saved without a quest link."
          />
        ) : null}

        {memoryError ? <ErrorState message={memoryError} /> : null}

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.titleInput}
          placeholder={quest?.title ?? 'Memory title'}
          placeholderTextColor={Theme.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>What stayed with you?</Text>
        <TextInput
          style={styles.input}
          multiline
          textAlignVertical="top"
          placeholder="A feeling, a detail, a small surprise…"
          placeholderTextColor={Theme.textMuted}
          value={body}
          onChangeText={setBody}
        />

        <Text style={styles.label}>Photo (optional)</Text>
        {localUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: localUri }} style={styles.preview} />
            <Pressable onPress={() => setLocalUri(null)} style={styles.removePhoto}>
              <Text style={styles.removePhotoText}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => void pickImage()} style={styles.pickBtn}>
            <Text style={styles.pickBtnText}>Choose photo</Text>
          </Pressable>
        )}

        {localUri && (saving || memorySaving) ? (
          <Text style={styles.uploadingHint}>Uploading photo...</Text>
        ) : null}

        <PrimaryButton
          label="Save memory"
          loading={saving || memorySaving}
          onPress={() => {
            void save();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textMuted,
    marginBottom: 8,
  },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Theme.text,
    backgroundColor: Theme.surface,
    marginBottom: 20,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.text,
    backgroundColor: Theme.surface,
    marginBottom: 16,
  },
  pickBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 28,
  },
  pickBtnText: { color: Theme.accent, fontWeight: '600' },
  previewWrap: { marginBottom: 24 },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: Theme.border,
  },
  removePhoto: { marginTop: 8 },
  removePhotoText: { color: Theme.danger, fontWeight: '600' },
  uploadingHint: { color: Theme.textMuted, marginBottom: 10, fontSize: 13 },
});
