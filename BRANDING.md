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

**Visual references, both set in the palette they describe:**

- Colour candidates and type specimens — <https://claude.ai/code/artifact/4718686a-8596-4fc8-9cfe-a8d9245f2222>
- Logo concepts, colourways and the amber search — <https://claude.ai/code/artifact/219a906b-33cb-4fa5-96fa-e76df120a338>

| # | Decision | Status |
|---|---|---|
| 1 | Brand name | 🟢 **Confirmed `Side Quest Life`** 2026-09-05 — package `com.sidequestlife.app` is now locked in by choice |
| 2 | Colours | 🟢 **Decided** — beige `#f3f2ec`, forest green `#33471f`, amber `#d9a441`, brand-only. Violet retired 2026-09-05 |
| 3 | Typography | 🟢 **Decided** — Fraunces + Inter. Body face has one open sub-question; not yet implemented |
| 4 | Logo | 🟢 **Chosen 2026-09-05: a cairn** — green ground, beige stones, amber top stone. Needs producing as real assets |

---

## 1. Brand name

## ✅ Confirmed 2026-09-05 — `Side Quest Life`

Standa's call, made deliberately once the consequence below was clear. `com.sidequestlife.app` is
therefore the package name for the life of the app, by choice rather than by drift. The rest of this
section is kept because it explains why this was the one branding decision with a deadline.

**Incumbent: `Side Quest Life`.** Already used consistently — 26 occurrences across the repo, the
app config `name`, the slug `side-quest-life`, the Play/App bundle id `com.sidequestlife.app`, and
the domain the legal contact address assumes (`sidequestlife.com`, see `constants/legal.ts`).

### ⚠️ This one has a real deadline, unlike the rest

**The Android package name `com.sidequestlife.app` can never be changed once the app is published
to Play.** Not renamed, not migrated — a different package is a different app, with a new listing
and zero installs. Everything else on this page can be revised after launch; this cannot.

**The deadline is earlier than "before launch".** Google's testing documentation is explicit: *"Once
you upload an artifact, the package name for that app is fixed and cannot be changed."* That is the
first upload to **any** track — including a throwaway internal test build. So the name has to be
settled before the very first build reaches Play Console, not before the production release.

That window is the reason this was settled before the first build reached Play. It is now closed by
a decision rather than by accident.

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

### ✅ Decided 2026-08-29 — the brand palette

Standa's call, and with it the answer to the role question: **these are brand colours for the logo,
social posts and marketing — not UI colours.** The app keeps its own palette; `#536534` stays the
in-app accent. That settles the hue-crowding problem below by making it irrelevant, because brand
surfaces never show category colours.

| Role | Value | Notes |
|---|---|---|
| Ground | `#f3f2ec` beige | Unchanged from the app, so brand and product share a ground |
| Primary | `#33471f` forest green | Deeper and more saturated than the UI moss — a brand green does not have to carry body text |
| Contrast | **`#d9a441` amber** | Replaced the violet on 2026-09-05 — see below |

### The contrast colour changed: violet → amber

**Decided 2026-09-05, and arrived at the right way round: by testing it in the actual logo rather
than choosing it in the abstract.**

Standa's challenge was the useful one — *if the contrast colour cannot sit next to the primary, it is
a badly chosen contrast colour.* Testing it in the chosen composition (green ground, beige cairn, one
lit top stone) exposed exactly that. The top stone sits **on the green**, and the violet's contrast
against the green is **1.09**: on that ground it simply disappears.

The search that followed produced a rule worth keeping: **against a dark green ground you need a
light colour, not merely a different one.** Rust, terracotta and warm red fail identically to the
violet — all of them are dark on dark. Only the light warm end works.

| Candidate | On green | On beige |
|---|---|---|
| **Amber `#d9a441`** | **4.53** | 2.01 |
| Gold `#e8c87a` | 6.29 | 1.44 |
| Apricot `#e8a87c` | 5.01 | 1.81 |
| Orange `#d9762b` | 3.19 | 2.85 |
| Terracotta `#c15f3c` | 2.41 | 3.77 |
| Violet `#4a3f73` *(previous)* | **1.09** | 8.32 |

Gold scores higher but is so light it stops reading as a *top* stone and becomes just another beige
one. Amber is the highest value that still reads as a stone catching the last light.

