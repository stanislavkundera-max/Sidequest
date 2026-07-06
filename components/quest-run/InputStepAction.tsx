import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { stepInteractionStyles as styles } from '@/components/quest-run/stepInteractionStyles';
import { Theme } from '@/constants/Theme';
import type { UserQuestStepEvidence } from '@/src/types/quest';

const DEFAULT_MIN_CHARS = 20;

type Props = {
  prompt: string;
  minChars?: number;
  placeholder?: string;
  busy: boolean;
  onComplete: (evidence: UserQuestStepEvidence) => void;
};

/** Written-answer step: the question is specific, so faking costs more than doing. */
export function InputStepAction({ prompt, minChars, placeholder, busy, onComplete }: Props) {
  const [text, setText] = useState('');
  const required = Math.max(1, minChars ?? DEFAULT_MIN_CHARS);
  const trimmed = text.trim();
  const missing = Math.max(0, required - trimmed.length);
  const ready = missing === 0;

  return (
    <View style={styles.block}>
      <Text style={styles.prompt}>{prompt}</Text>
      <TextInput
        style={styles.input}
        multiline
        textAlignVertical="top"
        placeholder={placeholder ?? 'Write it in your own words…'}
        placeholderTextColor={Theme.textMuted}
        value={text}
        onChangeText={setText}
      />
      <Text style={styles.helper}>
        {ready
          ? 'Looks good — finish when it feels true.'
          : `A few more words (${missing} characters to go).`}
      </Text>
      <PrimaryButton
        label="Finish this step"
        disabled={!ready}
        loading={busy}
        onPress={() => onComplete({ kind: 'text', text: trimmed })}
      />
    </View>
  );
}
