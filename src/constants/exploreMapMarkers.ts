/** Normalized positions (0–1) on the explore map illustration. */
export type ExploreMapMarkerDef = {
  categoryId: string;
  /** Horizontal position on source art (0 = left, 1 = right). */
  u: number;
  /** Vertical position on source art (0 = top, 1 = bottom). */
  v: number;
  accessibilityHint: string;
};

/** Pixel size of `explore-map-background.png` (illustrated forest map). */
export const EXPLORE_MAP_SOURCE_SIZE = { width: 765, height: 1024 };

// Markers are pinned to landmarks painted on the map art, so each mood sits
// somewhere that fits it thematically:
//   • adventure → the waterfall cascading down the top-center cliffs
//   • relax     → the calm pond where the river slows near the middle
//   • social    → the log cabin in the western clearing
//   • nature    → the forest meadow where the deer graze
// The map fills the screen with cover-fit; on a portrait phone the whole
// vertical extent shows while the sides are cropped, so u stays inside the
// horizontally-safe band (~0.24–0.76) and v spans the full map.
export const EXPLORE_MAP_MARKERS: ExploreMapMarkerDef[] = [
  {
    categoryId: 'cat-adventure',
    u: 0.55,
    v: 0.19,
    accessibilityHint: 'Adventure quests — at the waterfall, new routes and small trips',
  },
  {
    categoryId: 'cat-relax',
    u: 0.42,
    v: 0.37,
    accessibilityHint: 'Relax quests — by the calm pond, slow restorative moments',
  },
  {
    categoryId: 'cat-social',
    // Pinned to the roof of the big log cabin (cabin center ≈ 0.23, 0.535).
    u: 0.235,
    v: 0.525,
    accessibilityHint: 'Social quests — at the cabin, real conversations and connection',
  },
  {
    categoryId: 'cat-nature',
    u: 0.6,
    v: 0.67,
    accessibilityHint: 'Nature quests — in the meadow, outdoors, plants, and light',
  },
];

export const EXPLORE_COPY = {
  title: 'Explore your map',
  subtitle: 'Tap a place to see picks for you and quests in progress',
  panelEmptyTitle: 'Nothing here yet',
  panelEmptyBody: 'Browse every quest in the Journey tab.',
  panelSelectHint: 'Choose a place on the map to see quests',
} as const;
