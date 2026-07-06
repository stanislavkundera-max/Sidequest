import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { stepInteractionStyles as styles } from '@/components/quest-run/stepInteractionStyles';
import { Theme } from '@/constants/Theme';
import type { UserQuestStepEvidence } from '@/src/types/quest';

type Props = {
  prompt: string;
  count: number;
  itemLabel?: string;
  accent: string;
  busy: boolean;
  onComplete: (evidence: UserQuestStepEvidence) => void;
};

/** "Find N things" step: each one has to be named individually. */
export function CounterStepAction({ prompt, count, itemLabel, accent, busy, onComplete }: Props) {
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const label = itemLabel ?? 'thing';
  const remaining = Math.max(0, count - items.length);
  const ready = remaining === 0;
  const draftReady = draft.trim().length >= 2;

  function addItem() {
    const value = draft.trim();
    if (!value || items.length >= count) return;
    setItems((prev) => [...prev, value]);
    setDraft('');
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.block}>
      <Text style={styles.prompt}>{prompt}</Text>
      {items.map((item, i) => (
        <View key={`${item}-${i}`} style={styles.itemRow}>
          <Text style={[styles.itemIndex, { color: accent }]}>{i + 1}</Text>
          <Text style={styles.itemText} numberOfLines={2}>
            {item}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item}`}
            hitSlop={8}
            onPress={() => removeItem(i)}
            style={({ pressed }) => [styles.itemRemove, pressed && styles.pressed]}>
            <Ionicons name="close" size={16} color={Theme.textMuted} />
          </Pressable>
        </View>
      ))}
      {!ready ? (
        <View style={styles.addRow}>
          <TextInput
            style={[styles.inputSingle, { flex: 1 }]}
            placeholder={`Name one ${label}…`}
            placeholderTextColor={Theme.textMuted}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${label}`}
            disabled={!draftReady}
            onPress={addItem}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && draftReady && styles.pressed,
              !draftReady && styles.disabled,
            ]}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      ) : null}
      <Text style={styles.helper}>
        {ready
          ? `All ${count} noted — nicely observed.`
          : `${remaining} ${remaining === 1 ? label : `${label}s`} to go.`}
      </Text>
      <PrimaryButton
        label="Finish this step"
        disabled={!ready}
        loading={busy}
        onPress={() => onComplete({ kind: 'items', items })}
      />
    </View>
  );
}
