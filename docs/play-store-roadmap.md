# Play Store roadmap

The ordered path from "no developer account" to "live on Google Play", built from Google's own
Play Console documentation (supplied 2026-08-29) and checked against this repo.

**Three docs, three jobs — this one is the sequence:**

| Doc | Answers |
|---|---|
| `docs/launch-plan.md` | *Why* — the 3-pillar strategy, and how store work relates to redesign and content |
| **`docs/play-store-roadmap.md`** (this) | ***When and in what order*** — phases, gates, dependencies, who does what |
| `docs/play-store-handoff.md` | *What to type* — the exact Data safety answers, IARC answers, template text |

---

## The critical path, in one line

**D-U-N-S number → Play Console Organization account → entity verification (days, Google's clock) →
create app → first AAB → production review (days to weeks).**

Going the OSVČ / Organization route likely removes the 14-day closed-test gate that used to sit in
the middle of this — see 0.5. Confirm that before relying on it.

Everything else runs in parallel with those waits, which is why the D-U-N-S request is worth starting
before anything else on this page.

---

## ⚠️ Four decisions that cannot be undone

Most of this roadmap is revisable. These four are not, so they are collected here rather than buried
in a phase.

| Decision | Why it is permanent | Status |
|---|---|---|
| **Package name** `com.sidequestlife.app` | Package names "are unique and permanent… can't be deleted or re-used in the future," and the testing docs are sharper still: *"Once you upload an artifact, the package name for that app is fixed and cannot be changed."* That means the **first upload to any track, internal tests included** — not the production release. A different package is a different app: new listing, zero installs, no migration. | ⚠️ **Settle the brand name before task 2.2.** See `BRANDING.md` §1 |
| **Free or paid** | Steps 3 and 4 of Google's create-app flow both say "You can change this later." Step 5, free-or-paid, conspicuously does not. The known rule is that a paid app can become free but a free app cannot become paid. | ✅ **Free.** Costs nothing — see below |
| **App signing key** | If you manage the key yourself and lose it, you can never update the app again. Your *upload* key can be reset by Google; the *app signing* key cannot. | ✅ Plan: let Google generate it (Play App Signing default) |
| **Default language** | Set at app creation. Changing the default later is not part of the normal flow. | Decide: English, given the repo and store copy are English |

### "Free" does not mean "cannot earn"

Worth stating plainly, because the free/paid flag reads scarier than it is: it sets **the price to
download**, nothing else. In-app purchases and subscriptions are a separate mechanism and work
normally inside a free app — Strava, Duolingo and Spotify are all "free" apps with paid tiers. That
is the standard model, not an exception.

So **choose Free and nothing is foreclosed.** The irreversible half is only free → paid *as a
download price*, which is not a model this app would ever want. A premium tier can be added whenever.

Two notes for later, neither blocking now:

- There is **no monetization code in the app today**. Adding subscriptions is its own project — Play
  Billing, entitlement checks against Supabase, purchase restoration — not a switch to flip.
- **Donations are a genuinely different question and the policy is not simple.** The reliable part:
  the moment a "donation" unlocks anything — a feature, content, a badge — it stops being a donation
  and becomes a purchase, which must go through Google Play Billing. A pure donation that unlocks
  nothing has an exception, but the conditions depend on registered-nonprofit status and on region.
  **Do not plan around donations without reading Play's Payments policy first** — flagged in "Still
  worth looking up".

---

## Phase 0 — Startable today, blocked on nothing

These run while Google verifies the account. None of them depends on another.

| # | Task | Owner | Status |
|---|---|---|---|
| 0.1 | **Request a D-U-N-S number** for the OSVČ | Standa | ❌ Free, but days to weeks — **now the critical path** |
| 0.1b | **Create the Play Console account** ($25) as **Organization**, start entity verification | Standa | ❌ Needs 0.1 |
| 0.2 | Expo account + `npx eas-cli login` | Standa | ❌ Blocks 2.1 |
| 0.3 | Register the domain for `privacy@sidequestlife.com` and make it receive mail | Standa | ❌ Blocks 1.3 and 3.4 |
| 0.4 | Supabase → Authentication → Emails: add `{{ .Token }}` to the reset-password template | Standa | ❌ Password reset is inert without it — handoff §2 |
| 0.5 | Confirm the Organization account is exempt from the testing requirement | Standa | 🟡 Likely exempt — verify. Keep a tester list ready regardless |
| 0.6 | Merge `play-store-prep` and `play-store-roadmap` into `main` | Standa | ❌ The analytics fix must ship before testers install anything |
| 0.7 | Brand name confirmed or changed | Standa | 🟡 See the permanence table above |
| 0.8 | Business name + IČO, so `constants/legal.ts` can name the real data controller | Standa | ❌ Blocks the legal pages being final |

### About 0.5 — an Organization account probably removes this requirement entirely

**Direction changed 2026-08-29 (second call): Standa is targeting an Organization account as an
OSVČ**, superseding the earlier "private individual" decision.

That matters more than it looks. Google's rule, in the text supplied: *"Developers with **personal
accounts** created after November 13, 2023, must meet specific testing requirements before they can
make their app available on Google Play."* Personal accounts. An Organization account is not subject
to it.

So the OSVČ route likely **deletes the 12-testers-for-14-days gate** — the one item on the critical
path that no amount of work could shorten. Verify it against the requirements page before relying on
it (see "Still worth looking up"), because it is a large enough win to be worth confirming rather
than assuming.

**It trades one wait for another, and the trade looks good:**

| | Personal account | Organization account (OSVČ) |
|---|---|---|
| Testing gate | 12 testers active 14 continuous days | Exempt |
| Extra paperwork | None | D-U-N-S number, entity verification (name, address, registration documents) |
| Who controls the wait | Twelve other people | You |
| Public seller name | Stanislav Kundera | The business |

A D-U-N-S number is free but can take days to weeks to issue. Twelve testers staying active for
fourteen continuous days depends on twelve other people accepting an invitation *and* installing the
build under a matching Google account — and dropping below twelve at any point restarts the clock.
Self-controlled waiting beats other-people-controlled waiting.

**If the requirement does still apply**, "opted in" means accepted *and* installed; adding twelve
email addresses does nothing on its own. Keep the tester list ready either way — a real closed test
before release is worth running on its own merits.

**Repo impact of going Organization:** the data controller in `constants/legal.ts` stops being
"Stanislav Kundera, a private individual" and becomes the OSVČ with its IČO. That flows into the
privacy policy and the terms. One edit in one file, once the business name and IČO are known.

---

## Phase 1 — Account verified, app record created

Gate: **Play Console verification complete.**

| # | Task | Owner | Notes |
|---|---|---|---|
| 1.1 | Home → **Create app**: default language, app name, "App" (not game), free/paid, contact email | Standa | Contact email is public — use the same address as `constants/legal.ts` |
| 1.2 | Accept the three declarations: Developer Program Policies, US export laws, **Play App Signing ToS** | Standa | The App Signing acceptance is what enables the AAB flow |
| 1.3 | App content → **Privacy policy URL** | Standa | Needs 2.4 deployed first |
| 1.4 | Work through the app dashboard's guided setup | Standa | It drives the order; the answers are in handoff §5–6 |

### Expect these App content forms

The dashboard walks you through them; none is hard, but each is a separate submission and an
inaccurate answer is a rejection risk. Answers for the two substantial ones are pre-derived in
`docs/play-store-handoff.md`:

- **Data safety** — handoff §5 has the full table, derived from the code
- **Content rating (IARC)** — handoff §6, expect Everyone / PEGI 3
- **App access** — reviewer credentials, since the app requires sign-in (handoff §7)
- **Ads** — no ads, no ad SDKs; declare none
- **Target audience and content** — not directed at children; the privacy policy already says under-16 is not a target
- Also expect short declarations for: news app (no), government app (no), financial features (none), health apps (none)

---

## Phase 2 — First build

Gate: **0.2 done (Expo login).** Can run in parallel with Phase 1.

| # | Task | Owner | Notes |
|---|---|---|---|
| 2.1 | `eas init` — links the project, writes `projectId` into `app.config.ts` | Claude | `eas.json` is already configured |
| 2.2 | First production build: `eas build --platform android --profile production` | Claude | Produces an AAB. **The one real technical unknown left** |
| 2.3 | Read the build output and confirm `targetSdkVersion` is 36 | Claude | Expected to pass — see the API level note below |
| 2.4 | Deploy the web export so `/legal/privacy` and `/legal/delete-account` are public | Standa | `vercel.json` is ready; needs the domain from 0.3 |
| 2.5 | Create the reviewer demo account and walk it through onboarding once | Claude + Standa | Not the dev-login credentials — those are stripped from production builds |

### Target API level — you are already compliant

From Google's requirements: **from 31 August 2026, new apps must target Android 16 (API 36).** Your
first submission lands after that date, so this applies to you rather than being a future problem.

Verified in the installed code rather than assumed:
`node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle:69` defaults
`targetSdkVersion` to **36** (with `compileSdkVersion` 36 and `minSdkVersion` 24). Expo SDK 54 meets
the requirement with no configuration change. Confirm it in the first real build output anyway —
that is task 2.3, and it costs nothing.

### Version codes

Google's limits: `versionCode` must increase with every upload, can never be reused, and must stay
below **2,100,000,000**. This is already handled — `eas.json` sets `appVersionSource: "remote"` with
`autoIncrement: true` on the production profile, so EAS owns the counter and the repo does not.
Nothing to do, and nothing to hand-edit.

---

## Phase 3 — Testing

Gate: **an AAB exists and Phase 1 forms are submitted.**

| # | Task | Owner | Notes |
|---|---|---|---|
| 3.0 | **Internal test first** — `eas submit --profile internal` | Claude | Up to 100 testers, and it can run *before app setup is complete*. Cheapest way to prove the whole pipeline works |
| 3.1 | Upload the AAB to **closed testing** — `eas submit --profile closed` (Play track `alpha`) | Claude | **Not `internal`.** Internal testing does not count toward the 14 days |
| 3.2 | Set up a **Google Group** for testers rather than an email list | Standa | See below — far less admin |
| 3.3 | Provide the required **feedback URL or email** on the opt-in page | Standa | Mandatory field; testers cannot leave public reviews |
| 3.4 | Invite testers; confirm each opted in **and** installed | Standa | The clock starts when 12 are actually active |
| 3.5 | Hold 12+ active for 14 continuous days | — | Calendar time. Nothing shortens it |
| 3.6 | Meanwhile: screenshots, feature graphic, 512×512 icon | Standa (design) | Swappable later without a new review — see below |
| 3.7 | Meanwhile: quest content | Standa | Server-side, no build needed — see below |

### Run an internal test before anything else

Worth doing even though it counts for nothing toward the requirement, because of what it costs:
nothing. From Google's testing docs, an internal test can be created **before the app is fully
configured**, takes up to 100 testers, is exempt from the Data safety section, and "might not be
subject to standard Play policy or security reviews."

So it answers "does our AAB actually install and run from Play?" days before the paperwork is
finished.

**Build with the `production` profile even for this.** Every Play track needs an Android App Bundle,
and `eas.json`'s `preview` profile deliberately produces an APK for sideloading — useful for handing
a build to someone directly, useless for uploading to Play. The `internal` name in
`eas submit --profile internal` refers to the Play *track*, not to the build profile.

Two things to know before doing it: it still **fixes the package name permanently** (see the top of
this page), and until the app's first review testers see a temporary name rather than the real one.

### Mechanics that bite, from Google's own testing docs

- **The opt-in link only appears once the app status is 'Published'.** Draft or 'Pending
  publication' shows no link at all. Several people read this as a broken console.
- **First publication takes several hours to reach testers**, and later changes take hours too. Not
  minutes. Don't schedule the tester invitations for the same hour as the upload.
- **Use a Google Group, not an email list.** Both are supported; the group can be set to "anyone can
  join" and shared as a single opt-in link, which removes the email-collecting, the privacy
  question, and the constant re-adding. With a group, testers must join the group *before* opting
  in — worth saying in the invitation. Limits either way are generous: up to 200 lists, 2,000 users
  per list, 50 lists per track.
- **A feedback URL or email is required** and shown on the opt-in page. Testers cannot leave public
  Play reviews for test builds. Use the same address as `constants/legal.ts`.
- **Test feedback does not affect the public rating.** A rough first impression costs nothing
  publicly.
- **Testers need a Google account and an Android device.** The realistic constraint for round 2 is
  Android ownership, not willingness.
- Pricing and country availability apply **across all tracks at once** — there is no per-track
  pricing.
- Ending a test is "Pause track". Testers keep the installed app but stop receiving updates.

### Contingency: if the Organization exemption does not hold

Only relevant if 0.5 comes back saying the requirement applies anyway. Practitioner advice, sourced
from a developer write-up (2026-08-29) rather than from Google, and labelled as such because the
author is promoting his own tool in the same piece:

- **Recruit 20–30, not 12.** People drop off, uninstall, or never open it again, and falling below
  twelve restarts the fourteen days. A buffer is the whole trick.
- **Ship small updates during the window.** Claimed to help; costs little either way.
- **Take the production access form seriously.** Reported as where people fail *after* completing
  the testing — it asks about the app's purpose, its target users, and policy compliance. This one
  is worth believing: it matches how Google reviews everything else, and
  `docs/value-proposition.md` and `docs/story.md` already contain good raw material for it.

**On mutual-testing communities** — platforms where developers install each other's apps to clear
the requirement. Judgement rather than fact: real humans genuinely installing an app is not against
the rules, and it is clearly better than the paid services that use bots and get accounts rejected.
But a reciprocal ring where nobody actually uses the app is closer to those bots in spirit than in
letter, and Google is looking at whether testing was real. If it comes to that, prefer people who
would plausibly *use* a side-quest app over people farming installs — the feedback is worth
something, and round 1 already showed that real testers surface real problems.

Round 1 had 6 people, so this would need roughly quadrupling the group with Android users. That is
the strongest practical argument for the Organization route.

### Internal app sharing — a faster side channel, not a substitute

Useful for getting a build to someone in minutes without a track release. Worth knowing the limits
before relying on it:

- Links **expire 60 days** after upload, and a maximum of **100 users** can download per link
- Version codes do not need to be unique or new, and builds can be signed with any key
- These uploads never appear in the bundle explorer and **cannot be promoted** to a testing or
  production track
- Testers must switch it on first: Play Store → Settings → tap the Play Store version **seven
  times** → enable Internal app sharing. Expect to write this instruction out for them

It does **not** count toward the closed-testing requirement. Use it for quick round-2 feedback, use
the closed track for the clock.

### What can safely keep moving during the 14 days

This is the whole reason to start the clock early:

- **Quest content** is server-driven. `fetchQuestCatalog()` in
  `src/repositories/questsRepository.ts:147` reads the catalog from Supabase, and a row with
  populated `action_steps` renders without a new build — `enrichQuestWithJourney` only falls back to
  the bundled TypeScript when those steps are empty. Content improves live, with no upload and no
  review.
- **Store listing assets** — screenshots, feature graphic, descriptions — can be replaced in the
  listing at any time without a new app review.
- **Design changes** need a new build, but new builds can be uploaded to the closed track freely.
  The 14 days count *testers*, not builds.

---

## Phase 4 — Production

Gate: **testing requirement satisfied (or confirmed not to apply).**

| # | Task | Owner |
|---|---|---|
| 4.1 | Request production access | Standa |
| 4.2 | Create the production release and upload the AAB — `eas submit --profile production` | Claude |
| 4.3 | Submit for review | Standa |
| 4.4 | Wait | — |

Google's guidance for new accounts: review takes **several days to a few weeks**. Plan for the
longer end.

---

## What does not apply to Side Quest Life

Pruned from Google's documentation so it is not re-read every time. Each of these is real, and none
of it is your problem:

| Topic | Why not |
|---|---|
| **Registering SHA fingerprints with API providers** | Verified: no Google Maps, no OAuth, no Firebase, no social login, no `google-services.json`, no dependency that would need it. Supabase authenticates with an anon key over HTTPS. **This becomes required the day Google sign-in is added.** |
| **App Links / `assetlinks.json`** | No deep linking exists — the same finding that shaped the password-reset design |
| **Play Feature Delivery / Play Asset Delivery** | Only needed above 200 MB |
| **Wear OS, Android TV, Automotive, XR** | Phone only. Their separate API-level deadlines are irrelevant |
| **Signed universal APK** | Only needed to distribute outside Play |
| **Migrating an existing app's signing key** | This is a new app; Google generates the key |
| **Quantum-ready hybrid signing** | Opt-in, Android 17+, and incompatible with v4 signing. No reason to take it on for a first release |

---

## Still worth looking up

Offered, and genuinely useful — these are the gaps this roadmap could not close from the material at
hand:

1. **The closed-testing requirements page** (`support.google.com/…/answer/14151465`) — specifically,
   confirm in writing that it applies to **personal** accounts only and that an Organization account
   is exempt. This is now the highest-value thing to verify: it decides whether fourteen calendar
   days sit on the critical path at all.
2. **Organization account requirements for an OSVČ** — what entity documents Google asks for beyond
   the D-U-N-S number, and the realistic issuing time for a Czech sole trader. This sets the length
   of the new critical path.
3. **Store listing asset specs** — current required screenshot counts and pixel dimensions for
   phones, and whether the feature graphic is mandatory or optional for a phone-only app. The one
   gap none of the supplied material touched.
4. **Play Payments policy, donations section** — whether a pure donation that unlocks nothing can use
   a non-Google payment method for a for-profit OSVČ, and in which regions. The other case is already
   settled: anything a "donation" unlocks makes it a purchase, which must use Play Billing.

---

## Reading the current state

Done and verified: `eas.json` with three named submit tracks, real app icon, in-app account deletion,
privacy policy, terms, the public deletion page, password reset, and the analytics anonymization fix
(script run against production 2026-08-29, both counts 0).

Not started: everything requiring the Play Console account, and the first build.
