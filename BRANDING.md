# Branding

The single place where brand decisions live: name, colour, type, logo. Started 2026-08-29.

This is a **decision log, not a style guide** — it records what was chosen, what is still open, and
why, so the same question does not get re-argued every session. Once a decision lands here, the
implementation follows it (`constants/Theme.ts`, `constants/legal.ts`, `assets/`), not the other way
around.

Constraints this has to design *within*, not against — from `AGENTS.md`:
calm, grounded UI; restrained typography; no loud patterns; no gamification or streak-pressure
visuals. See also `[[sidequest-mentor-philosophy]]`: the "quiet companion, zero pressure"
positioning has been reinforced more than once and is not up for casual revision.

| # | Decision | Status |
|---|---|---|
| 1 | Brand name | 🟡 Incumbent, needs confirming — **and there is a deadline, see below** |
| 2 | Colours | 🟡 Two of three already exist; the third has a conflict to resolve |
| 3 | Typography | 🔴 Open — nothing chosen, nothing loaded |
| 4 | Logo | ⏸️ Deliberately blocked on 1–3 |

---

## 1. Brand name

**Incumbent: `Side Quest Life`.** Already used consistently — 26 occurrences across the repo, the
app config `name`, the slug `side-quest-life`, the Play/App bundle id `com.sidequestlife.app`, and
the domain the legal contact address assumes (`sidequestlife.com`, see `constants/legal.ts`).

### ⚠️ This one has a real deadline, unlike the rest

**The Android package name `com.sidequestlife.app` can never be changed once the app is published
to Play.** Not renamed, not migrated — a different package is a different app, with a new listing
and zero installs. Everything else on this page can be revised after launch; this cannot.

So the name question has to be settled *before the first production upload*, not before the first
build. If there is any doubt about `Side Quest Life`, now is when it costs nothing to change it.

The store *display* name is separate and can be edited freely, so the two can diverge later if
needed — but a package id that contradicts the brand is a small permanent embarrassment.

### Open sub-questions

- **Wordmark casing.** The app currently sets the name as a small uppercase kicker with 1.2
  letter-spacing (`app/onboarding.tsx:724`). Is that the wordmark, or just one UI treatment of it?
- **Short form.** The icon cannot hold three words legibly at 48px. Is there a mark ("SQ", a
  symbol), or does the icon carry no letterforms at all? This decides half of §4.
- **Play listing name** — up to 30 characters. `Side Quest Life` is 15, so there is room for a
  descriptor if wanted, though the current store copy doesn't use one.

---

## 2. Colours

### What already exists, and is already what you asked for

`constants/Theme.ts` was derived on 2026-08-21 from the Explore map artwork rather than picked by
eye, and two of your three colours are already in it:

