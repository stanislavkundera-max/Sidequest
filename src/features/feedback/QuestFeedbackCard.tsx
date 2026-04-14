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
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');
  const [note, setNote] = useState('');

  async function submit(rating: 'up' | 'down') {
    const submissionId = `${userId}:${questId}`;
    const existing = await readSubmittedMap();
    if (existing[submissionId]) {
      setStatus('sent');
      return;
    }

    await trackEvent('quest_feedback_submitted', {
      userId,
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
          onPress={() => {
            void submit('up');
          }}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
          <Text style={styles.btnText}>Meaningful</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void submit('down');
          }}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
          <Text style={styles.btnText}>Not quite</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Optional note"
        placeholderTextColor={Theme.textMuted}
        value={note}
        onChangeText={setNote}
      />
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
  title: { fontSize: 15, fontWeight: '600', color: Theme.text },
  sub: { color: Theme.textMuted, fontSize: 13 },
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
  btnText: { color: Theme.text, fontSize: 13, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Theme.text,
    backgroundColor: Theme.bg,
    fontSize: 14,
  },
});
