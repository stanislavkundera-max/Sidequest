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

// Each category sits on a landmark that already says what it is for (round 2, R2-17 — Marian:
// relax in a cabin, social around a fire, nature at a big tree). No new art: the map already has them.
//   • adventure → the open clearing where the trails meet, in the middle
//   • relax     → the big log cabin on the west side
//   • nature    → the big old tree at the bottom of the map
//   • social    → the ring of stones in the meadow, which reads as a fire pit
//     (there is no drawn campfire; if one is painted later, move this onto it)
//
// Nudged from the exact spots only where geometry demanded it: `nature` and `social` stay above
// roughly v 0.8 so their labels clear the tab bar on a short phone (375x667 is the binding case), and
// their tap targets are kept apart from each other.
//
// Constraints when retuning:
//   • cover-fit crops the sides on a portrait phone while the full height
//     shows, so extreme `u` pushes a label off-screen. The visible label is
//     ~60–90px wide; the invisible tap target is 112px, which is what has to
//     stay clear of a neighbour's.
//   • `v` is the centre of the circle. The label hangs ~30px below it, and the
//     header scrim covers the top 132px — so keep `v` inside roughly
//     0.25–0.83 and leave vertical or horizontal room between neighbours.
export const EXPLORE_MAP_MARKERS: ExploreMapMarkerDef[] = [
  {
    categoryId: 'cat-adventure',
    u: 0.53,
    v: 0.47,
    accessibilityHint: 'Adventure quests — in the clearing, new routes and small trips',
  },
  {
    categoryId: 'cat-relax',
    u: 0.24,
    v: 0.53,
    accessibilityHint: 'Relax quests — in the log cabin, time to rest',
  },
  {
    categoryId: 'cat-nature',
    u: 0.41,
    v: 0.79,
    accessibilityHint: 'Nature quests — at the big old tree, quiet time outside',
  },
  {
    categoryId: 'cat-social',
    u: 0.6,
    v: 0.67,
    accessibilityHint: 'Social quests — around the fire, new people and closer friends',
  },
];

export const EXPLORE_COPY = {
  title: 'Explore your map',
  subtitle: 'Tap a place to see picks for you and quests in progress',
  panelEmptyTitle: 'Nothing here yet',
  panelEmptyBody: 'Browse every quest in the Journey tab.',
  panelSelectHint: 'Choose a place on the map to see quests',
} as const;
