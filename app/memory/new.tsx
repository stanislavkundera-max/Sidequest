import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import { Ionicons } from '@expo/vector-icons';

import { MemoryCategoryPicker } from '@/components/memory/MemoryCategoryPicker';
import { memoryFormStyles as form } from '@/components/memory/memoryFormStyles';
import { DawnBackground } from '@/components/ui/DawnBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Theme } from '@/constants/Theme';
import { alertCompat } from '@/lib/alertCompat';
import { plainErrorMessage } from '@/lib/userFacingError';
import { memoryTitleFromBody } from '@/src/features/memories/memoryTitle';
import { useMemoryStore } from '@/src/features/memories/memoryStore';
import { useQuestDomainStore } from '@/src/features/quests/questStore';
import { trackEvent } from '@/src/lib/analytics';
import { logError } from '@/src/lib/monitoring/errorLogger';
import { useSessionStore } from '@/stores/session';

export default function NewMemoryScreen() {
  const router = useRouter();
  // `prompt`: today's journaling question from the map (task 57) — it becomes the title.
  const { questId, prompt } = useLocalSearchParams<{ questId?: string; prompt?: string }>();
  const user = useSessionStore((s) => s.user);
  const getQuestById = useQuestDomainStore((s) => s.getQuestById);
  const quests = useQuestDomainStore((s) => s.quests);
  const bootstrap = useQuestDomainStore((s) => s.bootstrap);
  const memoryError = useMemoryStore((s) => s.error);
  const clearMemoryError = useMemoryStore((s) => s.clearError);
  // A failed auto-save at quest completion sends you here via "Add a memory" —
  // and its error used to be waiting, above a form you had not submitted yet
  // (R2-04). This screen shows only errors from its own save.
  useEffect(() => {
    clearMemoryError();
  }, [clearMemoryError]);
  const memorySaving = useMemoryStore((s) => s.saving);
  const createMemoryForQuest = useMemoryStore((s) => s.createMemoryForQuest);

  // The catalog only loads in the tabs layout, so a web refresh of this modal
  // left it empty — and with a questId in the URL that rendered "Quest not
  // available" for a quest that is perfectly available.
  useEffect(() => {
    if (user && questId && quests.length === 0) void bootstrap(user.id);
  }, [user, questId, quests.length, bootstrap]);

  // Depends on `quests`, not on the stable `getQuestById` reference: on a cold
  // entry to this screen the catalog arrives after the first render, and
  // without this the quest stayed undefined for the life of the screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quest = useMemo(
    () => (questId ? getQuestById(String(questId)) : undefined),
    [questId, quests]
  );

  const [title, setTitle] = useState<string>(
    quest?.title ?? (typeof prompt === 'string' ? prompt : '')
  );
  const titleTouchedRef = useRef(false);

  // The initial useState above only runs once, so a quest that arrives later
  // would never reach the field. Fill it in when it does — but never over
  // something the person has typed.
  useEffect(() => {
    if (titleTouchedRef.current || !quest) return;
    setTitle((current) => (current ? current : quest.title));
  }, [quest]);
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
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
      logError('memory.new.pickImage', e);
      alertCompat(
        "Your photos didn't open",
        plainErrorMessage(e, "Try again in a moment.")
      );
    }
  }

  async function save() {
    if (saving || memorySaving) return;
    const text = body.trim();
    if (!text) {
      alertCompat('Write something', 'Add a few words about the experience.');
      return;
    }
    const resolvedTitle = title.trim() || memoryTitleFromBody(text);
    const qid = quest?.id ?? null;
    if (!user) {
      alertCompat('Sign in required', 'Please sign in to save memories.');
      return;
    }

    setSaving(true);
    try {
      const entry = await createMemoryForQuest(user.id, {
        questId: qid,
        title: resolvedTitle,
        body: text,
        photoUri: localUri,
        categoryId: qid ? null : categoryId,
      });
      trackEvent('memory_created', {
        sourceScreen: 'memory_new',
        memoryId: entry.id,
        questId: qid,
        hasPhoto: Boolean(localUri),
      }).catch(() => undefined);
      // Navigate straight to the saved memory instead of showing a confirmation
      // dialog: a multi-button Alert.alert never renders on web, so the button
      // re-enabled with no visible feedback and testers tapped Save repeatedly,
      // creating duplicate entries. The screen change is the confirmation.
      router.replace({ pathname: '/memory/[id]', params: { id: entry.id, justSaved: '1' } });
      if (entry.photoFailed) {
        // Single-button, so it renders on web too (see the note above).
        alertCompat(
          'Saved without the photo',
          "Your memory is saved, but the photo didn't upload. You can add it again from the memory."
        );
      }
    } catch (e: unknown) {
      trackEvent('memory_creation_failed', {
        sourceScreen: 'memory_new',
        questId: qid,
        hasPhoto: Boolean(localUri),
      }).catch(() => undefined);
      logError('memory.new.save', e, { questId: qid, hasPhoto: Boolean(localUri) });
      alertCompat("That didn't go through", plainErrorMessage(e, "Your memory didn't save. Try again in a moment."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DawnBackground>
    <SafeAreaView style={styles.safeClear} edges={['bottom']}>
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

        {/* Where the title came from, when it came from today's question (screen 31). */}
        {typeof prompt === 'string' && prompt && !quest ? (
          <View style={styles.fromQuestion}>
            <Ionicons name="create-outline" size={14} color={Theme.accent} />
            <Text style={styles.fromQuestionText}>From today's question</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.titleInput}
          multiline
          placeholder={quest?.title ?? 'Memory title'}
          placeholderTextColor={Theme.textMuted}
          value={title}
          onChangeText={(t) => {
            titleTouchedRef.current = true;
            setTitle(t);
          }}
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

        {/* A quest's memory takes the quest's category; only a free-standing one gets to choose. */}
        {!quest ? (
          <>
            <Text style={styles.label}>Place (optional)</Text>
            <MemoryCategoryPicker value={categoryId} onChange={setCategoryId} />
          </>
        ) : null}

        <Text style={styles.label}>Photo (optional)</Text>
        {localUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: localUri }} style={styles.preview} resizeMode="contain" />
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
    </DawnBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.bg },
  safeClear: { flex: 1 },
  fromQuestion: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Theme.accentSoft,
    marginBottom: 18,
  },
  fromQuestionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  scroll: { padding: 20, paddingBottom: 40 },
  label: form.label,
  input: form.input,
  titleInput: form.titleInput,
  pickBtn: form.pickBtn,
  pickBtnText: form.pickBtnText,
  previewWrap: form.previewWrap,
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: Theme.border,
  },
  removePhoto: form.removePhoto,
  removePhotoText: form.removePhotoText,
  uploadingHint: { color: Theme.textMuted, marginBottom: 10, fontSize: 13, fontFamily: 'Inter_400Regular' },
});
