import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';

import { categoryIoniconNameForCategoryId } from '@/lib/categoryIcons';

type Props = {
  categoryId: string;
  color: string;
  size?: number;
};

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
  return <Ionicons name={categoryIoniconNameForCategoryId(categoryId)} size={size} color={color} />;
});
