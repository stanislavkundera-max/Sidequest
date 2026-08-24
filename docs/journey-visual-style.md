# Journey — visual & interaction style rules

**Audience:** Humans + AI agents implementing the Journey tab. These rules are **binding** for Journey work unless the product owner explicitly changes them.

**Scope:** `app/(tabs)/journey.tsx`, `components/journey/**`, `src/features/journey/**`. Shared hub chrome lives in `components/journey/journeyHubStyles.ts`, reused by `components/journey/PausedAndLikedSections.tsx` (rendered on the Progress tab, `app/(tabs)/profile/ProgressOverview.tsx`) — keep both aligned when changing chips, timeframe strips, or discover rows. Avoid unrelated screens unless wiring requires a minimal, justified touch.

> **Status (2026-08-21):** live. The "world scene" system this doc describes below — path spine,
> artifacts, atmosphere/mood layers, `JourneyWorldScene`/`JourneyAtmosphere` etc. — had been built
> once (2026-07-27–08-06), never wired into any screen, and was deleted as dead code on 2026-08-06.
> It was restored from git history and wired into `app/(tabs)/journey.tsx` on 2026-08-21, as a
> panel above the existing `AllQuestsList` catalog (not a replacement for it). `saved_for_later`
> quests (paused/liked) are intentionally not shown on the path. The rules below describe current
> behavior, not an unrealized vision.

---

## North star

- **One shared path** through one world. Categories shape **markers, glows, and artifacts around** the path — never separate paths per category.
- **Calm, meaningful, slow dopamine** — the world should feel like a **quiet diorama** built from real actions, not a gamified HUD or generic “wellness” UI.
- **Visual story first** — copy (micro-narrative) supports the scene; it does not replace it.

---

## Layer stack (bottom → top)

1. **Atmosphere** — sky → horizon → ground; optional fog / tint bands.
2. **Path spine** — readable trail (bands or future Skia stroke); must survive on real devices.
3. **Path markers** — category glows along placements (completed full strength; **active ~50% opacity** on the same spine unless intentionally retuned).
4. **Artifacts** — beside the path (lateral offset from path tangent), sized by timeframe.
5. **Current position** — strongest focal point at the leading placement.
6. **Chrome** — Timeline control, narrative pill; must not obscure the path spine.

---

## Path

- **Contrast:** Path tread must be readable without squinting; avoid near-black-on-black and muddy dark-on-dark.
- **Geometry:** Quest markers and artifacts follow the **painted path polyline** (`JOURNEY_PATH_POINTS` in `journeyImagePath.ts`). Depth scaling still uses `trailWidthAtT` / `scaleAtT` with placement `t`. Do not reintroduce a second synthetic path spine on top of the background art.
- **Progression:** Trail width / completion feel may reflect **completed** quest count — active quests must not inflate “world completion” metrics unless the product asks for it.
- **Nothing the user earned may be cropped.** The panel is **not** a fixed-height hero: it grows
  with the stretch of trail actually occupied (`JourneyWorldScenePanel`), and the crop is anchored
  to that band (`journeySceneAnchorForBand`), not centred. An empty path shows a short trailhead
  strip. If the band cannot fit, the **top** wins — that end holds the newest marker and the current
  position. The background bitmap is positioned from the *same* layout object as the markers, so
  art and path can never drift out of register; do not reintroduce `resizeMode="cover"` here, which
  always centres and would desync them.

---

## Quest markers (on-path)

- **Completed** and **active** both appear on the **same** ordered trail; active segment sits **ahead** (higher `t`) of the completed band.
- **Active visibility:** default **~50% opacity** on category glow vs completed (tunable constant, document if changed).

---

## Artifacts (off-path)

- **Placement:** Deterministic from quest id / completion / index; **lateral to path** (normal from tangent), alternating sides where applicable.
- **Size:** `weekly` → small, `monthly` → medium, `yearly` → landmark (larger offset from spine for landmarks).
- **Look:** **Lofi / soft illustrated** direction — rounded “paper” bases, pastel category ink, subtle halo; **no emoji / system icon fonts** as stand-ins for world objects. Prefer simple composed shapes, future sprites, or Skia — not stock gamified icons.
- **Memory-linked:** Slightly elevated treatment (warm border / paper), still restrained.

