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
  const progressRatio = stepTotal > 0 ? Math.min(1, stepDone / stepTotal) : 0;
  const iconName = categoryIconNameForCategoryId(categoryId);
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
        <Text style={styles.cardTitle}>{title}</Text>
        {stepTotal > 0 ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressCaption}>Journey progress</Text>
              <Text style={[styles.progressFraction, { color: accentColor }]}>
                {stepDone}/{stepTotal}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(progressRatio * 100)}%`,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 8,
  },
  progressBlock: { marginBottom: 10 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.text,
    letterSpacing: 0.2,
  },
  progressFraction: { fontSize: 15, fontWeight: '700' },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: Theme.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
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
