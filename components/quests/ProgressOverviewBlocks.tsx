import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text, TouchableRipple } from 'react-native-paper';

import { Theme } from '@/constants/Theme';
import { categoryIconNameForCategoryId } from '@/lib/categoryIcons';
import type { NextProgressAction } from '@/src/features/quests/questHelpers';
import type { QuestTimeframe } from '@/src/types/quest';

const TF_SHORT: Record<QuestTimeframe, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

type TimeframeSlotsSummaryProps = {
  counts: Record<QuestTimeframe, number>;
  /** When set, labels show `count / limit` per cadence (legacy). Omit to show counts only. */
  limits?: Record<QuestTimeframe, number>;
  /** Which timeframe’s overview is currently shown (highlights that tab). */
  selectedTimeframe: QuestTimeframe;
  onSelectTimeframe: (tf: QuestTimeframe) => void;
};

export function TimeframeSlotsSummary({
  counts,
  limits,
  selectedTimeframe,
  onSelectTimeframe,
}: TimeframeSlotsSummaryProps) {
  const label = (tf: QuestTimeframe) => {
    const n = counts[tf];
    if (limits) return `${TF_SHORT[tf]} ${n}/${limits[tf]}`;
    return `${TF_SHORT[tf]} · ${n}`;
  };
  return (
    <View accessibilityLabel="Active quest counts by timeframe on your path">
      <SegmentedButtons
        value={selectedTimeframe}
        onValueChange={(v) => onSelectTimeframe(v as QuestTimeframe)}
        buttons={[
          { value: 'weekly', label: label('weekly') },
          { value: 'monthly', label: label('monthly') },
          { value: 'yearly', label: label('yearly') },
        ]}
        style={styles.segmentedWrap}
      />
    </View>
  );
}

type CompactActiveQuestRowProps = {
  title: string;
  categoryId: string;
  /** First unchecked journey step (or wrap-up hint). Shown under the title. */
  nextStepLabel: string;
  stepDone: number;
  stepTotal: number;
  accentColor: string;
  onPress: () => void;
};

function categoryShortLabel(categoryId: string): string {
  switch (categoryId) {
    case 'cat-nature':
      return 'Nature';
    case 'cat-adventure':
      return 'Adventure';
    case 'cat-social':
      return 'Social';
    case 'cat-relax':
      return 'Relax';
    default:
      return 'Quest';
  }
}