| Role | Your brief | In the repo today | |
|---|---|---|---|
| Light | Beige | `bg: #f3f2ec` / `surface: #fcfbf8` | ✅ matches |
| Dark | Green | `accent: #536534` (moss, taken from the map's own hue band) | ✅ matches |
| Contrast | Purple | — | ⚠️ conflict, below |

The existing palette also carries a documented method worth preserving: category hues are kept
*out* of the olive band so markers never disappear into the artwork, and their lightness is
staggered so red-green colour blindness cannot collapse them. Anything added here should hold to the
same standard rather than being dropped in by eye.

### ⚠️ The purple is already taken

`social: #824071` is the Social category colour — and measured in Lab it sits at **hue 336°**, which
is plum/magenta. It is, for practical purposes, already a purple. Adding a second purple as the
brand contrast colour means two purples in one interface meaning two unrelated things: "this is a
Social quest" and "this is the primary action".

Measured candidates (WCAG contrast, and ΔE76 distance — same family of check the palette was
originally verified with):

| Candidate | Hex | Hue | vs `bg` | vs `surface` | vs white | ΔE vs `social` | ΔE vs green |
|---|---|---|---|---|---|---|---|
| *social (existing)* | `#824071` | 336° | 6.41 | 6.95 | 7.19 | — | 65.5 |
| Deep indigo-violet | `#4a3f73` | 302° | 8.32 | 9.02 | 9.33 | 22.7 | 64.3 |
| Muted violet | `#5b4b8a` | 304° | 6.64 | 7.20 | 7.45 | 21.9 | 69.6 |
| Mid purple | `#6b4e9e` | 307° | 5.84 | 6.32 | 6.54 | 24.5 | 79.4 |
| Vivid purple | `#7a4da6` | 312° | 5.44 | 5.90 | 6.11 | 25.9 | 84.8 |
| Classic amethyst | `#8e44ad` | 318° | 5.23 | 5.67 | 5.87 | 31.2 | 94.2 |

Reading it: every candidate clears WCAG AA (4.5:1) on both backgrounds, and every one is
enormously far from the green, so there is no risk of muddling brand purple with brand green. The
tension is entirely with `social`. For scale, the existing category pairs sit around ΔE 37.9 in
normal vision — so a brand purple at ΔE ~22–26 is *distinguishable but noticeably closer* than the
separation the palette was built to.

**Recommendation: go blue-violet, around 302–305°** — `#4a3f73` or `#5b4b8a`. Furthest in hue from
`social`'s magenta, best contrast of the set, and the cooler cast sits better against warm beige than
a red-leaning purple does. The counter-intuitive part: the *bigger* ΔE numbers (amethyst, 31.2) come
from being lighter and more saturated, not from being further in hue — they read as "more different"
on a chart while looking more like `social` on screen.

**The alternative worth naming:** move `social` off magenta entirely and give the whole purple space
to the brand. Cleaner semantically, but it re-opens the colour-blindness verification for the
category set, so it is real work rather than a swap.

### Decisions needed

- Which purple, and at what role — accent for primary actions, or reserved for the logo and
  marketing only? (Reserving it avoids the `social` collision almost entirely, since the two would
  rarely appear together.)
- Does `social` move?
- **Dark mode.** `ThemePalette` is structured so a dark palette slots in without touching call
  sites, but the values were never written (`tasks.md` #6). Your "dark = green" may mean the brand's
  dark colour, or it may mean a dark theme — worth being explicit, they are different projects.

---

## 3. Typography

**Current state: there is none.** Everything renders in the system font. The one custom font loaded,
`SpaceMono` (`app/_layout.tsx:60`), is an unused Expo template leftover and should be deleted as
part of whatever lands here — it currently costs startup time for nothing.

### Constraints

- **Licence must allow embedding.** SIL OFL is the safe default; anything else needs reading before
  it ships in a binary.
- **Two families is the budget**, per your brief. Each one is bundle size and startup cost, and
  `useFonts` blocks the splash until they load.
- **Restrained**, per `AGENTS.md`. A display face with personality is fine for headings; the body
  face should disappear.
- **Czech diacritics** — verified rather than assumed: all candidates below serve `latin-ext`
  covering `U+0100–02BA`, which includes ř, ž, ů, č, ě. Not a differentiator among mainstream Google
  fonts, but a genuine trap if a boutique or display face gets chosen later for the wordmark — those
  routinely ship without ů and ř, and it will not be noticed until Czech marketing copy is set.

### Pairings to choose from

| | Heading | Body | Character |
|---|---|---|---|
| **A** | Fraunces | Inter | Warm, slightly oddball variable serif against a fully neutral body. Most personality; closest to "grounded but not corporate". |
| **B** | Source Serif 4 | Source Sans 3 | Designed as one family, so they pair by construction. Safest, least distinctive. |
| **C** | Newsreader | Inter | Editorial, quiet, a little literary — suits the memories/journal half of the product. |

My lean is **A**: the product's voice in `docs/story.md` and `docs/value-proposition.md` is warm and
a little wry, and Fraunces carries that in a way Source Serif deliberately does not. B is the choice
if the priority is never being wrong rather than being memorable.

### Decision needed

Pick a pairing, or reject all three with a direction. Then it is a small implementation: load via
`expo-font`, add `heading`/`body` roles alongside the colour tokens, delete SpaceMono.

---

## 4. Logo

**Blocked on 1–3, by your own sequencing** — the logo comes out of the branding rather than driving
it. Nothing to decide yet.

Recording the hard constraints now so they are not discovered late, because they genuinely
constrain the design:

- **Android adaptive icon**: the artwork is a 108dp canvas of which only the centre **66dp circle is
  guaranteed visible** — launchers mask the rest into circles, squircles, or rounded squares. Any
  detail or lettering outside that circle will be cut off on some devices.
- **Play listing icon**: 512×512 PNG, 32-bit, no transparency.
- **Legible at 48px.** This is what kills three-word wordmarks and fine illustration.
- **Must survive one colour.** Notification icons on Android are silhouettes — if the mark only
  reads in full colour, it disappears there.
- **Must work on both beige and green**, since it will sit on the app background and on brand
  surfaces.

Current state: a real icon shipped in `241f940` (no longer the Expo default), so nothing is blocked
on this — it can be replaced whenever the branding lands. Store screenshots and the 1024×500 feature
graphic are downstream of this too, and both can be swapped in the Play listing without a new app
review.

---

## Decision log

| Date | Decision | Note |
|---|---|---|
| 2026-08-21 | Palette derived from Explore map artwork | Method and measurements in `constants/Theme.ts`; `tasks.md` #6 |
| 2026-08-21 | Dark mode structured but not written | `ThemePalette` type ready, values absent |
| 2026-08-29 | Ship as `Stanislav Kundera`, private individual | Not a brand decision as such, but it fixes the public seller name — `constants/legal.ts` |
| 2026-08-29 | Branding brief opened: name, 3 colours, 2 fonts, logo | This document |
