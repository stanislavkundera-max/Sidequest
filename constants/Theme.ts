/**
 * Palette derived from the Explore map artwork (2026-08-21).
 *
 * Sampling that illustration showed it is effectively monochrome: the twelve
 * most common colours — 67% of its pixels — all sit at hue 66–98° (olive) and
 * lightness 13–34%. Two rules follow, and everything below obeys them:
 *
 *   1. The brand accent comes *from* that band, so the UI and the artwork read
 *      as one world.
 *   2. Category hues stay *out* of it (and out of 0–15°, which danger owns),
 *      so a marker never disappears into the forest behind it.
 *
 * Category lightness is staggered on purpose. Red-green colour blindness
 * collapses hue differences, so value — not hue — is what keeps the three cool
 * categories apart. Verified: every colour clears WCAG AA (4.5:1) on `bg` and
 * `surface`, white text clears AA on every category fill, and the worst
 * category pair is ΔE 37.9 in normal vision, 27.4 under protanopia. The
 * weakest case is nature/social under deuteranopia (ΔE 15.1) — acceptable only
 * because category colour is never the sole cue: an icon and a written label
 * always accompany it.
 *
 * Named by role rather than by value so a dark palette can be added later
 * without touching call sites.
 */
export type ThemePalette = {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentSoft: string;
  /** Text and icons drawn on an `accent` fill. */
  onAccent: string;
  nature: string;
  adventure: string;
  social: string;
  relax: string;
  /** Brand amber. A fill behind dark text only — see the note on the value. */
  accentWarm: string;
  accentWarmText: string;
  danger: string;
  dangerSoft: string;
  dangerBorder: string;
};

/** Calm earth / nature neutrals — minimal, grounded UI. */
export const lightPalette: ThemePalette = {
  bg: '#f3f2ec',
  surface: '#fcfbf8',
  text: '#28281f',
  textMuted: '#6c6b5a',
  border: '#dfdcd3',
  // Moss, taken straight from the map's own hue band.
  accent: '#536534',
  accentSoft: '#ecf1e4',
  onAccent: '#ffffff',
  nature: '#215e4f',
  adventure: '#8d6025',
  social: '#824071',
  relax: '#4264b3',
  /**
   * The brand amber from BRANDING.md §2 — the cairn's top stone, the one
   * catching the last light. Until now it lived only in the logo and the
   * feature graphic and appeared nowhere in the app.
   *
   * **Only ever as a fill behind dark text.** Measured: amber carries 6.61:1
   * against `text`, which clears AA comfortably — but only 2.01:1 against `bg`
   * and 2.25:1 against white, so amber *as* a foreground fails even the 3:1
   * that non-text UI needs. A soft amber tint was tried too and sits at 1.05
   * against the beige, which is to say invisible.
   *
   * So it marks things by filling a small shape, and never by colouring a word
   * or an icon on the page background.
   */
  accentWarm: '#d9a441',
  accentWarmText: '#28281f',
  danger: '#b13a2f',
  // The pale fill and hairline behind error states. These were hardcoded in
  // five different files against the previous red, which is exactly how a
  // palette drifts out of sync — the same way the "Start now" button kept the
  // old green. Derived from `danger`; it carries 5.04:1 on the soft fill.
  dangerSoft: '#f9e8e6',
  dangerBorder: '#e5c0bd',
};

/**
 * Dawn — the redesign frozen on 2026-10-22 (canvas screens 1–39, rules in
 * docs/redesign-screen-inventory.md). A warm olive ground under a sunrise sky,
 * cream text, peach as the accent. Same roles as the light palette, so every
 * screen picks it up through `Theme` without changing its call sites.
 *
 * Measured (2026-10-22) on the ground #3b3628: text 10.7:1, textMuted 7.9:1,
 * accent 6.5:1, danger 5.7:1. On `surface` #5b5445 — the solid colour a 16 % cream
 * card makes on the ground, so cards, sheets and inputs stay opaque where they
 * overlap — text 6.7:1 and textMuted 4.9:1 pass, but accent (4.1:1) and danger
 * (3.5:1) do not reach 4.5:1: on a surface they may colour icons, borders and
 * bold 18 px+ text only, never small words.
 */
export const dawnPalette: ThemePalette = {
  bg: '#3b3628',
  surface: '#5b5445',
  text: '#f3f2ec',
  textMuted: '#d9d1ba',
  border: 'rgba(246, 234, 214, 0.32)',
  accent: '#f0b27a',
  accentSoft: 'rgba(240, 178, 122, 0.18)',
  onAccent: '#1b1a12',
  // Category fills are unchanged: white text clears AA on each, and they are the
  // colours of the map markers (Standa, 2026-10-22).
  nature: '#215e4f',
  adventure: '#8d6025',
  social: '#824071',
  relax: '#4264b3',
  accentWarm: '#d9a441',
  accentWarmText: '#28281f',
  danger: '#e8a090',
  dangerSoft: 'rgba(232, 160, 144, 0.12)',
  dangerBorder: 'rgba(232, 160, 144, 0.4)',
};

/**
 * Dawn values that have no role in `ThemePalette`: the gradients, the cream
 * card, the floating tab bar and the three button levels. Screens reach for
 * these through the shared components (DawnBackground, DawnTabBar, buttons,
 * CategoryTag) rather than copying the numbers.
 */
export const Dawn = {
  /** The ground, top to bottom. */
  ground: ['#3b3628', '#413a2b', '#4b4331'] as const,
  /** The sunrise sky behind headers, top to bottom. */
  sky: ['#47536b', '#7f7a96', '#d79a8c', '#f2b98e', '#f8dcaa'] as const,
  /** The warm light low on the right of every screen. */
  glow: 'rgba(240, 150, 120, 0.2)',
  /** A translucent card on the ground, with its hairline. */
  card: 'rgba(246, 234, 214, 0.16)',
  cardBorder: 'rgba(246, 234, 214, 0.32)',
  /** The cream card ("In motion", Today's question) and the ink on it. */
  cream: '#f6ead6',
  creamEnd: '#eda877',
  creamText: '#28281f',
  creamMuted: '#5d4f3a',
  /** Primary button: cream fill, dark text. */
  primaryFill: '#f3f2ec',
  primaryText: '#1b1a12',
  /** Secondary button: peach outline, light text, icon in a peach disc. */
  secondaryFill: 'rgba(240, 178, 122, 0.18)',
  secondaryBorder: '#f0b27a',
  secondaryText: '#ffe2c2',
  /** A button inside a cream card — never black (Standa, 2026-10-22). */
  subtleFill: 'rgba(163, 79, 37, 0.1)',
  subtleBorder: 'rgba(163, 79, 37, 0.55)',
  subtleText: '#6b3416',
  /** The floating tab bar. */
  navFill: 'rgba(27, 25, 16, 0.92)',
  navBorder: 'rgba(243, 242, 236, 0.16)',
  navInactive: '#d4ccb3',
  /** The cairn is orange everywhere in Dawn (the app icon stays amber on forest). */
  cairn: '#f0b27a',
} as const;

export const Theme = dawnPalette;
