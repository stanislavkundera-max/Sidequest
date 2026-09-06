import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
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
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Theme } from '@/constants/Theme';
import { alertCompat, alertTwoChoice } from '@/lib/alertCompat';
import { NO_EVIDENCE_NOTE } from '@/src/features/memories/memoryDraft';
import { memoryTitleFromBody } from '@/src/features/memories/memoryTitle';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

export default function MemoryDetailScreen() {
  const { id, justSaved, autoEdit } = useLocalSearchParams<{
    id: string;
    justSaved?: string;
    autoEdit?: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const quests = useQuestDomainStore((s) => s.quests);
  const loading = useMemoryStore((s) => s.loading);
  const saving = useMemoryStore((s) => s.saving);
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const deleteMemory = useMemoryStore((s) => s.deleteMemory);
  const memory = useMemoryStore((s) =>
    id ? s.memories.find((m) => m.id === id) : undefined
  );
  // Depends on `quests` rather than the stable `getQuestById` reference, which
  // never changes — so if the catalog arrived after the memory did, the quest
  // this memory came from stayed unnamed on screen. Same trap as quest/[id].
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quest = useMemo(
    () => (memory?.questId ? getQuestById(memory.questId) : undefined),
    [memory?.questId, quests]
  );

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isJustSaved = justSaved === '1';
  const autoEditHandledRef = useRef(false);

  // Auto-created memories with no real evidence land here with nothing
  // personal in them — open straight into editing instead of making the
  // user tap Edit first just to add the note they actually came to write.
  useEffect(() => {
    if (autoEditHandledRef.current || autoEdit !== '1' || !memory) return;
    autoEditHandledRef.current = true;
    setTitle(memory.title);
    setBody(memory.body === NO_EVIDENCE_NOTE ? '' : memory.body);
    setLocalUri(memory.photoUri);
    setEditing(true);
  }, [autoEdit, memory]);

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

  function startEditing() {
    if (!memory) return;
    setTitle(memory.title);
    setBody(memory.body);
    setLocalUri(memory.photoUri);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function pickImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        alertCompat('Permission', 'Photo access is needed to attach an image.');
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
      logError('memory.detail.pickImage', e);
      alertCompat('Could not open gallery', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  async function saveEdits() {
    if (!memory || !user) return;
    const text = body.trim();
    if (!text) {
      alertCompat('Write something', 'Add a few words about the experience.');
      return;
    }
    try {
      await updateMemory(user.id, memory.id, {
        title: title.trim() || memoryTitleFromBody(text),
        body: text,
        photoUri: localUri,
      });
      setEditing(false);
    } catch (e: unknown) {
      alertCompat('Error', e instanceof Error ? e.message : 'Could not save changes.');
    }
  }

  function confirmDelete() {
    if (!memory || !user) return;
    alertTwoChoice(
      'Delete this memory?',
      'This permanently removes it. This cannot be undone.',
      {
        cancel: { text: 'Cancel' },
        confirm: {
          text: 'Delete',
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                await deleteMemory(user.id, memory.id);
                router.replace('/(tabs)/memories');
              } catch (e: unknown) {
                logError('memory.detail.delete', e, { memoryId: memory.id });
                alertCompat('Error', e instanceof Error ? e.message : 'Could not delete memory.');
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      }
    );
  }

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

  if (editing) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Memory title"
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
              <Image source={{ uri: localUri }} style={styles.image} resizeMode="contain" />
              <Pressable onPress={() => setLocalUri(null)} style={styles.removePhoto}>
                <Text style={styles.removePhotoText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => void pickImage()} style={styles.pickBtn}>
              <Text style={styles.pickBtnText}>Choose photo</Text>
            </Pressable>
          )}

          <PrimaryButton label="Save changes" loading={saving} onPress={() => void saveEdits()} />
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={cancelEditing}
            style={({ pressed }) => [styles.cancelLink, pressed && !saving && styles.pressed]}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {isJustSaved ? (
          <View style={styles.savedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={Theme.accent} />
            <Text style={styles.savedBannerText}>Saved to your memories</Text>
          </View>
        ) : null}

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
          <Image source={{ uri: memory.photoUri }} style={styles.image} resizeMode="contain" />
        ) : null}
        <Text style={styles.body}>{memory.body}</Text>

        {isJustSaved ? (
          <PrimaryButton label="Done" onPress={() => router.replace('/(tabs)/memories')} />
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit memory"
            onPress={startEditing}
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}>
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete memory"
            disabled={deleting}
            onPress={confirmDelete}
            style={({ pressed }) => [
              styles.deleteBtn,
              deleting && styles.disabled,
              pressed && !deleting && styles.pressed,
            ]}>
            <Text style={styles.deleteBtnText}>{deleting ? 'Deleting…' : 'Delete'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.accentSoft,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  savedBannerText: { fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.accent },
  date: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted, marginBottom: 16 },
  title: {
    fontSize: 20,
    fontFamily: 'Fraunces_600SemiBold',
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
    fontFamily: 'Inter_400Regular',
  },
  body: { fontSize: 18, fontFamily: 'Inter_400Regular', lineHeight: 28, color: Theme.text },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  editBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
  },
  editBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  deleteBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.danger,
    backgroundColor: Theme.dangerSoft,
  },
  deleteBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.danger },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
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
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_400Regular',
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
  removePhoto: { marginTop: 8 },
  removePhotoText: { color: Theme.danger, fontWeight: '600' },
  cancelLink: { alignSelf: 'center', paddingVertical: 14 },
  cancelLinkText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.textMuted },
});
