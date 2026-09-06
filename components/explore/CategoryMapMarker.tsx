import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CategoryMapMarkerGlyph } from '@/components/explore/CategoryMapMarkerGlyph';
import { Theme } from '@/constants/Theme';
import { categoryAccentForCategoryId } from '@/lib/categoryAccent';

type Props = {
  categoryId: string;
  categoryName: string;
  selected: boolean;
  revealed: boolean;
  left: number;
  top: number;
  accessibilityHint: string;
  onPress: (categoryId: string) => void;
};

const MARKER_SIZE = 52;
/** Wide enough for the longest category name; the circle stays centred in it. */
const WRAP_WIDTH = 112;

export const CategoryMapMarker = memo(function CategoryMapMarker({
  categoryId,
  categoryName,
  selected,
  revealed,
  left,
  top,
  accessibilityHint,
  onPress,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.92, { duration: 120 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(categoryId);
  }, [categoryId, onPress]);

  const accent = categoryAccentForCategoryId(categoryId);

  return (
    <Animated.View
      style={[
        styles.wrap,
        { left: left - WRAP_WIDTH / 2, top: top - MARKER_SIZE / 2 },
        animatedStyle,
      ]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${categoryName}. ${accessibilityHint}`}
        accessibilityState={{ selected }}
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}>
        <View style={styles.circleSlot}>
          {/* Soft glow so the marker separates from the busy illustration. */}
          <View style={[styles.glow, { backgroundColor: `${accent}38` }]} />
          <View
            style={[
              styles.circle,
              {
                borderColor: accent,
                backgroundColor: selected ? accent : Theme.surface,
              },
            ]}>
            <CategoryMapMarkerGlyph
              categoryId={categoryId}
              color={selected ? '#ffffff' : accent}
              size={26}
            />
          </View>
          {!revealed && !selected ? (
            <View style={[styles.newDot, { backgroundColor: accent }]} />
          ) : null}
        </View>

        <View style={[styles.label, selected && { borderColor: accent, borderWidth: 1.5 }]}>
          <Text style={styles.labelText} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: WRAP_WIDTH,
    zIndex: 2,
  },
  press: {
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.92,
  },
  circleSlot: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: MARKER_SIZE + 16,
    height: MARKER_SIZE + 16,
    borderRadius: (MARKER_SIZE + 16) / 2,
  },
  circle: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1c1a17',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  newDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  label: {
    maxWidth: WRAP_WIDTH,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(24,22,19,0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  labelText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export { MARKER_SIZE };
