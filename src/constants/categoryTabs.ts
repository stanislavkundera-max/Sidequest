/**
 * Category filter tabs for Home + quest catalog (Recommended is always first).
 */
export const CATEGORY_TAB_IDS = [
  'recommended',
  'cat-nature',
  'cat-adventure',
  'cat-relax',
  'cat-social',
] as const;

export type CategoryTabId = (typeof CATEGORY_TAB_IDS)[number];

export const CATEGORY_TAB_LABEL: Record<CategoryTabId, string> = {
  recommended: 'Recommended',
  'cat-nature': 'Nature',
  'cat-adventure': 'Adventure',
  'cat-relax': 'Relax',
  'cat-social': 'Social',
};

/** Stable order when showing “Recommended” (all categories). */
export const RECOMMENDED_CATEGORY_ORDER: Array<Exclude<CategoryTabId, 'recommended'>> = [
  'cat-nature',
  'cat-adventure',
  'cat-relax',
  'cat-social',
];

export function parseCategoryTabParam(raw: string | undefined): CategoryTabId {
  if (raw && CATEGORY_TAB_IDS.includes(raw as CategoryTabId)) {
    return raw as CategoryTabId;
  }
  return 'recommended';
}

/** FontAwesome 4 glyph names for small chips. */
export const CATEGORY_TAB_ICON: Record<CategoryTabId, string> = {
  recommended: 'star',
  'cat-nature': 'leaf',
  'cat-adventure': 'compass',
  'cat-relax': 'coffee',
  'cat-social': 'users',
};
