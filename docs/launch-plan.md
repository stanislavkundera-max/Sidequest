# Launch plan — 3 pillars

**For Pillar 1, this doc is now the strategy layer only.** The ordered path with its gates and
dependencies lives in `docs/play-store-roadmap.md`, and the exact form answers live in
`docs/play-store-handoff.md`. Read this for *why* store work is sequenced against redesign and
content; read the roadmap for what to do next.

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

> ⚠️ **This table is from 2026-08-29 and much of it is now wrong** — `eas init` has run, the Play
> Console account exists, four production builds have shipped, the legal pages are deployed, and the
> typography landed on 2026-09-06. It has been left rather than patched because
> `docs/play-store-roadmap.md` is the live status for Pillar 1 and is kept current; two competing
> status tables is worse than one stale one that says so. **Read the roadmap, not this.**

| Item | Status |
|---|---|
| iOS bundle ID / Android package | ✅ Already set: `com.sidequestlife.app` (`app.config.ts`) |
| EAS Build/Submit config (`eas.json`) | ✅ Exists (`241f940`), hardened 2026-08-29: production builds an AAB, `appVersionSource: remote`, `NODE_ENV=production` on both preview and production, and three named submit profiles (internal / closed / production) so the Play track is chosen deliberately |
| EAS project link (`projectId`) | ❌ `eas init` has never run — blocked on an Expo login |
| First production build | ❌ Never attempted. The one real technical unknown left |
| Apple Developer Program enrollment | ⏸️ Deferred — this round is Android-only, so the $99 and the iPad screenshot size are both out of scope for now |
| Google Play Console account | ❌ Not created as of 2026-08-29. **Critical path** — identity verification runs for days |
| App icon / splash / adaptive icon | ✅ Real icon shipped (`241f940`), no longer the Expo default |
| Custom typography | ❌ None — default system font; `SpaceMono` is loaded but effectively unused (Expo template leftover) |
| Privacy policy | ⚠️ Written (`app/legal/privacy.tsx`, `b4521af`), placeholders filled 2026-08-29 — not yet deployed to a public URL |
| Terms of service | ✅ Written (`app/legal/terms.tsx`, `b4521af`), governing law filled 2026-08-29 |
| Account deletion (in-app) | ✅ Real deletion shipped (`b4521af`): `deleteOwnAccount()` → `delete_own_account()` in Postgres. Distinct from "Delete all progress," which only wipes data |
| Account deletion (public web page) | ⚠️ Written 2026-08-29 (`app/legal/delete-account.tsx`), placeholder filled — still needs a deploy |
| Password reset | ✅ Built and verified 2026-08-29 (`app/(auth)/forgot-password.tsx`). Needs one Supabase email-template edit to go live — see `docs/play-store-handoff.md` |
| Permission usage strings | ✅ Already present and reasonable: calendar (`expo-calendar`) and photos (`expo-image-picker`) both have justification text in `app.config.ts` |
| Third-party tracking / ad SDKs | ✅ None. Analytics is first-party only (`src/lib/analytics`, writes to your own Supabase `analytics_events` table). No IDFA, no ad network, no Firebase/Mixpanel/Amplitude. **This meaningfully simplifies both stores' privacy paperwork.** |
| Sign-in methods | Email/password + Supabase anonymous auth only. No Google/Facebook/Apple social login. |
| Reviewer/demo access | ❌ No demo account prepared — the app requires sign-in, so Apple/Google reviewers will need one |
| iPad support | `ios.supportsTablet: true` is set — this **pulls in an extra required screenshot size** (see below) for arguably no current benefit, since nothing in the app is iPad-tailored |

~~**Found in passing, worth a security/hygiene check before any release build:**~~ **Resolved
2026-08-29.** `app.config.ts` now strips `devLoginEmail`/`devLoginPassword` from `extra` whenever
`NODE_ENV === 'production'`, and `eas.json`'s production profile pins `NODE_ENV=production` so the
strip is not left to chance. Verified by experiment rather than by reading: with both env vars
deliberately set to canary values, `expo config --type public` emits them under a development
`NODE_ENV` and omits them entirely under production.

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
- **⚠️ The potential bottleneck, and the one thing to confirm early:** Google may require a **closed
  test with at least 12 opted-in testers, active for 14 continuous days** before you can request
  production access. "Opted in" means they accepted the invite *and* installed the build under a
  matching Google account — adding 12 emails doesn't count, and dropping below 12 active testers
  resets the clock. Round 1 had 6 people, half of what that would need.
  **Whether it applies to your account is not settled** (updated 2026-08-29). It has historically
  hit *personal* accounts created after Nov 13, 2023 and not organization accounts, Google has
  changed both the rule and its rollout more than once, and it varies by region — it's entirely
  possible you're never asked for it. Confirm it from your own Play Console rather than from this
  doc; see `docs/play-store-handoff.md` §9.
  Plan for both, since the cost is lopsided: if it applies it's the longest pole in the launch and
  the 14 days run regardless of what else is happening, so start it the moment there's an
  installable build. If it doesn't, lining up testers costs nothing — a real closed test before
  release is worth running anyway.

