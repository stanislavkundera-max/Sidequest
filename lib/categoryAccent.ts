import { Theme } from '@/constants/Theme';

/** Maps seed category ids (`cat-nature`, …) to accent colors. */
export function categoryAccentForCategoryId(categoryId: string): string {
  switch (categoryId) {
    case 'cat-nature':
      return Theme.nature;
    case 'cat-adventure':
      return Theme.adventure;
    case 'cat-social':
      return Theme.social;
    case 'cat-relax':
      return Theme.relax;
    default:
      return Theme.accent;
  }
}
