import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import type { Quest, QuestActionStep, UserQuest } from '@/src/types/quest';

type JourneyMode = 'active' | 'completed' | 'browse';

function isStepDone(
  step: QuestActionStep,
  mode: JourneyMode,
  userQuest: UserQuest | undefined
): boolean {
  if (!userQuest) return false;
  if (mode === 'completed') return true;
  return Boolean(userQuest.stepProgress[step.id]);
}

export function QuestJourneyChecklist(props: {
  quest: Quest;
  mode: JourneyMode;
  userQuest?: UserQuest;
  accentColor: string;
  onToggleStep?: (stepId: string) => void;
}) {
  const { quest, mode, userQuest, accentColor, onToggleStep } = props;
  const steps = quest.actionSteps;
  if (steps.length === 0) return null;

  const intro = quest.journeyIntro?.trim();

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Your journey</Text>
      {intro ? <Text style={styles.intro}>{intro}</Text> : null}
      {mode === 'browse' ? (
        <Text style={styles.browseHint}>
          Add this quest to check off steps as you go.
        </Text>
      ) : null}
      <View style={styles.list}>
        {steps.map((step, index) => {
          const done = isStepDone(step, mode, userQuest);
          const interactive = mode === 'active' && onToggleStep;
          const checkBox = (
            <View
              style={[
                styles.check,
                { borderColor: accentColor },
                done && { backgroundColor: accentColor },
              ]}>
              {done ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
          );
          const body = (
            <View style={styles.rowBody}>
              <Text style={styles.stepTitle}>
                {index + 1}. {step.title}
              </Text>
              {step.detail ? (
                <Text style={styles.stepDetail}>{step.detail}</Text>
              ) : null}
            </View>
          );
          if (interactive) {
            return (
              <Pressable
                key={step.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                onPress={() => onToggleStep(step.id)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}>
                {checkBox}
                {body}
              </Pressable>
            );
          }
          return (
            <View key={step.id} style={styles.row}>
              {checkBox}
              {body}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
    color: Theme.text,
    marginBottom: 14,
  },
  browseHint: {
    fontSize: 14,
    color: Theme.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowPressed: { opacity: 0.85 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rowBody: { flex: 1 },
  stepTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: Theme.text,
    fontWeight: '500',
  },
  stepDetail: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.textMuted,
  },
});
