import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Dawn, Theme } from '@/constants/Theme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTargets';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Tints the selected state — category chips use their category colour. */
  accent?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** A small dot in this colour before the label, with a cream rim — how Dawn marks a category
   * in a filter (Memories, screen 30). Use instead of `icon`. */
  dot?: string;
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
  dot,
  trailingIcon,
  accessibilityLabel,
}: Props) {
  // Dawn: selected is a cream pill with dark ink (Journey's place filter on the
  // canvas); the accent only tints the icon, where a category colour still reads on
  // cream. Unselected is a light outline on the ground.
  const color = selected ? Dawn.creamText : Theme.text;
  const iconColor = selected && accent !== Theme.accent ? accent : color;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: HIT_SLOP, bottom: HIT_SLOP }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {icon ? <Ionicons name={icon} size={13} color={iconColor} /> : null}
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
    borderWidth: 1.5,
    borderColor: 'rgba(243, 242, 236, 0.55)',
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(243, 242, 236, 0.08)',
  },
  selected: { backgroundColor: Dawn.cream, borderColor: Dawn.cream },
  dot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(246, 234, 214, 0.8)' },
  text: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  pressed: { opacity: 0.8 },
});
