/**
 * The app has exactly one palette, so it reports one colour scheme.
 *
 * `constants/Theme.ts` exports `lightPalette` only — a dark palette is
 * structured behind the `ThemePalette` type but its values were never written
 * (tasks.md #6). Meanwhile `app/_layout.tsx` switches React Navigation and
 * React Native Paper to their dark themes whenever this hook says 'dark'.
 *
 * On a device set to dark mode that produced a genuinely mismatched app: dark
 * navigation chrome and headers (NavDark: #1a1816 / #242120) wrapped around
 * screens still painting light beige `Theme.bg`, plus a dark flash on cold
 * start. Not broken, but visibly unfinished — and dark mode is common enough
 * that a closed test would have hit it immediately.
 *
 * This was invisible until 2026-08-29 because `useColorScheme.web.ts` already
 * hardcodes 'light', so every browser check reported a healthy app. The bug
 * only existed on native, which had never been built.
 *
 * Forcing 'light' here rather than in `_layout.tsx` keeps both platforms
 * agreeing and leaves one obvious place to revert: when a dark palette is
 * actually written, restore the re-export below and switch
 * `app.config.ts`'s `userInterfaceStyle` back to 'automatic'.
 */
/**
 * The return type stays `'light' | 'dark'` even though the value is always
 * 'light'. Narrowing it to `'light'` makes TypeScript flag the dark branches in
 * `app/_layout.tsx` as dead code — correct, but they are deliberately kept for
 * when a dark palette lands, and deleting them would make that revert much
 * larger than flipping this one function back.
 */
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}

// Restore this when a dark palette exists:
// export { useColorScheme } from 'react-native';