**And it is measurably more robust than the violet ever was.** This is where the old palette was
weakest, and the new one is strongest:

| | Amber vs green | Violet vs green |
|---|---|---|
| Normal vision | ΔE 61.5 · contrast 4.53 | ΔE 60.2 · contrast 1.09 |
| Protanopia | ΔE 50.1 · 4.07 | ΔE 56.1 |
| Deuteranopia | ΔE 60.0 · 4.80 | ΔE 52.6 |
| Tritanopia | ΔE 108.6 · 5.33 | **ΔE 3.7 — collapses** |

Amber never drops below ΔE 50 or contrast 4.07 under any form of colour blindness. The violet
collapsed entirely under tritanopia. The whole "green and violet must never share an edge" caveat
disappears with it.

Amber tints, derived the same way as the others — hue and part of the chroma kept, L\* moved:

| Pale (L\* 92) | Soft (L\* 85) | Deep (L\* 55) |
|---|---|---|
| `#ffe3ac` | `#face89` | `#ab7b14` |

**The violet is retired.** Standa's reasoning stands: a contrast colour that does not work in the
logo is not a contrast colour. Nothing in the repo used it, so nothing needs changing. The whole
analysis of it is kept below because it is *why* the amber test was run the way it was.

**One thing to watch:** amber sits at hue 80°, close to the app's `adventure: #8d6025` at 72°. That
does not matter while these stay brand-only colours and never appear beside a category chip — but it
is the reason the brand palette should stay out of the UI, which was already the decision.

### Superseded: the violet analysis

Derived tints, for social backgrounds and larger fills. Hue and a share of the chroma are kept while
L\* is raised, so they stay *the same colour* rather than washing out to grey:

| | Pale (L\* 92) | Soft (L\* 85) | Mid (L\* 62) |
|---|---|---|---|
| Green | `#e0ecd1` | `#cadab8` | `#899c73` |
| Violet | `#ede3ff` | `#dacefa` | `#9c8ec3` |

Ink `#28281f` clears 10:1 on every pale and soft tint, so text on them is safe.

### How the pair actually behaves — measured

**On light grounds, both are excellent.** Green 9.08 and violet 8.32 on beige; 10.19 and 9.33 on
white; and the reverse (beige or white knocked out of either colour) is identical by definition. Any
logo lockup on a light ground, or reversed out of a solid brand colour, is comfortably clear.

**⚠️ But green and violet have almost the same lightness — L\* 27.6 against 30.0 — so their contrast
with each other is 1.09.** Colour distance ΔE 60.2 says they read as two obviously different colours
in normal vision. Value distance says they are the same. Three consequences that matter for a logo:

- **Never set one on the other.** Green text or a thin green line on violet is invisible, and vice
  versa. Large adjacent shapes are fine; overlap and fine detail are not.
- **In one colour they merge.** A monochrome or greyscale rendering — the Android notification
  silhouette, a stamped print, a fax-grade reproduction — flattens both to nearly the same grey. A
  two-colour mark built from these two is a one-value mark in disguise. This is what makes the
  "must survive one colour" constraint in §4 concrete rather than boilerplate.
- **If they must touch**, shift one in lightness rather than hue: `#33471f` against the mid violet
  `#9c8ec3` gives 3.43, which clears AA for graphics and UI components (3:1).

**Colour blindness.** Protanopia and deuteranopia — the common ones, roughly 8% of men — keep the
pair far apart (ΔE 56.1 and 52.6), so the palette is safe for almost everyone. **Tritanopia collapses
it: ΔE 3.7**, the two colours become nearly identical. Tritanopia is rare (~0.01%), so this is a
footnote rather than a blocker, but it points the same direction as the greyscale finding: the logo
should not *depend* on the green/violet distinction to say anything. Decorative use is fine;
load-bearing use is not.

### Correction 2026-09-05 — this was being applied too strictly

Standa pushed back on the above with a fair argument: if the contrast colour cannot appear next to
the primary, it is a badly chosen contrast colour. Re-examining it, he was right that the warning had
been over-generalised.

The rule is about *load-bearing* distinction, and the wording above already said so — but it was then
used to rule out a **decorative** violet stone in the cairn mark, which is a different case. In a
notification silhouette **every** shape flattens to one colour, not just the violet one. If the mark
does not encode meaning in the colour difference, nothing is lost: a cairn is still a cairn.

