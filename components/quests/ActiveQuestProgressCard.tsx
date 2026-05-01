import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { categoryIconNameForCategoryId } from '@/lib/categoryIcons';

type ActiveQuestProgressCardProps = {
  title: string;
  shortDescription: string;
  categoryId: string;
  categoryLine: string;
  accentColor: string;
  stepDone: number;
  stepTotal: number;
  onPress: () => void;
};

export function ActiveQuestProgressCard({
  title,
  shortDescription,
  categoryId,
  categoryLine,
  accentColor,
  stepDone,
  stepTotal,
  onPress,
}: ActiveQuestProgressCardProps) {
  const iconName = categoryIconNameForCategoryId(categoryId);
  const stepLabel = stepTotal > 0 ? `${stepDone}/${stepTotal} steps` : 'Open quest';
  return (
    <Pressable
      accessibilityLabel={
        stepTotal > 0
          ? `${title}, ${stepDone} of ${stepTotal} journey steps done`
          : title
      }
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={[styles.stepPill, { borderColor: accentColor }]}>
            <Text style={[styles.stepPillText, { color: accentColor }]}>{stepLabel}</Text>
          </View>
        </View>
        <Text style={styles.cardMeta} numberOfLines={2}>
          {shortDescription}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.openHint}>{categoryLine}</Text>
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Theme.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  cardPressed: { opacity: 0.92 },
  accentBar: { width: 5 },
  cardBody: { flex: 1, padding: 16, paddingBottom: 14 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Theme.text,
  },
  stepPill: {
    borderWidth: 1,
    backgroundColor: Theme.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepPillText: { fontSize: 12, fontWeight: '800' },
  cardMeta: { fontSize: 15, color: Theme.textMuted, lineHeight: 22 },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  openHint: {
    flex: 1,
    fontSize: 13,
    color: Theme.textMuted,
  },
  categoryIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: Theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
