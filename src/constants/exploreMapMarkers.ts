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
export const EXPLORE_MAP_SOURCE_SIZE = { width: 896, height: 1200 };

// One category per quadrant, each on the scene painted for it (round 2, R2-17; map repainted and
// placed with Standa 2026-09-26):
//   • adventure (top left)     → just left of the raft in the white water, so the raft stays visible
//   • nature    (top right)    → the meadow with the deer, level with adventure
//   • social    (bottom left)  → just below and right of the campfire, so the bubble does not cover
//     the fire and stays clear of the left edge on phones
//   • relax     (bottom right) → the pond with the jetty
// Relax and social swapped sides when the map was repainted (Standa, 2026-09-26), for a better flow.
//
// Constraints when retuning:
//   • cover-fit crops the sides on a portrait phone while the full height
//     shows, so extreme `u` pushes a label off-screen. The visible label is
//     ~60–90px wide; the invisible tap target is 112px, which is what has to
//     stay clear of a neighbour's.
//   • `v` is the centre of the circle. The label hangs ~30px below it, and the
//     title card covers roughly the top 90px — so keep `v` inside roughly
//     0.25–0.83 and leave vertical or horizontal room between neighbours.
export const EXPLORE_MAP_MARKERS: ExploreMapMarkerDef[] = [
  {
    categoryId: 'cat-adventure',
    u: 0.27,
    v: 0.4,
    accessibilityHint: 'Adventure quests — on the white water, new experiences and new hobbies',
  },
  {
    categoryId: 'cat-relax',
    u: 0.71,
    v: 0.74,
    accessibilityHint: 'Relax quests — at the pond, time to rest',
  },
  {
    categoryId: 'cat-nature',
    u: 0.68,
    v: 0.38,
    accessibilityHint: 'Nature quests — in the meadow with the deer, quiet time outside',
  },
  {
    categoryId: 'cat-social',
    u: 0.28,
    v: 0.79,
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
