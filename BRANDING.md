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

**Visual comparison** (colour candidates and type specimens, set in the palette itself):
<https://claude.ai/code/artifact/4718686a-8596-4fc8-9cfe-a8d9245f2222>

| # | Decision | Status |
|---|---|---|
| 1 | Brand name | 🟡 Incumbent, needs confirming — **and there is a deadline, see below** |
| 2 | Colours | 🟡 Two of three already exist; the third has a conflict to resolve |
| 3 | Typography | 🟢 **Decided** — Fraunces + Inter. Body face has one open sub-question; not yet implemented |
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

And `social` is not the only neighbour. Measured across the **whole** palette, `relax: #4264b3`
turns out to sit at hue **286°** — already a violet-blue. Purple is boxed in between two occupied
hues with about 50° of gap, and the candidates land in it like this (ΔE76; the last column is the
closest collision, which is the only one that matters):

| Candidate | Hex | Hue | vs `bg` | vs white | vs `social` 336° | vs `relax` 286° | **closest** |
|---|---|---|---|---|---|---|---|
| Deep indigo-violet | `#4a3f73` | 302° | 8.32 | 9.33 | 22.7 | 22.5 | **22.5** |
| Muted violet | `#5b4b8a` | 304° | 6.64 | 7.45 | 21.9 | 17.2 | **17.2** |
| Mid purple | `#6b4e9e` | 307° | 5.84 | 6.54 | 24.5 | 18.5 | **18.5** |
| Vivid purple | `#7a4da6` | 312° | 5.44 | 6.11 | 25.9 | 24.2 | **24.2** |
| Classic amethyst | `#8e44ad` | 318° | 5.23 | 5.87 | 31.2 | 35.4 | **31.2** |

All clear WCAG AA on both backgrounds, and all are far from the green and the ochre — so contrast
was never the problem. Hue crowding is.

**Correction to an earlier recommendation in this file:** "go blue-violet, 302–305°" was wrong. It
was based on measuring against `social` alone; adding `relax` inverts the answer, because every step
toward blue walks *into* `relax`. `#5b4b8a` has the worst separation of the set (17.2), close to the
ΔE 15.1 floor the palette notes call acceptable "only because category colour is never the sole cue."

Of purples that stay in the UI, the least-bad is the **amethyst end, ~315–320°** (31.2). But that is
also the loudest and most saturated of them, which argues against it under "calm, grounded."

### The structural finding, which matters more than picking a hex

Every *natural* contrast colour is already occupied, because the category palette was deliberately
spread across the natural spectrum:

| Natural contrast candidate | Referent | Already in the app as |
|---|---|---|
| Dusk violet | twilight sky, thistle, blackberry | `relax` 286° / `social` 336° squeeze it |
| Rust, terracotta | rosehip, rowan berry, clay | `danger: #b13a2f` at 35° — and brand colour = error colour is a worse collision than any of the above |
| Amber, honey, gold | late sun, wheat, birch | `adventure: #8d6025` at 72°, and too low-contrast on beige to carry an action |

**So the productive move is not to hunt for a free hue. It is to decide the brand contrast colour
is not a UI colour.** Reserved for the logo, store assets, and marketing — surfaces where category
colours never appear — the collision stops existing, and the colour can be as bold as the brand
wants without fighting "calm, grounded" inside the app. The app's primary action stays the green it
already is.

If instead the contrast colour must live in the UI as the primary-action colour, something has to
move, and the cheapest thing to move is `social` — not `danger`, whose meaning is not negotiable.

### Decisions needed

- **Role first, hex second.** Is the contrast colour a brand-only colour (logo, store, marketing) or
  a UI colour (primary actions)? This decides whether hue crowding matters at all, and every other
  colour question follows from it.
- If it goes in the UI: which hue, and does `social` move to make room?
- Exact shades for green and beige. The current values are a good starting point but were derived
  for UI legibility, not as a brand green — a brand green can be deeper and more saturated than
  `#536534`, since it does not have to carry body text on beige.

### Settled

- **"Dark = green" means the brand colour, not a dark theme** (Standa, 2026-08-29). Dark mode
  remains a separate, still-open project — `ThemePalette` is structured for it and the values were
  never written (`tasks.md` #6).

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

### ✅ Decided 2026-08-29 — Fraunces for headings, Inter for body

Standa's call, after seeing the three pairings set in real copy.

**Why Fraunces is the organic one**, since "which feels most natural" was the deciding question and
the answer is structural rather than a matter of taste: Fraunces carries a variable **`WONK`** axis
that tilts letterforms off-square and a **`SOFT`** axis that rounds stroke terminals. It was built to
be able to look made by hand rather than computed. Newsreader is quiet-editorial by comparison and
Source Serif is systematic — deliberately the least organic of the three.

Both faces are SIL OFL and both serve `latin-ext`, so Czech diacritics are covered (verified, see
above).

**The rejected options, kept so this is not re-litigated:** Source Serif 4 + Source Sans 3 (safest,
least distinctive) and Newsreader + Work Sans (editorial, quieter).

### One sub-question still open

**Inter is a neo-grotesque — engineered by design, not organic.** It was chosen for legibility at
13–16px on a phone, which is the right priority for body text, with the warmth carried by the
headings. If the organic feel should run through the body copy too, a humanist sans is warmer:
**Source Sans 3** or **Work Sans**. That is a one-line change and does not touch the heading
decision.

### Implementation, once the body face is final

Load both via `expo-font` in `app/_layout.tsx`, add `heading`/`body` roles alongside the colour
tokens so screens stop naming families directly, and **delete `SpaceMono`** — it is an unused Expo
template leftover that currently costs startup time for nothing.

Fraunces is variable: worth exposing `WONK`/`SOFT` deliberately rather than shipping the default
upright cut, since that axis is the entire reason it was chosen.

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
| 2026-08-29 | Corrected: brand purple is boxed in by `relax` 286° *and* `social` 336° | Earlier blue-violet advice was wrong |
| 2026-08-29 | **Type: Fraunces (headings) + Inter (body)** | Standa, after seeing the three pairings set in real copy |
| 2026-08-29 | Visual comparison published | Colour candidates and type specimens, set in the palette itself: https://claude.ai/code/artifact/4718686a-8596-4fc8-9cfe-a8d9245f2222 |
