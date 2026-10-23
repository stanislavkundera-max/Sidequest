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

import { MemoryCategoryPicker } from '@/components/memory/MemoryCategoryPicker';
import { memoryFormStyles as form } from '@/components/memory/memoryFormStyles';
import { CategoryTag, categoryKeyForId } from '@/components/ui/CategoryTag';
import { DawnBackground } from '@/components/ui/DawnBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Dawn, Theme } from '@/constants/Theme';
import { alertCompat, alertTwoChoice } from '@/lib/alertCompat';
import { plainErrorMessage } from '@/lib/userFacingError';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';
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
  const bootstrapMemories = useMemoryStore((s) => s.bootstrap);
  const bootstrapQuests = useQuestDomainStore((s) => s.bootstrap);

  // Deep links / web reloads land here before the tabs layout ever mounts, and
  // memories only load there — so opening a memory directly said "Memory not
  // found" for one that exists. Same fix quest/[id] and the runner carry.
  // Both bootstraps return early once loaded.
  useEffect(() => {
    if (!user) return;
    void bootstrapMemories(user.id);
    void bootstrapQuests(user.id);
  }, [user, bootstrapMemories, bootstrapQuests]);
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
  const getCategoryById = useQuestDomainStore((s) => s.getCategoryById);
  // Shown in place of the quest line for a hand-written memory (R2-11).
  const ownCategory =
    memory && !memory.questId && memory.categoryId
      ? getCategoryById(memory.categoryId)
      : undefined;

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
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
    setCategoryId(memory.categoryId);
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
    setCategoryId(memory.categoryId);
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
      alertCompat("Your photos didn't open", plainErrorMessage(e, "Try again in a moment."));
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
        // Quest memories take their quest's category; only a free-standing one stores its own.
        categoryId: memory.questId ? undefined : categoryId,
      });
      setEditing(false);
    } catch (e: unknown) {
      alertCompat("That didn't go through", plainErrorMessage(e, "Your changes didn't save. Try again in a moment."));
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
                alertCompat("That didn't go through", plainErrorMessage(e, "Couldn't delete this memory. Try again in a moment."));
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
      <DawnBackground>
      <SafeAreaView style={styles.safeClear} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.titleInput}
            multiline
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

          {!memory.questId ? (
            <>
              <Text style={styles.label}>Place (optional)</Text>
              <MemoryCategoryPicker value={categoryId} onChange={setCategoryId} />
            </>
          ) : null}

          <Text style={styles.label}>Photo (optional)</Text>
          {localUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: localUri }} style={styles.image} resizeMode="contain" />
              <Pressable onPress={() => setLocalUri(null)} style={styles.removePhoto}>
                <Text style={styles.removePhotoText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => void pickImage()}
              accessibilityRole="button"
              accessibilityLabel="Choose a photo"
              style={({ pressed }) => [styles.pickBtn, pressed && { opacity: 0.8 }]}>
              <Ionicons name="image-outline" size={20} color={Theme.accent} />
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
      </DawnBackground>
    );
  }

  const ownKey = !quest && ownCategory ? categoryKeyForId(ownCategory.id) : null;
  return (
    <DawnBackground>
    <SafeAreaView style={styles.safeClear} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Dawn (screen 32): your photo leads, then when, the title, where it came from. */}
        {memory.photoUri ? (
          <Image source={{ uri: memory.photoUri }} style={styles.image} resizeMode="cover" />
        ) : null}
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
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`From quest: ${quest.title}. Open the quest`}
            onPress={() => router.push(`/quest/${quest.id}`)}
            style={({ pressed }) => [
              styles.questChip,
              { backgroundColor: categoryAccentForCategoryId(quest.categoryId) },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="leaf-outline" size={13} color="#ffffff" />
            <Text style={styles.questChipText} numberOfLines={1}>
              From quest: {quest.title}
            </Text>
          </Pressable>
        ) : ownKey ? (
          <View style={styles.ownTag}>
            <CategoryTag category={ownKey} />
          </View>
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
            <Ionicons name="create-outline" size={18} color={Theme.text} />
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
            <Ionicons name="trash-outline" size={18} color={Theme.danger} />
            <Text style={styles.deleteBtnText}>{deleting ? 'Deleting…' : 'Delete'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
    </DawnBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  safeClear: { flex: 1 },
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
  savedBannerText: { fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700', color: Theme.text },
  date: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Theme.textMuted, marginBottom: 8 },
  title: {
    fontSize: 28,
    lineHeight: 33,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Theme.text,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: Theme.surface,
  },
  questChip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(246, 234, 214, 0.55)',
    marginBottom: 16,
  },
  questChipText: { flexShrink: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#ffffff' },
  ownTag: { marginBottom: 16 },
  questContext: {
    marginBottom: 14,
    color: Theme.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  body: { fontSize: 17, fontFamily: 'Inter_400Regular', lineHeight: 27, color: '#e8e1cc', marginBottom: 24 },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  editBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: Dawn.card,
  },
  editBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  deleteBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: Dawn.card,
  },
  deleteBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.danger },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
  label: form.label,
  input: form.input,
  titleInput: form.titleInput,
  pickBtn: form.pickBtn,
  pickBtnText: form.pickBtnText,
  previewWrap: form.previewWrap,
  removePhoto: form.removePhoto,
  removePhotoText: form.removePhotoText,
  cancelLink: { alignSelf: 'center', paddingVertical: 14 },
  cancelLinkText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.textMuted },
});
