/** Normalized positions (0–1) on the explore map illustration. */
export type ExploreMapMarkerDef = {
  categoryId: string;
  /** Horizontal position on source art (0 = left, 1 = right). */
  u: number;
  /** Vertical position on source art (0 = top, 1 = bottom). */
  v: number;
  accessibilityHint: string;
};

/** Pixel size of `explore-map-background.jpg` (illustrated forest map). */
export const EXPLORE_MAP_SOURCE_SIZE = { width: 896, height: 1199 };

// Each category sits on the scene painted for it (round 2, R2-17; map repainted 2026-09-26):
//   • adventure → the raft in the white water below the waterfalls
//   • relax     → the hammock between the trees, west side
//   • nature    → the big old tree in the southern woods
//   • social    → the people round the campfire, south-east (just left of the fire itself, so the
//     label clears the right edge on tall phones)
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
    u: 0.39,
    v: 0.39,
    accessibilityHint: 'Adventure quests — on the white water, new experiences and new hobbies',
  },
  {
    categoryId: 'cat-relax',
    u: 0.31,
    v: 0.53,
    accessibilityHint: 'Relax quests — at the hammock, time to rest',
  },
  {
    categoryId: 'cat-nature',
    u: 0.4,
    v: 0.79,
    accessibilityHint: 'Nature quests — at the big old tree, quiet time outside',
  },
  {
    categoryId: 'cat-social',
    u: 0.72,
    v: 0.73,
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
