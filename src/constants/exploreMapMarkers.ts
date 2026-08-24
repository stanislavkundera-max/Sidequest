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

// Markers used to be pinned to painted landmarks (waterfall / pond / cabin /
// meadow). That pinning was dropped 2026-08-21: the top marker collided with
// the header, and each marker now carries a name label underneath, so identity
// comes from the label rather than from what it happens to sit on.
//
// What the layout optimises for instead:
//   • a readable zig-zag down the map, roughly evenly spaced, so four markers
//     plus their labels never crowd or overlap each other
//   • clear of the header scrim at the top and the tab bar at the bottom
//   • u inside the horizontally-safe band, because cover-fit crops the sides on
//     a portrait phone while the full height stays visible. The old band
//     (~0.24–0.76) was measured for the bare 52px circle; the label makes each
//     marker 112px wide, which narrows the usable range to roughly 0.29–0.72.
//
// `v` is the centre of the circle; the label hangs ~26px below it, so leave
// headroom under the lowest marker when retuning.
export const EXPLORE_MAP_MARKERS: ExploreMapMarkerDef[] = [
  {
    categoryId: 'cat-adventure',
    u: 0.55,
    v: 0.29,
    accessibilityHint: 'Adventure quests — new routes and small trips',
  },
  {
    categoryId: 'cat-relax',
    u: 0.38,
    v: 0.45,
    accessibilityHint: 'Relax quests — slow, restorative moments',
  },
  {
    categoryId: 'cat-social',
    u: 0.35,
    v: 0.61,
    accessibilityHint: 'Social quests — real conversations and connection',
  },
  {
    categoryId: 'cat-nature',
    u: 0.6,
    v: 0.77,
    accessibilityHint: 'Nature quests — outdoors, plants, and light',
  },
];

export const EXPLORE_COPY = {
  title: 'Explore your map',
  subtitle: 'Tap a place to see picks for you and quests in progress',
  panelEmptyTitle: 'Nothing here yet',
  panelEmptyBody: 'Browse every quest in the Journey tab.',
  panelSelectHint: 'Choose a place on the map to see quests',
} as const;
