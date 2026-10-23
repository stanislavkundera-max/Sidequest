import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { stepKindIcon } from '@/components/quest-run/stepKindIcon';
import { Dawn, Theme } from '@/constants/Theme';
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
  // accentColor is kept for callers. On the Dawn ground the dark category colours make weak
  // ticks, so the ticks are the warm orange of the frozen design (screens 19–21).
  const { quest, mode, userQuest } = props;
  const steps = quest.actionSteps;
  if (steps.length === 0) return null;
  const nextIndex = mode === 'active' ? steps.findIndex((st) => !isStepDone(st, mode, userQuest)) : -1;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>
        {mode === 'browse' ? `Your journey · ${steps.length} steps` : 'Your journey'}
      </Text>
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
          // Before you start, the list is a preview of the shape of the quest, so it is
          // titles only: no empty tick-box (it looks tappable and isn't) and no description
          // under each step. This page is there to describe and sell the quest, not to be
          // its manual — the detail lines appear once you are actually doing it.
          const browse = mode === 'browse';
          const isNext = index === nextIndex;
          const checkBox = browse ? (
            <View style={styles.kindBox}>
              <Ionicons name={stepKindIcon(step)} size={16} color={Dawn.secondaryBorder} />
            </View>
          ) : (
            <View style={[styles.check, done && styles.checkDone, isNext && styles.checkNext]}>
              {done ? <Ionicons name="checkmark" size={15} color={Dawn.primaryText} /> : null}
            </View>
          );
          const body = (
            <View style={styles.rowBody}>
              <View style={styles.titleRow}>
                {/* The kind of step — camera, clock, pencil — so the shape of the quest can be
                    read without a sentence explaining it. Before you start it is the box on the
                    left; once you are doing it the box is the tick and the icon sits by the title. */}
                {browse ? null : <Ionicons name={stepKindIcon(step)} size={15} color={Theme.textMuted} />}
                <Text
                  style={[
                    styles.stepTitle,
                    styles.titleText,
                    done && mode === 'active' && styles.stepTitleDone,
                    isNext && styles.stepTitleNext,
                  ]}>
                  {browse ? `${index + 1}. ${step.title}` : step.title}
                </Text>
                {isNext ? <Text style={styles.nextTag}>NEXT</Text> : null}
              </View>
              {step.detail && !browse ? (
                <Text style={[styles.stepDetail, styles.detailIndent]}>{step.detail}</Text>
              ) : null}
            </View>
          );
          return (
            <View key={step.id} style={[styles.row, browse && styles.rowBrowse, isNext && styles.rowNext]}>
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
    backgroundColor: Dawn.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Dawn.cardBorder,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  list: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 14 },
  rowBrowse: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(246, 234, 214, 0.12)', borderRadius: 0 },
  // The step you are on, lifted out of the list.
  rowNext: { backgroundColor: 'rgba(240, 178, 122, 0.14)' },
  kindBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(240, 178, 122, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(246, 234, 214, 0.35)',
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: '#e0823d', borderColor: '#e0823d' },
  checkNext: { borderColor: '#e0823d' },
  rowBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleText: { flex: 1 },
  // Icon width (15) + gap (6): keeps the description under the title text, not the icon.
  detailIndent: { marginLeft: 21 },
  stepTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    lineHeight: 21,
    color: Theme.text,
    fontWeight: '500',
  },
  stepTitleDone: { color: Theme.textMuted, textDecorationLine: 'line-through' },
  stepTitleNext: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
  nextTag: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 0.8, color: Dawn.secondaryText },
  stepDetail: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    color: Theme.textMuted,
  },
});
