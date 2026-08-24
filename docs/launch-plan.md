# Launch plan — 3 pillars

Draft plan for the next phase: (1) app store readiness, (2) redesign, (3) content.
Researched 2026-08-06 — store policies change, so re-verify anything with a $ or a deadline
attached before acting on it if this doc is more than a couple months old.

Each pillar below has the same shape: **current state** (audited from this repo today), **what's
actually required** (researched externally), **decisions only Standa can make**, and **what
happens next**. Pillar 3 is intentionally the lightest on "go build this" — Standa owns the actual
content work — and heaviest on "here's what needs deciding first."

---

## Pillar 1 — App Store & Play Store readiness

### Current state (audited from the repo)

| Item | Status |
|---|---|
| iOS bundle ID / Android package | ✅ Already set: `com.sidequestlife.app` (`app.config.ts`) |
| EAS Build/Submit config (`eas.json`) | ❌ Does not exist — EAS has never been set up for this project |
| Apple Developer Program enrollment | ❓ Unknown — not visible from the repo, needs confirming |
| Google Play Console account | ❓ Unknown — same |
| App icon / splash / adaptive icon | ⚠️ Files exist but are the **literal default Expo template** placeholder (concentric grey circles) — not a real icon |
| Custom typography | ❌ None — default system font; `SpaceMono` is loaded but effectively unused (Expo template leftover) |
| Privacy policy | ❌ Does not exist anywhere in the repo |
| Terms of service | ❌ Does not exist |
| Account deletion (in-app) | ❌ Does not exist. `AccountCard.tsx` has "Delete all progress," which wipes quest/memory **data** and resets onboarding — it does **not** delete the Supabase auth account or profile row. This is a different thing from what both stores require. |
| Permission usage strings | ✅ Already present and reasonable: calendar (`expo-calendar`) and photos (`expo-image-picker`) both have justification text in `app.config.ts` |
| Third-party tracking / ad SDKs | ✅ None. Analytics is first-party only (`src/lib/analytics`, writes to your own Supabase `analytics_events` table). No IDFA, no ad network, no Firebase/Mixpanel/Amplitude. **This meaningfully simplifies both stores' privacy paperwork.** |
| Sign-in methods | Email/password + Supabase anonymous auth only. No Google/Facebook/Apple social login. |
| Reviewer/demo access | ❌ No demo account prepared — the app requires sign-in, so Apple/Google reviewers will need one |
| iPad support | `ios.supportsTablet: true` is set — this **pulls in an extra required screenshot size** (see below) for arguably no current benefit, since nothing in the app is iPad-tailored |

**Found in passing, worth a security/hygiene check before any release build:** `lib/devAuth.ts`'s
auto-login is correctly gated behind `__DEV__`, but the underlying `EXPO_PUBLIC_DEV_LOGIN_EMAIL`/
`PASSWORD` values still flow into `app.config.ts`'s `extra` block regardless of `__DEV__`. If those
env vars were ever set while running an EAS **production** build profile, the literal credential
strings would ship inside the JS bundle. Not a current bug — nothing sets them today — but worth an
explicit "never set these for release builds" note in the EAS setup, not something to discover by
accident.

### What's actually required (researched)

**Apple App Store**
- **Apple Developer Program: $99/year.** Individual or Organization costs the same; Organization
  needs a D-U-N-S number for a registered legal entity and shows a company name (not your personal
  name) as the seller.
- **Account deletion is mandatory** (Guideline 5.1.1(v), enforced since June 2022). Must actually
  delete the account and its data — a "deactivate" toggle doesn't satisfy it. Since this app has
  real email/password accounts (not just anonymous), this applies.
- **App Privacy "nutrition label"** — a questionnaire in App Store Connect (15–30 min, can be 100+
  sub-questions depending on data types). Given the first-party-only analytics setup above, this
  should land in the *simple* end of the spectrum: user content (memories/photos), an identifier
  (user ID), usage data — all "linked to user," none "used to track" (no cross-app tracking exists).
