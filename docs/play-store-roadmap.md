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

**Play Console account → identity verification (days, Google's clock) → create app → first AAB →
closed test (14 days, if it applies) → production review (days to weeks).**

Everything else runs in parallel with those waits. Nothing else is on the critical path, which is
why the account is worth creating before anything else on this page.

---

## ⚠️ Four decisions that cannot be undone

Most of this roadmap is revisable. These four are not, so they are collected here rather than buried
in a phase.

| Decision | Why it is permanent | Status |
|---|---|---|
| **Package name** `com.sidequestlife.app` | Google's docs: package names "are unique and permanent… can't be deleted or re-used in the future." A different package is a different app: new listing, zero installs, no migration path. | ⚠️ **Settle the brand name before the first upload.** See `BRANDING.md` §1 |
| **Free or paid** | Steps 3 and 4 of Google's create-app flow both say "You can change this later." Step 5, free-or-paid, conspicuously does not. The well-known rule is that a paid app can become free but a free app cannot become paid. | ⚠️ **Confirm in Play Console before submitting.** Working assumption: free |
| **App signing key** | If you manage the key yourself and lose it, you can never update the app again. Your *upload* key can be reset by Google; the *app signing* key cannot. | ✅ Plan: let Google generate it (Play App Signing default) |
| **Default language** | Set at app creation. Changing the default later is not part of the normal flow. | Decide: English, given the repo and store copy are English |

---

## Phase 0 — Startable today, blocked on nothing

These run while Google verifies the account. None of them depends on another.

| # | Task | Owner | Status |
|---|---|---|---|
| 0.1 | **Create the Play Console account** ($25) and start identity verification | Standa | ❌ Not started — **critical path** |
| 0.2 | Expo account + `npx eas-cli login` | Standa | ❌ Blocks 2.1 |
| 0.3 | Register the domain for `privacy@sidequestlife.com` and make it receive mail | Standa | ❌ Blocks 1.3 and 3.4 |
| 0.4 | Supabase → Authentication → Emails: add `{{ .Token }}` to the reset-password template | Standa | ❌ Password reset is inert without it — handoff §2 |
| 0.5 | Decide the 12+ closed testers and confirm they have Google accounts | Standa | ❌ Longest pole if the rule applies — see below |
| 0.6 | Merge `play-store-prep` and `play-store-roadmap` into `main` | Standa | ❌ The analytics fix must ship before testers install anything |
| 0.7 | Brand name confirmed or changed | Standa | 🟡 See the permanence table above |

### About 0.5 — the testing requirement almost certainly applies to you

Google's own page, in the text you supplied: *"Developers with personal accounts created after
November 13, 2023, must meet specific testing requirements before they can make their app available
on Google Play."*

You decided on 2026-08-29 to ship as a **private individual**, which means a **personal** developer
account created well after that date. So plan for the requirement applying: **12+ testers opted in
and active for 14 continuous days** before you can request production access. Confirm the exact
wording your console shows once verification completes, but do not plan around it *not* applying.

The alternative is an organization account, which is exempt — but it needs a registered entity and a
D-U-N-S number, which lengthens verification and changes the public seller name and the governing-law
clause in `app/legal/terms.tsx`. That is a real trade-off, not a loophole, and it is your call.

"Opted in" means each tester accepted the invitation **and** installed the build under the matching
Google account. Adding twelve email addresses does nothing on its own, and dropping below twelve
active testers restarts the fourteen days.

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
| 3.1 | Upload the AAB to **closed testing** — `eas submit --profile closed` (Play track `alpha`) | Claude | **Not `internal`.** Internal testing does not count toward the 14 days |
| 3.2 | Invite 12+ testers; confirm each accepted **and** installed | Standa | The clock starts when 12 are actually active |
| 3.3 | Hold 12+ active for 14 continuous days | — | Calendar time. Nothing shortens it |
| 3.4 | Meanwhile: screenshots, feature graphic, 512×512 icon | Standa (design) | Swappable later without a new review — see below |
| 3.5 | Meanwhile: quest content | Standa | Server-side, no build needed — see below |

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

1. **The closed-testing requirements page** (`support.google.com/…/answer/14151465`) — the exact
   current wording on tester count, duration, and how the console reports progress. It is the one
   rule with a calendar cost, and it has changed more than once.
2. **Store listing asset specs** — current required screenshot counts and pixel dimensions for
   phones, and whether the feature graphic is mandatory or optional for a phone-only app.
3. **Free vs paid changeability** — worth one minute of certainty before task 1.1, since it is on the
   permanent list.

---

## Reading the current state

Done and verified: `eas.json` with three named submit tracks, real app icon, in-app account deletion,
privacy policy, terms, the public deletion page, password reset, and the analytics anonymization fix
(script run against production 2026-08-29, both counts 0).

Not started: everything requiring the Play Console account, and the first build.
