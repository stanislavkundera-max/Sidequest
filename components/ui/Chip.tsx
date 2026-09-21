import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Tints the selected state — category chips use their category colour. */
  accent?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** e.g. `chevron-down` on a chip that opens a menu. */
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
};

const VISUAL_HEIGHT = 34;
/** Grows the touch area to the 44pt minimum without making the chip look chunky. */
const HIT_SLOP = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - VISUAL_HEIGHT) / 2));

/**
 * A compact filter / choice pill.
 *
 * The Memories filter chips used to carry `minHeight: 44` visually — and sat in
 * horizontal ScrollViews that grew to fill the screen, which stretched them
 * into tall ovals (round 2, R2-09: "hrozně velké"). This keeps the look small
 * and meets the touch target through `hitSlop` instead.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  accent = Theme.accent,
  icon,
  trailingIcon,
  accessibilityLabel,
}: Props) {
  const color = selected ? accent : Theme.textMuted;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: HIT_SLOP, bottom: HIT_SLOP }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: `${accent}1f`, borderColor: accent },
        pressed && styles.pressed,
      ]}>
      {icon ? <Ionicons name={icon} size={13} color={color} /> : null}
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
      {trailingIcon ? <Ionicons name={trailingIcon} size={13} color={color} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    height: VISUAL_HEIGHT,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: Theme.surface,
  },
  text: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  pressed: { opacity: 0.8 },
});
