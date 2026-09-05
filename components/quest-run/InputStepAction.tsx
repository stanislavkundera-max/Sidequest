import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { stepInteractionStyles as styles } from '@/components/quest-run/stepInteractionStyles';
import { Theme } from '@/constants/Theme';
import type { UserQuestStepEvidence } from '@/src/types/quest';

type Props = {
  prompt: string;
  /**
   * @deprecated Ignored since 2026-09-05 and kept only so the existing journey
   * data still type-checks. Writing is optional now — see the note below.
   */
  minChars?: number;
  placeholder?: string;
  busy: boolean;
  onComplete: (evidence: UserQuestStepEvidence) => void;
};

/**
 * Written-answer step. The question is specific, so what someone writes is
 * worth something — but writing it is optional.
 *
 * This used to block the step until 20 characters (sometimes 40) had been
 * typed, counting down the ones still "missing". That is a word count standing
 * between a person and finishing a quest they actually did, which reads as a
 * test rather than an invitation and contradicts the minimal-friction principle
 * in AGENTS.md. Standa's call, 2026-09-05.
 *
 * The guidance moved into the placeholder, where it suggests instead of
 * demanding. An empty answer is allowed and handled downstream — the memory
 * builder already has a no-evidence path for exactly this case.
 */
export function InputStepAction({ prompt, placeholder, busy, onComplete }: Props) {
  const [text, setText] = useState('');
  const trimmed = text.trim();

  return (
    <View style={styles.block}>
      <Text style={styles.prompt}>{prompt}</Text>
      <TextInput
        style={styles.input}
        multiline
        textAlignVertical="top"
        placeholder={placeholder ?? 'A sentence or two, in your own words — or skip it.'}
        placeholderTextColor={Theme.textMuted}
        value={text}
        onChangeText={setText}
      />
      <PrimaryButton
        label="Finish this step"
        loading={busy}
        onPress={() => onComplete({ kind: 'text', text: trimmed })}
      />
    </View>
  );
}
