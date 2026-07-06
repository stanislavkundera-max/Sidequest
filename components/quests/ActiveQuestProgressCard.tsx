import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text, TouchableRipple } from 'react-native-paper';

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
    <Card style={styles.card} mode="elevated">
      <TouchableRipple
        accessibilityRole="button"
        accessibilityLabel={
          stepTotal > 0
            ? `${title}, ${stepDone} of ${stepTotal} journey steps done`
            : title
        }
        onPress={onPress}
        borderless>
        <View style={styles.row}>
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={2}>
                {title}
              </Text>
              <Chip
                compact
                mode="outlined"
                textStyle={{ color: accentColor }}
                style={[styles.stepChip, { borderColor: accentColor }]}>
                {stepLabel}
              </Chip>
            </View>
            <Text variant="bodyMedium" style={styles.cardMeta} numberOfLines={2}>
              {shortDescription}
            </Text>
            <View style={styles.cardFooter}>
              <Text variant="labelMedium" style={styles.openHint} numberOfLines={1}>
                {categoryLine}
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  row: { flexDirection: 'row' },
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
    color: Theme.text,
  },
  stepChip: {
    backgroundColor: Theme.bg,
    borderRadius: 999,
    height: 30,
  },
  cardMeta: { color: Theme.textMuted, lineHeight: 22 },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  openHint: {
    flex: 1,
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