- **New iOS 26 SDK requirement**, mandatory for all submissions since April 28, 2026 — whatever
  builds the app (EAS's build image) needs to be current.
- **Screenshots:** 6.9" iPhone at exactly 1320×2868px, plus 13" iPad at 2064×2752px **because
  `supportsTablet: true` is set** — max 10 images per localization, and App Store Connect rejects
  images that are off by even one pixel.
- **TestFlight** needs its own (lighter, faster) external-beta review before external testers can
  install a build — separate from, and required before, the full App Store review.
- Review turnaround is currently fast: ~90% of submissions reviewed within 24–48 hours.

**Google Play**
- **Google Play Console: $25, one-time** (not annual) — but now requires tighter identity
  verification / 2-step verification to enable uploading.
- **Data safety section is mandatory** and must accurately list every data type collected/shared —
  same "should be simple" note as Apple's label, for the same first-party-only reason.
- **Account deletion is mandatory and stricter than Apple's version**: you need **both** an in-app
  deletion option **and** a public web URL where someone can request deletion without installing
  the app at all.
- **Target API level: Android 16 (API 36) required for new apps/updates starting Aug 31, 2026**
  (existing apps get to Nov 1, 2026 with an extension). Worth confirming Expo SDK 54's default
  target SDK clears this at actual build time — Expo tracks new Android releases quickly, but don't
  assume, check when you actually build.
- **Content rating (IARC questionnaire):** free, ~10–15 min, mandatory — app gets removed without
  one.
- **⚠️ The one true bottleneck to plan around:** if the Play Console account is newly created
  (anything after Nov 13, 2023 counts as "new"), Google requires a **closed test with at least 12
  opted-in testers, active for 14 continuous days**, before you're even allowed to request
  production access. "Opted in" means they accepted the invite *and* installed the build under a
  matching Google account — just adding 12 emails doesn't count, and dropping below 12 active
  testers at any point resets the 14-day clock. Your round-1 group (5 testers + mentor = 6 people)
  is half of what's needed. **This is a calendar constraint, not an effort constraint — it's worth
  starting the moment there's a working build, in parallel with everything else, since the 14 days
  run regardless of what else is happening.**

**Both stores / cross-cutting**
- **GDPR applies** — you're EU-based and will have EU users, so the privacy policy needs actual
  GDPR content (consent, data minimization, the right to access/delete), not a generic US-style
  template. The lack of third-party trackers again makes this simpler than a typical app.
- **EAS Build + EAS Submit** is the standard modern path for an Expo app like this one: builds the
  native binary in Expo's cloud (handles code signing for you), then uploads directly to App Store
  Connect / Play Console. Needs an `eas.json` and an Expo account linked to the project — neither
  exists yet.

### Confirmed gaps, in the order they'd actually block you

1. Real app icon + splash screen (currently the Expo default) — **depends on Pillar 2**
2. Privacy policy (doesn't exist) — needs real GDPR-aware content, needs to be hosted at a public URL
3. Terms of service (doesn't exist — not strictly mandated everywhere but standard practice)
4. In-app account deletion feature — mandatory, doesn't exist. For Google, also needs a public web
   page (can be a simple static page, doesn't need to be in the app itself)
5. `eas.json` + linking the project to an Expo/EAS account — not set up
6. Apple Developer Program enrollment ($99/yr) — confirm whether already done
7. Google Play Console enrollment ($25 one-time) — confirm whether already done, **and start the
   12-tester/14-day clock as early as possible once there's a working build**
8. Store screenshots at the exact required pixel sizes — none exist, **depends on Pillar 2** for
   actual visual content worth screenshotting
9. Store listing copy (description, keywords, short description) — not written
10. Content rating questionnaires (Google's IARC + Apple's own in App Store Connect) — not started
11. Privacy nutrition label (Apple) / Data safety form (Google) — not started, should be
    straightforward given the simple data model
12. A demo/reviewer account with credentials, since the app requires sign-in — needs preparing
13. Confirm at build time that the Android target API level clears the Aug 31, 2026 bar
14. Build-hygiene check: confirm dev-login env vars are never set for the EAS production profile

### Decisions only Standa can make

- **Individual or Organization** for the Apple Developer account (and same question for Google)?
  Depends on whether there's a registered company (IČO) you want as the public seller name, or
  whether shipping under your own name is fine for now.
- **Payment method** for the $99 + $25 — trivial amounts, but personal card vs. a business account
  is worth deciding once rather than defaulting by accident.
- **Drop `supportsTablet: true`?** If iPad isn't a real target for the MVP, turning it off removes
  the 13" iPad screenshot requirement entirely — one less asset size to produce, no functional loss
  since nothing is iPad-tailored today anyway.
- **Who are the 12+ Play Store closed testers?** The round-1 group covers half. Worth deciding now
  since the 14-day clock is the single biggest timeline lever in this whole pillar.
- **When to start the Play Store testing clock** — my recommendation: as soon as there's *any*
  working build worth putting in front of 12 people, even before the icon/redesign/content work is
  finished, purely because the 14 days run in parallel with everything else and cost nothing to start.

### What happens next (once decisions land)

I can build: the account-deletion feature (in-app + the Google web page), a first-draft privacy
policy and terms of service (GDPR-aware, matched to what the app actually collects), the `eas.json`
setup, and a demo/reviewer account. The icon/splash/screenshots depend on Pillar 2 landing first —
or at minimum, a placeholder-but-real icon so store setup isn't fully blocked on the full redesign.

---

## Pillar 2 — Redesign

### Current state (audited from the repo)

- `constants/Theme.ts` is a small, coherent, but explicitly-placeholder earth-tone palette (warm
  off-white background, sage-green accent, muted per-category colors for Nature/Adventure/Social/
  Relax). Functional, not embarrassing, but `tasks.md` #6 already flags it as "revisit once
  branding direction is set."
- No real typography — default system font throughout; the one loaded custom font (`SpaceMono`)
  is an unused Expo template leftover.
- App icon, splash screen, adaptive icon: all the literal default Expo template graphic (grey
  concentric circles) — zero brand identity in the one asset every user sees before opening the app.
- Explore map background is a generic stock-feeling forest illustration — `tasks.md` #8 already
  flags it as not matching the actual quest content/vibe.
- **A more ambitious visual direction was designed but never shipped:** `docs/journey-visual-style.md`
  describes a rich "world scene" system — a painted path, artifacts along it, mood/atmosphere
  layers reacting to time of day and progress. The implementation (~2,900 lines across 8
  components) was found completely disconnected from the live app during the 2026-08-06 cleanup and
  deleted as dead code. **Rebuilt and evaluated 2026-08-21** — it now exists on branch
  `journey-world-scene` (not merged) with the blockers written up in `docs/journey-visual-style.md`.
  The fork below is updated accordingly.
- **Two paintings, two unrelated styles.** `explore-map-background.png` (live) is a detailed,
  saturated, top-down illustration; `journey-valley-background.png` is soft hazy concept art; the
  UI around both is flat and minimal. Picking one house style and redrawing to it is probably the
  single most visible thing this pillar can do.
- `AGENTS.md`'s own design principles are a real constraint to design *within*, not against: "calm,
  grounded UI," "no loud UI patterns," explicitly bans streak-pressure/gamification visuals. A
  redesign that goes maximalist or game-HUD-flavored would contradict the product's own stated
  identity (see `[[sidequest-mentor-philosophy]]` for how firmly that's been reinforced).
- `docs/value-proposition.md` and `docs/story.md` already contain real founder voice and content —
  useful input for tone/personality even before Pillar 3 finishes their two open placeholders.

### Options researched

| Path | Cost (mobile app UI/UX scope) | Best fit when |
|---|---|---|
| **DIY with AI design tools** (Uizard, Banani, Visily, AIDesigner, Framer, UXPilot) | Free–~$50/mo | You want to explore directions fast yourself, cheaply, before committing money — prompt-to-UI, multi-screen prototypes in minutes. Output quality varies; still needs a trained eye to pick/refine what comes out. |
| **Freelance designer** | $8,000–$40,000 total project (or $50–150/hr) | You want a real designer's judgment without agency overhead. 40–60% cheaper than an agency for similar scope, but you're managing sourcing, vetting, and quality control yourself. |
| **Unlimited design subscription** (Design Pickle, Penji, ManyPixels, Design Shifu, and similar) | ~$150–$500/mo at the affordable end | You want continuous, iterative design help (icon, palette exploration, screenshots, marketing assets) without a large one-time commitment, and you're not sure yet exactly how much design work this needs. Requests queue and get done sequentially, revisions included. |
| **Design agency** | $25,000–$80,000+ project scope ($150–350/hr) | You want a hands-off, high-trust full identity system and have the budget — probably more than a pre-revenue MVP needs right now. |
| **Traditional tools without AI** (Figma, or the open-source Penpot) | Free–~$15/mo | Whatever path you choose, whoever ends up doing the actual screen mockups will very likely hand you Figma files regardless — worth having a Figma account either way, even just to receive and comment on deliverables. |

**My lean:** given the app is pre-revenue and Pillar 3's content isn't finished yet, a bounded
**"identity pass"** — real icon, real palette, real type pairing, a handful of key-screen mockups —
via either a single well-vetted freelancer or a design subscription seems like the pragmatic middle
ground: cheaper and faster than an agency, a higher quality floor than pure DIY. Using an AI tool
yourself first to explore 2–3 directions before briefing a human (freelancer or subscription) could
make that paid engagement land faster, since you'd be handing over a reference instead of a blank
page.

### Decisions only Standa can make

- **Budget range** — this alone determines which of the 4 paths above is even viable.
- **Timeline** — does the redesign need to land *before* store submission (so screenshots/icon are
  final), or is a "good enough, real, just not final" icon acceptable to unblock Pillar 1 while
  deeper redesign continues in parallel? My lean: don't let redesign fully block the Play Store
  12-tester clock (Pillar 1) — that clock is calendar-bound, design work is not.
- ~~**Revive the "world scene" visual direction, or formally abandon it?**~~ **Partly resolved
  2026-08-21 — the engineering half is answered, the design half is now the real question.**
  The scene was rebuilt from git history and put on a real screen (branch `journey-world-scene`,
  not merged). Outcome: the mechanism is cheap and it works, so this is **not** the expensive fork
  it looked like — it needs no new dependency and no per-artifact art. What it does need is an art
  direction, and that is exactly what this pillar has to decide. See
  `docs/journey-visual-style.md` for the three blockers in detail. The short version:
  - The valley painting and the Explore map are two unrelated illustration styles, and the flat UI
    is a third. **The redesign has to pick one house style and apply it to both maps** — this is
    now a concrete brief item, not an abstract preference.
  - The path never reads as filling up, so progress is not legible (fixable in code, art-independent).
  - Artifacts render as white UI pills on the painting rather than objects in it.
  - When revived it goes on **Progress**, not Journey (Standa's call) — the scene shows history,
    and Journey is the catalog.
- **Does the current "calm, no gamification" positioning stay locked**, or is that itself open for
  reconsideration as part of this redesign pass? (My assumption, given everything decided this
  session, is that it stays — but worth confirming explicitly before briefing anyone external.)
- **Sourcing** — do you want to find/vet the freelancer or subscription service yourself, or do you
  want a drafted brief + shortlist to review once the path is picked?
- **Reference points** — any existing apps whose visual feel you'd point a designer at (even
  loosely, "more like X, less like Y")?

### What happens next

Once budget/timeline/direction are decided, I can draft a design brief (positioning, constraints
from `AGENTS.md`, the value-prop/story content, the fork decision above, and what "done" looks like
for a first pass) that's ready to hand to whoever does the actual design work — freelancer,
subscription service, or your own AI-tool exploration.

---

## Pillar 3 — Content (Standa's, deliberately last)

You said you want to write this yourself and do it last — this section is the framework and
decision list, not a content draft.

### Current state (audited from the repo)

- **19 quests total** (10 weekly, 5 monthly, 4 yearly) across the 4 categories — roughly 5 per
  category. Round-1 tester M's exact remark was "content quantity is extremely important" —
  this thin a catalog is a direct, confirmed match to that complaint, not a vague concern.
- `docs/quest-content-guidelines.md` has exactly **one** rule (no abstention/negation quests). Its
  own "More rules" section is an explicit stub: "_(Add as they are decided — e.g. quest
  length/time framing, difficulty calibration, concreteness, category fit.)_" Nothing past rule #1
  has actually been decided yet.
- ~~A live, known violation of rule #1 is still shipping: `q-m-04`, "Digital sunset: no screens
  after 9 p.m. for three nights."~~ **Resolved 2026-08-21** — Standa's call was to delete rather
  than reframe it. Removed from `quests.ts`, `questJourneys.ts`, `quest-journeys-data.cjs`, and
  `seed.sql`; live Supabase row still needs the one-off deactivation query (handed to Standa
  directly, since this repo has no DB access/migration runner set up).
- `scripts/quest-journeys-data.cjs` (used to generate `seed.sql`'s quest rows) is a **stale mirror**
  of the real source of truth (`src/constants/questJourneys.ts`) — missing the `interaction` field
  for every one of the 60 existing steps. Not user-facing today (a runtime fallback compensates),
  but whatever process ends up authoring new quests needs to update the real source
  (`questJourneys.ts`), not just this generator script, or the two will drift further apart.
- `docs/value-proposition.md` and `docs/story.md` already have real voice and content, each with
  one clearly marked, Standa-owned placeholder: the "green notes" research citations, and the
  Morocco surfing-trip breaking-point scene. Both already tracked in `tasks.md` (#3, #4).
- There's no written process for *how* a new quest actually gets authored — what fields are
  required, how to pick an interaction type (confirm / timer / input / counter / photo), how
  `tip` differs from `detail`, how `estimateMinutes` gets chosen. It's implicit in the TypeScript
  shape today, which works for me reading code, but not for a plain content-writing pass.

### The decisions this pillar actually needs (this is the "what needs deciding" you asked for)

1. **Volume target.** How many quests, distributed how across 4 categories × 3 timeframes? Testers
   found 20 thin, but there's no stated target to write toward — even a rough number (50? 80? more?)
   gives the writing work a finish line.
2. **Authoring process.** Do you write quests directly in the existing data shape, or write them in
   plain language (a doc, a spreadsheet) and hand them to me to convert into code? Either works —
   worth picking one so it's not re-decided every session.
3. **Difficulty/intensity calibration.** Quests need to map cleanly to Gentle/Balanced/Bold (built
   this session) within each category, but there's no written rule for what makes one quest "Bold"
   and another "Gentle" — right now it's a per-quest judgment call with no documented standard.
4. ~~The `q-m-04` fix.~~ **Done 2026-08-21** — deleted rather than reframed.
5. **A tone/voice guide.** `story.md`/`value-proposition.md` establish a real voice (warm, direct,
   a little wry — "Order two dishes you have never tried from that tradition" is the existing house
   style), but it's not written down as something a second writer, or future-me, could follow
   consistently without you re-explaining it each time.
6. **Category-balance philosophy.** Loosely tied to the still-open "merge Nature + Adventure?"
   question (parked pending real usage data, per the mentor's 2026-08-06 call) — worth deciding
   whether new-quest volume should wait on that, or proceed independently since writing more quests
   doesn't actually block that structural question either way.
7. **The two doc placeholders** — the green-notes citations and the Morocco scene are explicitly
   yours to write, but I can help structure the citation research (point at real nature/screen-time
   literature to review) even though the selection and the actual writing stay yours.

### What's needed from you specifically

- The quest content itself (your call, by design)
- The two `docs/` placeholders
- Answers to the 7 framework questions above — doesn't need to be all at once, even picking a
  volume target and an authoring process is enough to start

### Suggested sequence

This pillar doesn't block Pillar 1 or 2, so there's no forced ordering — but since you're saving
the bulk writing for last anyway, my suggestion: settle the 7 framework decisions and knock out the
`q-m-04` fix now (cheap, fast, already flagged twice), then do the actual volume of writing once
Pillar 2's voice/visual direction is at least roughly settled, so new quests match the eventual
brand rather than needing a pass to re-match it later.

---

## Found in passing (not part of any pillar, cheap to fix)

`AGENTS.md`'s "Where things live" table still references `lib/questData.ts` and `stores/quests.ts`
as the real quest-loading/state locations — both were confirmed dead and deleted in today's cleanup
pass (superseded by `src/features/quests/questStore.ts` a while ago). Worth a quick correction pass
since `AGENTS.md` is the doc future AI sessions are told to read first — not urgent, not blocking
any pillar, just noted so it doesn't get lost.
