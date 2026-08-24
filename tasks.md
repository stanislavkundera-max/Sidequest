# Tasks / Backlog

## 1) ~~Onboarding baseline question + 3-month re-ask~~ — Done (found already shipped, 2026-08-21)
- Baseline nature-connection/isolation questions + one-time baseline capture +
  3-month re-ask all built (`a0b65de`). This entry wasn't crossed off when the
  work landed — caught during this session's tasks.md audit.

## 2) ~~Admin / test account~~ — Done differently than described (found 2026-08-21)
- No literal "admin account" — instead `lib/devAuth.ts` auto-signs-in in
  `__DEV__` builds via env vars, which covers the actual goal (walk the app
  without re-entering credentials each time). Separately, `isAdminEmail()`
  gates redo-onboarding/delete-progress tools for one real email.

## 3) ~~Finish `docs/value-proposition.md`~~ — Done 2026-08-21
- "Backed by research" paragraph (White, Bratman, Killingsworth & Gilbert)
  approved and live in the doc; 3 more citations kept as backup/reference.

## 4) Finish `docs/story.md`
- Write up the actual "breaking point" scene — the Morocco surfing trip — as a
  concrete moment, not just the general "stuck in a rut" description.
- Once written, draft the trimmed welcome-screen cut and update the landing
  page / marketing copy to use the specific scene.

## 5) ~~Clarify: onboarding is recommendations only~~ — Done (found already shipped, 2026-08-21)
- Footnote copy live on both the onboarding summary screen and Explore's
  recommended section (`docs/onboarding-revision-plan.md` §1–2). Same catch
  as #1 — done but not crossed off until this session's audit.

## 6) ~~Decide on color palette~~ — Done 2026-08-21
- Derived from the Explore map artwork rather than picked by eye: brand accent
  taken from the map's own hue band, category hues kept out of it, lightness
  staggered so colour blindness cannot collapse them. Method and the measured
  results (contrast, ΔE, dichromat simulation) are documented in
  `constants/Theme.ts`.
- Structured as `lightPalette` behind a `ThemePalette` type so a dark palette
  can be added later without touching call sites. **Dark mode itself is still
  open** — the structure is ready, the values are not written.

## 7) Side quest: content, process, voice, branding (after MVP)
- Broader pass on quest content/process, brand voice, and visual branding —
  deferred until after MVP validation.

## 8) Adjust Explore map art to match quest vibe
- Current map is a generic forest illustration; revisit so each category's
  spot (and the overall art style) actually feels like the quests it holds,
  not just a themed marker icon dropped on top.

## 9) ~~Let users change onboarding answers later~~ — Done (found already shipped, 2026-08-21)
- Real "Edit preferences" entry point on the Progress tab's account card for
  everyone, not just admin (`docs/onboarding-revision-plan.md` §3). Same
  catch as #1/#5.

## 10) ~~Progress tab: surface the science backing, tucked away~~ — Done 2026-08-21
- `components/progress/ScienceNote.tsx`: a collapsed "Why this works" row at
  the bottom of the Progress tab, expands on tap to the approved research
  paragraph. Verified in the browser preview (expand + collapse both work).
