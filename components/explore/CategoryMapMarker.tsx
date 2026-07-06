import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
        {
          left: left - MARKER_SIZE / 2,
          top: top - MARKER_SIZE / 2,
        },
        animatedStyle,
      ]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${categoryName}. ${accessibilityHint}`}
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          styles.marker,
          {
            // Themed even before reveal — the ring already hints the category.
            borderColor: accent,
            backgroundColor: selected ? `${accent}22` : Theme.surface,
          },
          pressed && styles.pressed,
        ]}>
        <View style={[styles.halo, { backgroundColor: `${accent}33` }]} />
        <CategoryMapMarkerGlyph categoryId={categoryId} revealed={revealed || selected} size={26} />
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    zIndex: 2,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#2c2825',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: MARKER_SIZE / 2,
  },
  pressed: {
    opacity: 0.92,
  },
});

export { MARKER_SIZE };
