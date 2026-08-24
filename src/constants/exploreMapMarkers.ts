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

// Spots picked by Standa on the artwork (2026-08-21), each sitting on a
// landmark that suits its mood:
//   • adventure → the open clearing in the middle of the map
//   • relax     → the river bend on the eastern side
//   • nature    → the wooded path in the south-west
//   • social    → the big log cabin at the bottom
//
// Nudged from the exact marks only where geometry demanded it: `nature` and
// `social` moved up so their labels clear the tab bar on a short phone
// (375x667 is the binding case), and the top two were spread slightly so their
// tap targets never touch.
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
    u: 0.71,
    v: 0.61,
    accessibilityHint: 'Relax quests — by the river, slow restorative moments',
  },
  {
    categoryId: 'cat-nature',
    u: 0.3,
    v: 0.8,
    accessibilityHint: 'Nature quests — on the forest path, outdoors, plants, and light',
  },
  {
    categoryId: 'cat-social',
    u: 0.54,
    v: 0.825,
    accessibilityHint: 'Social quests — at the cabin, real conversations and connection',
  },
];

export const EXPLORE_COPY = {
  title: 'Explore your map',
  subtitle: 'Tap a place to see picks for you and quests in progress',
  panelEmptyTitle: 'Nothing here yet',
  panelEmptyBody: 'Browse every quest in the Journey tab.',
  panelSelectHint: 'Choose a place on the map to see quests',
} as const;
