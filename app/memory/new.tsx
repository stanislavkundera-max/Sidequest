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

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Theme } from '@/constants/Theme';
import { alertCompat } from '@/lib/alertCompat';
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
  const quests = useQuestDomainStore((s) => s.quests);
  const bootstrap = useQuestDomainStore((s) => s.bootstrap);
  const memoryError = useMemoryStore((s) => s.error);
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

  const [title, setTitle] = useState<string>(quest?.title ?? '');
  const titleTouchedRef = useRef(false);

  // The initial useState above only runs once, so a quest that arrives later
  // would never reach the field. Fill it in when it does — but never over
  // something the person has typed.
  useEffect(() => {
    if (titleTouchedRef.current || !quest) return;
    setTitle((current) => (current ? current : quest.title));
  }, [quest]);
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
        'Could not open gallery',
        e instanceof Error ? e.message : 'Please try again.'
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
    } catch (e: unknown) {
      trackEvent('memory_creation_failed', {
        sourceScreen: 'memory_new',
        questId: qid,
        hasPhoto: Boolean(localUri),
      }).catch(() => undefined);
      logError('memory.new.save', e, { questId: qid, hasPhoto: Boolean(localUri) });
      alertCompat('Error', e instanceof Error ? e.message : 'Save failed');
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

        <Text style={styles.label}>Photo (optional)</Text>
        {localUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: localUri }} style={styles.preview} resizeMode="contain" />
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
