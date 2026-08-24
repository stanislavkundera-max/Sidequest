import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';

type Props = {
  categoryId: string;
  color: string;
  size?: number;
};

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
 * The category icon, always shown.
 *
 * It used to be hidden behind a generic sparkle until the category had been
 * opened, with the real icon shrunk into a 16px badge — which made all four
 * markers look identical on first run, exactly when a new user most needs to
 * tell them apart. Identity is no longer the thing being withheld; the
 * "not opened yet" hint lives on the marker as a small dot instead.
 */
export const CategoryMapMarkerGlyph = memo(function CategoryMapMarkerGlyph({
  categoryId,
  color,
  size = 26,
}: Props) {
  return <Ionicons name={categoryMarkerIcon(categoryId)} size={size} color={color} />;
});