**Both stores / cross-cutting**
- **GDPR applies** — you're EU-based and will have EU users, so the privacy policy needs actual
  GDPR content (consent, data minimization, the right to access/delete), not a generic US-style
  template. The lack of third-party trackers again makes this simpler than a typical app.
- **EAS Build + EAS Submit** is the standard modern path for an Expo app like this one: builds the
  native binary in Expo's cloud (handles code signing for you), then uploads directly to App Store
  Connect / Play Console. Needs an `eas.json` and an Expo account linked to the project — neither
  exists yet.

### Remaining gaps, reordered 2026-08-29 by what actually blocks what

Most of the original list is closed. What is left sorts cleanly into "waiting on Google," "waiting on
Standa," and "waiting on the redesign" — and those three run in parallel, which is the whole point.

**Calendar-bound (start these first, they run while everything else happens)**

1. **Play Console account** ($25) — not created. Identity verification takes days and blocks the rest.
2. **Confirm whether the closed-test requirement applies**, then, if it does, 12+ testers active for
   14 continuous days. Round 1 had 6 people. Potentially the longest pole in the launch, but not a
   given — see the note above and `docs/play-store-handoff.md` §9.

**Blocked on Standa, cheap once started**

3. Expo account + `eas login`, so `eas init` can link the project.
4. Supabase: add `{{ .Token }}` to the reset-password email template, or password reset silently
   does nothing. Details in `docs/play-store-handoff.md` §2.
5. ~~The three legal placeholders~~ — filled 2026-08-29 and consolidated into `constants/legal.ts`:
   privacy@sidequestlife.com, Stanislav Kundera as controller under Czech law, hosting confirmed as
   AWS eu-central-1. Still owed: making that address a mailbox that actually receives mail.
6. Deploy the web export so `/legal/privacy` and `/legal/delete-account` become public URLs.
7. A demo/reviewer account with credentials — the app requires sign-in.

**Blocked on nothing but the console existing**

8. Data safety form and the IARC content rating. Both have their answers pre-derived from the code
   in `docs/play-store-handoff.md` §5–6; they are click-through, not research.

**Blocked on Pillar 2, and deliberately not urgent**

9. Phone screenshots and the 1024×500 feature graphic. Both are swappable in the listing **without a
   new app review**, so they belong inside the closed-test window, not ahead of it.

**Closed since this doc was written**

- ~~Real app icon~~ (`241f940`) · ~~privacy policy~~ / ~~terms~~ / ~~in-app account deletion~~ (`b4521af`)
  · ~~`eas.json`~~ (`241f940`, hardened 2026-08-29) · ~~store listing copy~~ (`docs/store-listing-copy.md`)
  · ~~public account-deletion page~~ · ~~dev-login build hygiene~~ (both 2026-08-29)
- ~~Confirm the Android target API level clears the Aug 31, 2026 bar~~ — Expo SDK 54 targets API 36
  by default. Still worth reading back from the first real build output rather than trusting it.
- Apple's items (nutrition label, $99 enrollment, iPad screenshots) are **deferred, not done** —
  this round is Android-only.

### Decisions only Standa can make

- ~~**Android-first, or both stores at once?**~~ **Decided 2026-08-29: Play Store only for this
  round.** Skips the $99 Apple fee, the iPad screenshot size, and a second review queue. iOS can
  follow whenever, and `supportsTablet` stops mattering until it does.
  Reopened and re-parked 2026-09-05 — the iOS question was researched properly and written up in
  `docs/app-store-option.md`. Short version: there is nothing to port (managed Expo, one day of
  config), TestFlight has no equivalent of the 12-tester/14-day rule, and the recommendation is
  *both* rather than *instead* — Play as the release target, TestFlight as the testing channel,
  since most of the round-1 testers are on iPhones. Not acted on.
- **Individual or Organization** for the Google account? Depends on whether there's a registered
  company (IČO) you want as the public seller name, or whether shipping under your own name is fine.
  The same answer settles the governing-law placeholder in `app/legal/terms.tsx`.
- **Payment method** for the $25 — trivial amount, but personal card vs. a business account is worth
  deciding once rather than defaulting by accident.
- **Who are the 12+ Play Store closed testers?** The round-1 group covers half. If the requirement
  applies, this is the single biggest timeline lever in the launch and the one thing no amount of
  engineering shortens — and it's worth having the names ready before you know, since the answer
  only arrives once the account is verified.
- **When to start the Play Store testing clock** — my recommendation is unchanged: as soon as
  there's *any* build worth putting in front of 12 people, well before the redesign or the content
  work is finished. If the rule applies, the 14 days run in parallel with everything else. If it
  doesn't, a real closed test before release is worth running on its own merits.

### What happens next

The build list from the original version of this section is done — account deletion (in-app and the
public web page), privacy policy, terms, `eas.json`, and password recovery all exist and are
verified. What is left on my side is `eas init` and the first production build, both waiting on an
Expo login.

