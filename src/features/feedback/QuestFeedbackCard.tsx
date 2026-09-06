import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { trackEvent } from '@/src/lib/analytics';

const FEEDBACK_KEY = '@side_quest_life/quest_feedback_submitted_v1';

type SubmittedMap = Record<string, true>;

type QuestFeedbackCardProps = {
  userId: string;
  questId: string;
  sourceScreen: string;
};

async function readSubmittedMap(): Promise<SubmittedMap> {
  const raw = await AsyncStorage.getItem(FEEDBACK_KEY);
  if (!raw) return {};
  try {
    return (JSON.parse(raw) as SubmittedMap) ?? {};
  } catch {
    return {};
  }
}

async function writeSubmittedMap(next: SubmittedMap): Promise<void> {
  await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
}

export function QuestFeedbackCard({
  userId,
  questId,
  sourceScreen,
}: QuestFeedbackCardProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [note, setNote] = useState('');

  async function submit() {
    if (!rating) return;
    const submissionId = `${userId}:${questId}`;
    const existing = await readSubmittedMap();
    if (existing[submissionId]) {
      setStatus('sent');
      return;
    }

    setStatus('sending');
    // `userId` is deliberately NOT duplicated into the properties blob. The
    // analytics_events table already carries it in a real column, and that
    // column is the only one account deletion can null out — anything copied
    // into the jsonb survives deletion and quietly re-identifies the row.
    // `note` is free text the user wrote, so it is listed in
    // ANALYTICS_USER_CONTENT_KEYS and scrubbed by delete_own_account().
    await trackEvent('quest_feedback_submitted', {
      questId,
      rating,
      note: note.trim() || null,
      sourceScreen,
    });

    await writeSubmittedMap({ ...existing, [submissionId]: true });
    setStatus('sent');
  }

  if (status === 'sent') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Thanks for your feedback.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>How did this quest feel?</Text>
      <Text style={styles.sub}>Optional, helps improve quest quality.</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setRating('up')}
          style={({ pressed }) => [
            styles.btn,
            rating === 'up' && styles.btnSelected,
            pressed && styles.btnPressed,
          ]}>
          <Text style={[styles.btnText, rating === 'up' && styles.btnTextSelected]}>
            Meaningful
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setRating('down')}
          style={({ pressed }) => [
            styles.btn,
            rating === 'down' && styles.btnSelected,
            pressed && styles.btnPressed,
          ]}>
          <Text style={[styles.btnText, rating === 'down' && styles.btnTextSelected]}>
            Not quite
          </Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Optional note"
        placeholderTextColor={Theme.textMuted}
        value={note}
        onChangeText={setNote}
      />
      {rating ? (
        <Pressable
          onPress={() => {
            void submit();
          }}
          disabled={status === 'sending'}
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && styles.btnPressed,
            status === 'sending' && styles.sendBtnDisabled,
          ]}>
          <Text style={styles.sendBtnText}>
            {status === 'sending' ? 'Sending…' : 'Send feedback'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Theme.surface,
    gap: 8,
  },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Theme.text },
  sub: { color: Theme.textMuted, fontSize: 13, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Theme.bg,
  },
  btnPressed: { opacity: 0.9 },
  btnSelected: { backgroundColor: Theme.accentSoft, borderColor: Theme.accent },
  btnText: { color: Theme.text, fontSize: 13, fontFamily: 'Inter_500Medium', fontWeight: '500' },
  btnTextSelected: { color: Theme.accent, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Theme.text,
    backgroundColor: Theme.bg,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sendBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Theme.accent,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
});
