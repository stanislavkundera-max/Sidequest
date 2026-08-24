/** Calm earth / nature neutrals — minimal, grounded UI */
export const Theme = {
  bg: '#f4f1ec',
  surface: '#ffffff',
  text: '#2c2825',
  textMuted: '#6b6560',
  border: '#e0dbd4',
  accent: '#5c7a6b',
  accentSoft: '#e8f0ec',
  // Category hues are shared with the Journey scene's artifact glyphs
  // (`JourneyArtifactGlyph.tsx`). Keep the *hue* aligned between the two — the
  // scene versions are lighter because they sit on painted art, these are
  // darker for contrast on `bg`/`surface`. Social is warm on purpose: its
  // glyphs are lanterns, campfires and windows.
  nature: '#5c7a6b',
  adventure: '#8b7355',
  social: '#a86a3d',
  relax: '#5a7488',
  danger: '#b85c4a',
} as const;
