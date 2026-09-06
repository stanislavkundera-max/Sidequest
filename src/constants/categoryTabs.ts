/**
 * Category filter tabs for the quest catalog.
 *
 * There used to be a fifth, "Recommended", first in the list and the value
 * `parseCategoryTabParam` fell back to. It rendered one line — "Personalized
 * suggestions will appear here soon" — and nothing else, which made it the
 * default landing state of a screen reached from the Memories empty state and
 * from every error screen's "Browse quests". The commonest way into the picker
 * showed a placeholder. Removed 2026-09-06; Explore already has a real
 * "Recommended for you" panel, so two of them, one empty, was worse than one.
 */
export const CATEGORY_TAB_IDS = [
  'cat-nature',
  'cat-adventure',
  'cat-relax',
  'cat-social',
] as const;

export type CategoryTabId = (typeof CATEGORY_TAB_IDS)[number];

export const CATEGORY_TAB_LABEL: Record<CategoryTabId, string> = {
  'cat-nature': 'Nature',
  'cat-adventure': 'Adventure',
  'cat-relax': 'Relax',
  'cat-social': 'Social',
};

/** Falls back to a category with real quests in it, never to an empty screen. */
export function parseCategoryTabParam(raw: string | undefined): CategoryTabId {
  if (raw && CATEGORY_TAB_IDS.includes(raw as CategoryTabId)) {
    return raw as CategoryTabId;
  }
  return CATEGORY_TAB_IDS[0];
}

/** FontAwesome 4 glyph names for small chips. */
export const CATEGORY_TAB_ICON: Record<CategoryTabId, string> = {
  'cat-nature': 'leaf',
  'cat-adventure': 'compass',
  'cat-relax': 'coffee',
  'cat-social': 'users',
};
