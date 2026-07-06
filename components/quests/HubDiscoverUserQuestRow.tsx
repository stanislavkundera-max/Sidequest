import { Pressable, Text, View } from 'react-native';

import { journeyHubStyles as styles } from '@/components/journey/journeyHubStyles';

export type HubDiscoverUserQuestRowProps = {
  accentColor: string;
  categoryMeta: string;
  title: string;
  subtitle?: string;
  metaLight?: string;
  onRowPress: () => void;
  primaryAction?: { label: string; onPress: () => void; disabled?: boolean };
};

/**
 * Journey hub–style row for user quest lists (Progress, active/completed screens).
 */
export function HubDiscoverUserQuestRow({
  accentColor,
  categoryMeta,
  title,
  subtitle,
  metaLight,
  onRowPress,
  primaryAction,
}: HubDiscoverUserQuestRowProps) {
  return (
    <Pressable
      onPress={onRowPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.discoverQuestRow, pressed && styles.pressed]}>
      <View style={[styles.discoverQuestAccent, { backgroundColor: accentColor }]} />
      <View style={styles.discoverQuestRowBody}>
        <Text style={styles.questRowMeta}>{categoryMeta}</Text>
        <Text style={styles.questRowTitle} numberOfLines={3}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.questRowSub} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
        {metaLight ? <Text style={styles.questRowMetaLight}>{metaLight}</Text> : null}
        {primaryAction ? (
          <View style={styles.questRowActions}>
            <Pressable
              disabled={primaryAction.disabled}
              onPress={primaryAction.onPress}
              style={({ pressed }) => [
                styles.btnSubtleSolid,
                pressed && !primaryAction.disabled && styles.pressed,
                primaryAction.disabled && styles.disabled,
              ]}>
              <Text style={styles.btnSubtleSolidText}>{primaryAction.label}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