Everything still needing *you* — with the exact answers to give, derived from the code rather than
from a template — is collected in **`docs/play-store-handoff.md`**: the Supabase email-template edit,
the three legal placeholders, the Data safety table, the IARC answers, and the reviewer account.

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

- ~~**19 quests total** (10 weekly, 5 monthly, 4 yearly)~~ **41 as of 2026-09-05** — ten in each
  category, eleven in Relax, split five weekly / three monthly / two yearly. Round-1 tester M's
  exact remark was "content quantity is extremely important", and at nineteen this was a direct,
  confirmed match to that complaint. The Journey tab now shows five per category at a time, so the
  catalogue is deep enough that finishing one pulls a fresh one up rather than emptying the shelf.
- ~~`docs/quest-content-guidelines.md` has exactly **one** rule~~ **Four as of 2026-09-05**: no
  abstention quests, no quest without a journey, write to both catalogue sources, and Adventure
  means risk rather than novelty. The "More rules" stub is still there for the rest.
- ~~A live, known violation of rule #1 is still shipping: `q-m-04`, "Digital sunset: no screens
  after 9 p.m. for three nights."~~ **Resolved 2026-08-21** — Standa's call was to delete rather
  than reframe it. Removed from the catalogue — but the live Supabase row was **not**, and the
  one-off deactivation query handed over that day was never run: it was still being served on
  2026-09-06, found by counting the live table against the source. Fixed properly rather than by
  hand — `quests_catalogue.sql` now deactivates anything whose id is not in the catalogue, so a
  deleted quest cannot outlive its deletion again.
- ~~`docs/value-proposition.md` and `docs/story.md` each have one Standa-owned placeholder~~ — both
  closed. The green-notes citations were researched 2026-08-21 (six checked studies, each marked
  correlational or experimental); the Morocco breaking-point scene was written up 2026-09-06 from
  Standa's own account, in three lengths so its prominence can be chosen by reading rather than in
  the abstract.

### The decisions this pillar actually needs (this is the "what needs deciding" you asked for)

1. ~~**Volume target.**~~ **Answered by measurement, 2026-09-06 — and the answer is "not yet".**
   Simulated against the real catalogue and the real completion horizons, at one quest a week:

   | Who | Runs out of new quests after |
   |---|---|
   | Sticks to one category | **~10 weeks** (2.3 months) |
   | Spreads across all four | **~41 weeks** (9.5 months) |

   So 41 quests is far more than a 14-day closed test needs, and the binding case is the
   single-category user at about ten weeks. Doubling to ~26 per category would buy six months for
   that user — a large writing job for a problem nobody has reported, on an app with no users.

   **Target: ~15 per category (60 total), written after the closed test, not before.** The test will
   say whether anyone actually sticks to one category, which is the assumption the whole number
   rests on. Writing to a guessed finish line now is how you end up with sixty quests and no idea
   which kind people wanted.
2. ~~**Authoring process.**~~ **Settled by doing it, 2026-09-06.** Quests are written straight into
   `src/constants/quests.ts` + `questJourneys.ts`, then `scripts/export-quests-sql.cjs` generates
   the SQL and Standa runs it. Rules 2 and 3 in `docs/quest-content-guidelines.md` are the process.
   The competing older generator was deleted rather than kept in sync — it held 19 quests and no
   `interaction` fields, and running it would have overwritten good rows.
3. ~~**Difficulty/intensity calibration.**~~ **Written down 2026-09-06 as rule 5** — and it was read
   off the catalogue rather than invented, because the existing quests already agreed with each
   other. Difficulty measures resistance, not duration: a one-hour "reconnect with someone you lost
   touch with" is hard, a sixteen-hour "day with no work or chores" is medium. This matters beyond
   tidiness — the onboarding intensity answer filters on `difficulty`, so a quest tagged by its
   clock lands in front of the wrong person.
4. ~~The `q-m-04` fix.~~ **Done 2026-08-21** — deleted rather than reframed.
5. ~~**A tone/voice guide.**~~ **Written 2026-09-06 as rule 6**, and derived from the catalogue
   rather than described in adjectives, which is what makes it followable. The rule in one line:
   *name the thing, not the feeling*. Quests say what you will be doing and never how it will make
   you feel — "Moving water, trees around it, no car park", never "reconnect with nature and feel
   refreshed". Promising the feeling does the experience's job for it, and is the difference
   between this and every wellness app.
6. **Category-balance philosophy.** Loosely tied to the still-open "merge Nature + Adventure?"
   question (parked pending real usage data, per the mentor's 2026-08-06 call) — worth deciding
   whether new-quest volume should wait on that, or proceed independently since writing more quests
   doesn't actually block that structural question either way.
7. ~~**The two doc placeholders**~~ — both closed. Citations 2026-08-21, Morocco scene 2026-09-06.
   The scene came from Standa's own account and was shaped rather than invented; the one open
   question it leaves is a product decision, not a writing one — whether the welcome screen should
   carry the personal line instead of the current "Turn ordinary days into small adventures."

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
