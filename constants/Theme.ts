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

// A dark palette slots in here; nothing else has to change.
export const Theme = lightPalette;

/**
 * The two brand faces, named by role rather than by family.
 *
 * BRANDING.md §3: Fraunces for headings — it is the reason the brand reads as
 * grown rather than manufactured — and Inter for body, chosen for legibility at
 * the 13–16px the app actually renders at.
 *
 * **Use these instead of `fontWeight`.** Android does not synthesise weight for
 * a custom family: `fontWeight: '700'` on a font with no bold cut renders
 * regular, silently, on exactly the devices this ships to. Each weight is a
 * separate loaded family, so the weight has to be chosen by picking the right
 * token here. iOS and web are more forgiving, which is what makes this the kind
 * of bug you do not see until a tester's Pixel screenshot looks flat.
 *
 * Loaded in `app/_layout.tsx`. Adding a token means loading its file there too.
 */
export const Type = {
  /** Page and section titles. */
  heading: { fontFamily: 'Fraunces_700Bold' } as const,
  /** Card titles and the lighter headings. */
  headingSoft: { fontFamily: 'Fraunces_600SemiBold' } as const,
  /** Default body copy. */
  body: { fontFamily: 'Inter_400Regular' } as const,
  /** Body copy that needs a little more presence — labels, meta lines. */
  bodyMedium: { fontFamily: 'Inter_500Medium' } as const,
  /** Buttons, chips, anything that reads as an action. */
  bodySemi: { fontFamily: 'Inter_600SemiBold' } as const,
  /** Reserved for the rare emphatic run of body text. */
  bodyBold: { fontFamily: 'Inter_700Bold' } as const,
};
