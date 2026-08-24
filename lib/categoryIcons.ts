import type { ComponentProps } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';

/**
 * Category glyphs in Ionicons — the set used wherever a category has to be
 * recognised at a glance: the Explore map markers and the catalog chips. Keep
 * those two using the same icon so a category looks the same everywhere.
 */
export function categoryIoniconNameForCategoryId(
  categoryId: string
): keyof typeof Ionicons.glyphMap {
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
 * Small category glyphs for quest cards (FontAwesome 4 glyph names).
 */
export function categoryIconNameForCategoryId(
  categoryId: string
): ComponentProps<typeof FontAwesome>['name'] {
  switch (categoryId) {
    case 'cat-nature':
      return 'leaf';
    case 'cat-adventure':
      return 'compass';
    case 'cat-social':
      return 'users';
    case 'cat-relax':
      return 'coffee';
    default:
      return 'circle-o';
  }
}
