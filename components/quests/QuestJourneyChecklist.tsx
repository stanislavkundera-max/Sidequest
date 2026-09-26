import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { stepKindIcon } from '@/components/quest-run/stepKindIcon';
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
}) {
  const { quest, mode, userQuest, accentColor } = props;
  const steps = quest.actionSteps;
  if (steps.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Your journey</Text>
      {/* No journeyIntro here: this screen already shows shortDescription right above,
          and in 16 of 41 quests the two said the same thing (two were word for word
          identical). The runner's start screen keeps the intro — it has no
          shortDescription. R2-10, 2026-09-26. */}
      {/* Two explanatory sentences used to sit here ("Add this quest, then use the runner…",
          "Steps update from the guided runner…"). The Begin button and the ticks say the same,
          and nobody knows what "the runner" is. Removed 2026-09-26. */}
      <View style={styles.list}>
        {steps.map((step, index) => {
          const done = isStepDone(step, mode, userQuest);
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
              <View style={styles.titleRow}>
                {/* The kind of step — camera, clock, pencil — so the shape of the quest
                    can be read without a sentence explaining it. */}
                <Ionicons name={stepKindIcon(step)} size={15} color={Theme.textMuted} />
                <Text style={[styles.stepTitle, styles.titleText]}>
                  {index + 1}. {step.title}
                </Text>
              </View>
              {step.detail ? (
                <Text style={[styles.stepDetail, styles.detailIndent]}>{step.detail}</Text>
              ) : null}
            </View>
          );
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
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  browseHint: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Theme.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  rowBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  titleText: { flex: 1 },
  // Icon width (15) + gap (6): keeps the description under the title text, not the icon.
  detailIndent: { marginLeft: 21 },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    lineHeight: 22,
    color: Theme.text,
    fontWeight: '500',
  },
  stepDetail: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: Theme.textMuted,
  },
});