export function CompactActiveQuestRow({
  title,
  categoryId,
  nextStepLabel,
  stepDone,
  stepTotal,
  accentColor,
  onPress,
}: CompactActiveQuestRowProps) {
  const iconName = categoryIconNameForCategoryId(categoryId);
  const catLabel = categoryShortLabel(categoryId);
  const stepLabel = stepTotal > 0 ? `${stepDone}/${stepTotal} steps` : 'Steps';
  return (
    <Card style={styles.compactRow} mode="elevated">
      <TouchableRipple
        accessibilityRole="button"
        accessibilityLabel={`${title}. Category ${catLabel}. Next step: ${nextStepLabel}. ${stepLabel}.`}
        onPress={onPress}
        borderless>
        <View style={styles.compactRowInner}>
          <View style={[styles.compactAccent, { backgroundColor: accentColor }]} />
          <View style={styles.compactBody}>
            <View style={styles.compactTop}>
              <Text variant="titleSmall" style={styles.compactTitle} numberOfLines={2}>
                {title}
              </Text>
              <Button
                mode="outlined"
                compact
                textColor={accentColor}
                style={[styles.stepButton, { borderColor: accentColor }]}>
                {stepLabel}
              </Button>
            </View>
            <View style={[styles.nextStepHighlight, { borderLeftColor: accentColor }]}>
              <Text variant="labelSmall" style={[styles.nextStepPrefix, { color: accentColor }]}>
                Next actionable
              </Text>
              <Text variant="bodyLarge" style={styles.nextStepText} numberOfLines={3}>
                {nextStepLabel}
              </Text>
            </View>
            <View style={styles.footerRow}>
              <Text variant="labelMedium" style={styles.footerMeta}>
                {catLabel}
              </Text>
              <View
                style={[styles.categoryIconBadge, { borderColor: accentColor }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants">
                <FontAwesome name={iconName} size={15} color={accentColor} />
              </View>
            </View>
          </View>
        </View>
      </TouchableRipple>
    </Card>
  );
}

type NextActionCalloutProps = {
  action: NextProgressAction | null;
  hasAnyActive: boolean;
  onOpenQuest: (questId: string) => void;
  onBrowseQuests: () => void;
};

export function NextActionCallout({
  action,
  hasAnyActive,
  onOpenQuest,
  onBrowseQuests,
}: NextActionCalloutProps) {
  if (!hasAnyActive) {
    return (
      <Card style={styles.callout} mode="elevated">
        <Card.Content>
          <Text variant="labelLarge" style={styles.calloutKicker}>
            Next step
          </Text>
          <Text variant="titleMedium" style={styles.calloutTitle}>
            No active side quests yet
          </Text>
          <Text variant="bodyMedium" style={styles.calloutBody}>
            Add one from the catalog when you are ready—weekly, monthly, or yearly.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={onBrowseQuests}>
            Browse quests
          </Button>
        </Card.Actions>
      </Card>
    );
  }

  if (!action) {
    return (
      <Card style={styles.callout} mode="elevated">
        <Card.Content>
          <Text variant="labelLarge" style={styles.calloutKicker}>
            Next step
          </Text>
          <Text variant="bodyMedium" style={styles.calloutBody}>
            Open any active quest below to continue—details should appear here once loaded.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const questId = action.quest.id;
  const questTitle = action.quest.title;

  if (action.kind === 'journey_step') {
    return (
      <Card style={styles.calloutHighlight} mode="elevated">
        <TouchableRipple
          onPress={() => onOpenQuest(questId)}
          accessibilityRole="button"
          accessibilityLabel={`Next step: ${action.step.title} in ${questTitle}`}
          borderless>
          <Card.Content>
            <Text variant="labelLarge" style={styles.calloutKicker}>
              Next step
            </Text>
            <Text variant="labelMedium" style={styles.calloutQuestName} numberOfLines={1}>
              {questTitle}
            </Text>
            <Text variant="titleMedium" style={styles.calloutStepTitle} numberOfLines={3}>
              {action.step.title}
            </Text>
            {action.step.detail ? (
              <Text variant="bodySmall" style={styles.calloutStepDetail} numberOfLines={2}>
                {action.step.detail}
              </Text>
            ) : null}
            <Text variant="labelMedium" style={styles.calloutHint}>
              Open quest to check this off
            </Text>
          </Card.Content>
        </TouchableRipple>
      </Card>
    );
  }

  return (
    <Card style={styles.calloutHighlight} mode="elevated">
      <TouchableRipple
        onPress={() => onOpenQuest(questId)}
        accessibilityRole="button"
        accessibilityLabel={`Finish quest ${questTitle}`}
        borderless>
        <Card.Content>
          <Text variant="labelLarge" style={styles.calloutKicker}>
            Next step
          </Text>
          <Text variant="labelMedium" style={styles.calloutQuestName} numberOfLines={1}>
            {questTitle}
          </Text>
          <Text variant="bodyMedium" style={styles.calloutBody}>
            Journey steps are checked off—open this quest to finish it or log a memory.
          </Text>
          <Text variant="labelMedium" style={styles.calloutHint}>
            Open quest to finish
          </Text>
        </Card.Content>
      </TouchableRipple>
    </Card>
  );
}

const styles = StyleSheet.create({
  segmentedWrap: { marginBottom: 14 },
  compactRow: {
    backgroundColor: Theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  compactRowInner: { flexDirection: 'row' },
  compactAccent: { width: 6 },
  compactBody: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  compactTitle: { flex: 1, color: Theme.text },
  stepButton: { borderRadius: 999, height: 30, justifyContent: 'center' },
  nextStepHighlight: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingLeft: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.border,
    borderLeftWidth: 4,
    backgroundColor: Theme.bg,
  },
  nextStepPrefix: { textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  nextStepText: { color: Theme.text, fontWeight: '700', lineHeight: 23 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  },
  footerMeta: { color: Theme.textMuted, fontWeight: '600' },
  categoryIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: Theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callout: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 16,
  },
  calloutHighlight: {
    backgroundColor: Theme.accentSoft,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Theme.accent,
    marginBottom: 16,
  },
  calloutKicker: {
    color: Theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  calloutTitle: { color: Theme.text, marginBottom: 6 },
  calloutQuestName: {
    color: Theme.textMuted,
    marginBottom: 6,
  },
  calloutStepTitle: { color: Theme.text, lineHeight: 24 },
  calloutStepDetail: {
    marginTop: 8,
    color: Theme.textMuted,
  },
  calloutBody: { lineHeight: 22, color: Theme.text },
  calloutHint: {
    marginTop: 12,
    fontWeight: '600',
    color: Theme.accent,
  },
});
