import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  limits: Record<QuestTimeframe, number>;
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
  const items: QuestTimeframe[] = ['weekly', 'monthly', 'yearly'];
  return (
    <View
      style={styles.slotsRow}
      accessibilityLabel="Active quest counts by timeframe versus your limits">
      {items.map((tf, i) => {
        const selected = tf === selectedTimeframe;
        return (
          <Pressable
            key={tf}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelectTimeframe(tf)}
            style={({ pressed }) => [
              styles.slotCell,
              i === items.length - 1 && styles.slotCellLast,
              selected && styles.slotCellSelected,
              pressed && styles.slotCellPressed,
            ]}>
            <Text style={styles.slotLabel}>{TF_SHORT[tf]}</Text>
            <Text
              style={styles.slotValue}
              accessibilityLabel={`${TF_SHORT[tf]} active ${counts[tf]} of ${limits[tf]}`}>
              {counts[tf]}/{limits[tf]}
            </Text>
          </Pressable>
        );
      })}
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. Category ${catLabel}. Next step: ${nextStepLabel}. ${stepLabel}.`}
      onPress={onPress}
      style={({ pressed }) => [styles.compactRow, pressed && styles.compactRowPressed]}>
      <View style={[styles.compactAccent, { backgroundColor: accentColor }]} />
      <View style={styles.compactBody}>
        <View style={styles.compactTop}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={[styles.stepPill, { borderColor: accentColor }]}>
            <Text style={[styles.stepPillText, { color: accentColor }]}>{stepLabel}</Text>
          </View>
        </View>
        <View style={[styles.nextStepHighlight, { borderLeftColor: accentColor }]}>
          <Text style={[styles.nextStepPrefix, { color: accentColor }]}>Next actionable</Text>
          <Text style={styles.nextStepText} numberOfLines={3}>
            {nextStepLabel}
          </Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.footerMeta}>{catLabel}</Text>
          <View
            style={[styles.categoryIconBadge, { borderColor: accentColor }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants">
            <FontAwesome name={iconName} size={15} color={accentColor} />
          </View>
        </View>
      </View>
    </Pressable>
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
      <View style={styles.callout}>
        <Text style={styles.calloutKicker}>Next step</Text>
        <Text style={styles.calloutTitle}>No active side quests yet</Text>
        <Text style={styles.calloutBody}>
          Add one from the catalog when you are ready—weekly, monthly, or yearly.
        </Text>
        <Pressable
          onPress={onBrowseQuests}
          style={({ pressed }) => [styles.calloutCta, pressed && styles.calloutCtaPressed]}>
          <Text style={styles.calloutCtaText}>Browse quests</Text>
        </Pressable>
      </View>
    );
  }

  if (!action) {
    return (
      <View style={styles.callout}>
        <Text style={styles.calloutKicker}>Next step</Text>
        <Text style={styles.calloutBody}>
          Open any active quest below to continue—details should appear here once loaded.
        </Text>
      </View>
    );
  }

  const questId = action.quest.id;
  const questTitle = action.quest.title;

  if (action.kind === 'journey_step') {
    return (
      <Pressable
        onPress={() => onOpenQuest(questId)}
        style={({ pressed }) => [styles.calloutHighlight, pressed && styles.calloutHighlightPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Next step: ${action.step.title} in ${questTitle}`}>
        <Text style={styles.calloutKicker}>Next step</Text>
        <Text style={styles.calloutQuestName} numberOfLines={1}>
          {questTitle}
        </Text>
        <Text style={styles.calloutStepTitle} numberOfLines={3}>
          {action.step.title}
        </Text>
        {action.step.detail ? (
          <Text style={styles.calloutStepDetail} numberOfLines={2}>
            {action.step.detail}
          </Text>
        ) : null}
        <Text style={styles.calloutHint}>Open quest to check this off</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onOpenQuest(questId)}
      style={({ pressed }) => [styles.calloutHighlight, pressed && styles.calloutHighlightPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Wrap up quest ${questTitle}`}>
      <Text style={styles.calloutKicker}>Next step</Text>
      <Text style={styles.calloutQuestName} numberOfLines={1}>
        {questTitle}
      </Text>
      <Text style={styles.calloutBody}>
        Journey steps are checked off—open this quest to wrap up or log a memory.
      </Text>
      <Text style={styles.calloutHint}>Open quest to finish</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slotsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    overflow: 'hidden',
    marginBottom: 14,
  },
  slotCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Theme.border,
  },
  slotCellSelected: {
    backgroundColor: Theme.accentSoft,
  },
  slotCellPressed: { opacity: 0.92 },
  slotCellLast: { borderRightWidth: 0 },
  slotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  slotValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
  },
  compactRow: {
    flexDirection: 'row',
    backgroundColor: Theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  compactRowPressed: { opacity: 0.92 },
  compactAccent: { width: 6 },
  compactBody: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  compactTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Theme.text },
  stepPill: {
    borderWidth: 1,
    backgroundColor: Theme.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepPillText: { fontSize: 12, fontWeight: '800' },
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
  nextStepPrefix: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  nextStepText: {
    fontSize: 16,
    lineHeight: 23,
    color: Theme.text,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  },
  footerMeta: { fontSize: 13, color: Theme.textMuted, fontWeight: '600' },
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
    padding: 16,
    marginBottom: 16,
  },
  calloutHighlight: {
    backgroundColor: Theme.accentSoft,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Theme.accent,
    padding: 16,
    marginBottom: 16,
  },
  calloutHighlightPressed: { opacity: 0.92 },
  calloutKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  calloutTitle: { fontSize: 17, fontWeight: '600', color: Theme.text, marginBottom: 6 },
  calloutQuestName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textMuted,
    marginBottom: 6,
  },
  calloutStepTitle: { fontSize: 18, fontWeight: '600', color: Theme.text, lineHeight: 24 },
  calloutStepDetail: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.textMuted,
  },
  calloutBody: { fontSize: 15, lineHeight: 22, color: Theme.text },
  calloutHint: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.accent,
  },
  calloutCta: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Theme.accent,
  },
  calloutCtaPressed: { opacity: 0.9 },
  calloutCtaText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