So the palette is not wrong and all three colours can appear in the logo together. The constraint
that does survive is narrower and geometric: **green and violet must not share an edge.** At 1.09
contrast, a violet shape directly touching a green shape has no boundary. Keeping a beige gap between
them — which the cairn does anyway, since the stones do not touch — removes the problem entirely,
and each stone then sits on beige at 9.08 (green) and 8.32 (violet).

If a future mark genuinely needs the two colours adjacent, the fix is lightness, not hue: the violet
would have to rise to roughly `#9c8ec3`, which buys 3.43 against the green but drops to 2.65 against
beige. That trade is worth knowing about and worth avoiding.

### Background: how the analysis got here

*Kept for the reasoning, not as an open question — the decision above supersedes it. It is also why
the in-app accent should stay `#536534` rather than adopting the new brand green.*

`constants/Theme.ts` was derived on 2026-08-21 from the Explore map artwork rather than picked by
eye, and two of your three colours were already in it:

| Role | Your brief | In the repo today | |
|---|---|---|---|
| Light | Beige | `bg: #f3f2ec` / `surface: #fcfbf8` | ✅ matches |
| Dark | Green | `accent: #536534` (moss, taken from the map's own hue band) | ✅ matches |
| Contrast | Purple | — | ⚠️ conflicted inside the app — see below |

The existing palette also carries a documented method worth preserving: category hues are kept
*out* of the olive band so markers never disappear into the artwork, and their lightness is
staggered so red-green colour blindness cannot collapse them. Anything added here should hold to the
same standard rather than being dropped in by eye.

### Why purple could not simply become a UI colour

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

### Settled

- **Role: brand-only** (Standa, 2026-08-29). Recorded at the top of this section. It is what makes
  all of the crowding analysis above moot — kept anyway, because it is also the reason the UI accent
  should *not* be changed to the new green, and because that reasoning would otherwise be
  re-discovered from scratch.
- **"Dark = green" means the brand colour, not a dark theme** (Standa, 2026-08-29). Dark mode
  remains a separate, still-open project — `ThemePalette` is structured for it and the values were
  never written (`tasks.md` #6).

### Still open

- **Do the brand colours ever enter the app?** Today the answer is no, and nothing forces a change:
  the in-app accent stays `#536534`. Worth revisiting only if the app starts feeling disconnected
  from its own marketing — at which point the deeper green could become an in-app *heading* colour
  without touching the action colour, since headings do not carry the category meaning that caused
  the crowding.

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
| 2026-08-29 | **Ship as `Stanislav Kundera`, private individual** — settled after considering an OSVČ/Organization account | Fixes the public seller name, so it is a brand decision in effect. An Organization account is bound to a legal entity and the IČO is being dissolved — `docs/play-store-roadmap.md` §0.5 |
| 2026-08-29 | Branding brief opened: name, 3 colours, 2 fonts, logo | This document |
| 2026-09-05 | **Name confirmed: `Side Quest Life`** | Standa. Settles the one deadline-bound branding decision — the package name becomes permanent at the first upload to any Play track |
| 2026-09-05 | **Logo direction: a cairn**, all three brand colours, "earth → dusk" | Chosen from five natural concepts. A trail marker left by whoever walked first — closer to what the app does than a leaf or a star |
| 2026-09-05 | Corrected: the green/violet warning had been over-applied | Standa's challenge was right — it governs load-bearing distinction, not decoration. See §2 |
| 2026-09-05 | **Contrast colour changed: violet → amber `#d9a441`** | Chosen by testing it in the actual logo, not in the abstract. The violet had 1.09 contrast on the green ground it would sit on, and collapsed under tritanopia; amber holds above 4.0 under every form of colour blindness |
| 2026-08-29 | Corrected: brand purple is boxed in by `relax` 286° *and* `social` 336° | Earlier blue-violet advice was wrong |
| 2026-08-29 | **Type: Fraunces (headings) + Inter (body)** | Standa, after seeing the three pairings set in real copy |
| 2026-08-29 | **Colour: brand-only palette — beige / `#33471f` / `#4a3f73`** | Standa. Settles the role question: brand surfaces, not UI |
| 2026-08-29 | Visual comparison published | Colour candidates and type specimens, set in the palette itself: https://claude.ai/code/artifact/4718686a-8596-4fc8-9cfe-a8d9245f2222 |
