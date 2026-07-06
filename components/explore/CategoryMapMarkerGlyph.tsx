import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { categoryAccentForCategoryId } from '@/lib/categoryAccent';

type Props = {
  categoryId: string;
  revealed: boolean;
  size?: number;
};

/** Category icon shown as a small hint badge on "?" markers, full-size once revealed. */
export function categoryMarkerIcon(categoryId: string): keyof typeof Ionicons.glyphMap {
  switch (categoryId) {
    case 'cat-nature':
      return 'leaf';
    case 'cat-adventure':
      return 'compass';
    case 'cat-social':
      return 'people';
    case 'cat-relax':
      return 'cafe';
    default:
      return 'help';
  }
}

/**
 * Marker face: a themed question mark. The "?" wears the category accent and a
 * tiny icon badge whispers the theme; tapping (revealing) swaps it for the
 * full category icon.
 */
export const CategoryMapMarkerGlyph = memo(function CategoryMapMarkerGlyph({
  categoryId,
  revealed,
  size = 28,
}: Props) {
  const accent = categoryAccentForCategoryId(categoryId);
  const icon = categoryMarkerIcon(categoryId);

  if (revealed) {
    return <Ionicons name={icon} size={size * 0.8} color={accent} />;
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text
        style={[
          styles.question,
          { fontSize: size * 0.8, lineHeight: size, color: accent },
        ]}
        accessibilityElementsHidden>
        ?
      </Text>
      <View style={[styles.badge, { backgroundColor: accent }]}>
        <Ionicons name={icon} size={size * 0.32} color="#fff" />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  question: {
    fontWeight: '800',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    right: -7,
    bottom: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
