import type { ComponentProps } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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