---

## Interaction

- **Artifact tap:** **Memories-first** — open linked memory detail when `linkedMemoryId` exists; otherwise open the **Memories** tab. Do not route artifact taps to quest detail unless product overrides this doc.
- **Timeline:** Completed steps list remains valid; extend with actives only if spec’d.

---

## Motion (React Native Reanimated)

- **Artifact reveal:** ~400–700ms, ease-out, opacity + scale **0.9 → 1.0**; **one** soft ripple, not repeating pulses.
- **Atmosphere / world change:** Slow pulse or cross-fade (~1.2–2.0s), subtle.
- **Ambient loops:** Long periods (e.g. 8–20s), sine easing — **no** bounce spam, flashy strobes, or competitive “power-up” language.

---

## Typography & copy (Journey)

- **Micro-narrative:** One short line in a **high-contrast** pill; `Theme`-aligned text colors.
- **Future marker labels** (if added): at most **two lines** — primary title + small meta (date / timeframe); never wall of text on the canvas.

---

## Color & atmosphere

- **Separate planes:** Sky, horizon band, ground planes must remain distinguishable under fog.
- **Category color:** Express through **marker glows and artifact ink**, not by washing the entire scene in one hue.
- **Relax / night:** Still needs readable separation — no “everything is #0a0a0a.”
- **One hue per category, two tiers of lightness (decided 2026-08-21).** `constants/Theme.ts`
  and the scene's `LofiInk` palette in `JourneyArtifactGlyph.tsx` must share the **hue** for each
  category; they differ only in lightness, because UI chips need contrast on `bg`/`surface` while
  scene glyphs sit on painted art. Social is **warm** (~25°) in both — its glyphs are lanterns,
  campfires and lit windows, and the microcopy says "warm lights are appearing along your way";
  a cool social hue contradicts the whole artifact set. When adding or retuning a category color,
  change both files together and re-check contrast against `Theme.bg`.

---

## Roadmap toward illustration-grade reference

When approaching painterly reference boards:

1. **Background** — Hero bitmap (`assets/images/journey-valley-background.png`, `cover` in `JourneyAtmosphere`) and/or future parallax layers (exported @1x/@2x/@3x); keep file size budget in mind.
2. **Path glow** — Prefer **Skia** (gradient along curve, soft outer glow) if Views are insufficient; document the dependency in `README.md` / `AGENTS.md` when added.
3. **Artifact icons** — Consistent **sprite size** + one art style bible (weekly / monthly / yearly × category); code maps `JourneyArtifactVisual` → a composed-`View` glyph (`JourneyArtifactGlyph.tsx`), not an image asset — no per-artifact art file needed today.
4. **Avatar / “you”** — Simple silhouette + soft ring at current `t`; keep accessible target size.

Do **not** block Journey UX on Rive/Lottie for the full scene; use them only for isolated accents if needed.

---

## Accessibility

- Meaningful `accessibilityLabel` / roles on Journey controls, Timeline, and tappable artifacts.
- Touch targets meet platform guidance; narrative region polite updates where used.

---

## Progress tab — hub list parity

The **Progress** tab (`app/(tabs)/profile/ProgressOverview.tsx`) shows paused/liked quests via `components/journey/PausedAndLikedSections.tsx`, reusing the **same hub discover chrome** as the Journey catalog (`components/journey/journeyHubStyles.ts`): discover-style quest rows and card treatment. It does **not** embed the Journey world scene, path spine, chips, timeframe hero imagery, or lateral artifacts — that richer chrome was built once (`components/journey/JourneyQuestHub.tsx` and `components/progress/ProgressQuestHub.tsx`, both removed 2026-07-27 as unused dead code — see `docs/feedback/round-1-synthesis.md`) but never actually wired to a live screen. When tuning hub visuals, update the shared stylesheet so Journey and Progress stay aligned unless the product intentionally diverges them.

---

## Explicit “do not”

- No separate path per category; no RPG stats, loot, streak guilt, or fantasy lore systems on Journey.
- No loud gamification visuals (confetti spam, achievement explosions) unless product explicitly requests.
- Do not replace the path with a flat list — Journey remains a **spatial** metaphor.
