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

## Where this actually stands — checked 2026-09-05

A week after the roadmap was written, verified rather than assumed:

| | Status |
|---|---|
| Expo account | ✅ Logged in 2026-09-05 |
| `eas init` | ✅ Done 2026-09-05 — @sidequestlife/side-quest-life |
| Play Console account | ❌ **Not created.** Still the critical path |
| EAS env vars (task 2.0) | ✅ Set for production and preview 2026-09-05 |
| Supabase `{{ .Token }}` template | ✅ Done 2026-09-05 |
| Domain / `privacy@` mailbox | ❌ Not done |
| First production build | ✅ **Succeeded 2026-09-05** — verified from the artifact, see below |
| Code and native readiness | ✅ Done and merged |

Nothing technical moved in that week because everything technical is downstream of two logins.
`docs/app-store-option.md` was researched and parked in the meantime — it does **not** change any of
the above, and specifically does not remove the Play testing requirement.

---

## The critical path, in one line

**Play Console personal account → identity verification (days, Google's clock) → create app →
first AAB → closed test (12 testers, 14 continuous days) → production review (days to weeks).**

Everything else runs in parallel with those waits. Nothing else is on the critical path, which is
why the account is worth creating before anything else on this page — and why the tester group is
worth assembling while verification runs.

---

## ⚠️ Four decisions that cannot be undone

Most of this roadmap is revisable. These four are not, so they are collected here rather than buried
in a phase.

| Decision | Why it is permanent | Status |
|---|---|---|
| **Package name** `com.sidequestlife.app` | Package names "are unique and permanent… can't be deleted or re-used in the future," and the testing docs are sharper still: *"Once you upload an artifact, the package name for that app is fixed and cannot be changed."* That means the **first upload to any track, internal tests included** — not the production release. A different package is a different app: new listing, zero installs, no migration. | ✅ **Confirmed 2026-09-05.** `Side Quest Life` / `com.sidequestlife.app` |
| **Free or paid** | Steps 3 and 4 of Google's create-app flow both say "You can change this later." Step 5, free-or-paid, conspicuously does not. The known rule is that a paid app can become free but a free app cannot become paid. | ✅ **Free.** Costs nothing — see below |
| **App signing key** | If you manage the key yourself and lose it, you can never update the app again. Your *upload* key can be reset by Google; the *app signing* key cannot. | ✅ Plan: let Google generate it (Play App Signing default) |
| **Default language** | Set at app creation. Changing the default later is not part of the normal flow. | Decide: English, given the repo and store copy are English |
| **Developer account type** — Personal or Organization | Unchangeable after creation: switching later means a **new account and migrating the app to it**. | ✅ **Personal**, decided 2026-08-29 — see 0.5 |

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
| 0.1 | **Create the Play Console account** ($25) as **Personal**, start identity verification | Standa | ❌ Not started — **critical path**. Needs a government ID and a card in your own name; prepaid cards are not accepted |
| 0.2 | ~~Expo account + `npx eas-cli login`~~ | Standa | ✅ Done 2026-09-05 |
| 0.3 | Register the domain for `privacy@sidequestlife.com` and make it receive mail | Standa | ❌ Blocks 1.3 and 3.4 |
| 0.4 | ~~Supabase: `{{ .Token }}` in the reset-password template~~ | Standa | ✅ Done 2026-09-05 |
| 0.5 | Line up 12+ testers with Android devices — aim for 20 | Standa | ❌ Applies. The longest pole once the account is verified |
| 0.6 | ~~Merge both branches into `main`~~ | Standa | ✅ Done and pushed 2026-09-05 |
| 0.7 | ~~Brand name confirmed or changed~~ | Standa | ✅ Confirmed `Side Quest Life` 2026-09-05 |

### About 0.5 — why Personal, and why the testing gate is accepted

**Decided 2026-08-29 after two reversals. The deciding fact arrived last: Standa has an IČO now but
intends to dissolve it at the end of the year (~90% likely) and move into employment.**

That settles it, for a reason neither of the sources consulted raised. **An Organization account is
bound to a legal entity.** Google verifies it via D-U-N-S and the entity's status, and re-verifies
periodically. Dissolving the IČO would leave the account resting on an entity that no longer exists
— and there is **no conversion path** to a personal account. The alternative would be building on a
foundation Standa is himself planning to remove.

The timing compounds it: obtaining a D-U-N-S number and passing entity verification would consume a
large part of the four months before the IČO goes away.

So the trade is not "two weeks of testing versus some paperwork". It is **a one-time gate versus a
structurally broken account**, and the one-time gate wins easily.

**What this costs:** Google's rule applies to personal accounts created after 13 November 2023, so
the closed test is required — 12+ testers opted in and active for 14 continuous days. "Opted in"
means each one accepted the invitation *and* installed the build under a matching Google account;
adding twelve email addresses does nothing. Dropping below twelve restarts the clock. Round 1 had
six people, so the group needs roughly doubling with Android users. Recruit ~20 for buffer.

Not wasted work, either: round 1 demonstrated that real testers surface real problems, and this is
the same closed test worth running before a release regardless.

**On the numbers**, since the sources disagree: the requirement is **12**, not 20. Twenty was the
old figure and it still circulates. One source quoting "12 to 20 depending on account type" is
muddled — it is not a scale, and organization accounts have no such requirement at all. That source
was `12testerhive.com`, which sells tester services and has an interest in the number sounding
worse.

**Repo impact: none.** `constants/legal.ts` already names Stanislav Kundera as a private individual
under Czech law, which is exactly what a personal account means. Nothing to wait for, nothing to
change.

**One future note:** if the app ever earns enough to belong to a business, Google supports
transferring an app between developer accounts. It is a real process rather than a click, but it is
not a dead end — which is what makes Personal a safe starting point rather than a trap.

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
| 2.0 | 🚨 **Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as EAS environment variables** | Standa | **Without this the build ships dead** — see below |
| 2.1 | `eas init` — links the project, writes `projectId` into `app.config.ts` | Claude | `eas.json` is already configured |
| 2.2 | First production build: `eas build --platform android --profile production` | Claude | Produces an AAB. **The one real technical unknown left** |
| 2.3 | Read the build output and confirm `targetSdkVersion` is 36 | Claude | Expected to pass — see the API level note below |
| 2.4 | Deploy the web export so `/legal/privacy` and `/legal/delete-account` are public | Standa | `vercel.json` is ready; needs the domain from 0.3 |
| 2.5 | Create the reviewer demo account and walk it through onboarding once | Claude + Standa | Not the dev-login credentials — those are stripped from production builds |

### 🚨 2.0 — the build will ship dead without this

The most likely way the first build fails, and it fails *silently*: it installs, opens, and does
nothing.

`.env` is gitignored (correctly — line 34). EAS builds in the cloud, from the repo, so it never sees
that file. `app.config.ts` reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` at
config-evaluation time and puts them into `extra`; with nothing to read, both land empty.
`isSupabaseConfigured()` then returns false and every screen falls back to "Configure Supabase env
vars to enable sign-in." A tester sees an app that cannot sign in, cannot load quests, and does
nothing at all.

Fix before the first build, after `eas login`:

```
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "<project url>" --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon key>" --visibility plaintext
```

`plaintext` is correct here rather than careless: the anon key is designed to be public, is protected
by row-level security, and ends up in the JS bundle either way. The `service_role` key is the one
that must never leave the server, and it is not used by this app.

**Do not set `EXPO_PUBLIC_DEV_LOGIN_EMAIL` or `EXPO_PUBLIC_DEV_LOGIN_PASSWORD` in EAS.** The
production profile strips them, but there is no reason to have them in the build environment at all.

Verify after the build: install it, and confirm the sign-in screen shows the normal form rather than
the configuration warning.

### ✅ The first build succeeded — and what the artifact actually contains

Built 2026-09-05, ~14.5 minutes, `versionCode` 2, version 1.0.0. **The app has now been built
natively for the first time in the project's life**, which retires the one genuine unknown that had
been sitting at the top of this roadmap since it was written.

Everything below was read out of the downloaded `.aab`, not inferred from config:

| Check | Result |
|---|---|
| `targetSdkVersion` | **36** — read from `base/manifest/AndroidManifest.xml`. Clears the 31 Aug 2026 requirement for new apps |
| Supabase URL and anon key | **Present and populated** in the resolved `app.config` inside the bundle. Task 2.0 worked: the app will actually run, not show the configuration fallback |
| `devLoginEmail` / `devLoginPassword` | **Absent.** The production `NODE_ENV` strip did its job in a real build, not just in a local experiment |
| `RECORD_AUDIO` | **Gone** — the block took effect through the manifest merger |
| `SYSTEM_ALERT_WINDOW` | **Gone** — likewise |
| `CAMERA` | **Present**, as intended. Confirms it merges in from expo-image-picker's own library manifest, so photo quest steps will work |
| Calendar, storage, INTERNET, VIBRATE | Present, all intended |
| `android.package` | `com.sidequestlife.app` |
| `userInterfaceStyle` | `light` |

**One unexplained entry: `android.permission.DUMP`.** It is not declared anywhere in this repo and
does not appear in any `AndroidManifest.xml` under `node_modules`, so it arrives from a transitive
Maven dependency rather than from anything we control. It is a signature-level permission that is
never granted to an ordinary app, so it is harmless — noted here only so it is not mistaken for a
finding if Play ever asks about it.

A first check on `strings` returned an empty permission list and would have read as "everything was
removed". It was a false negative — the tool simply found nothing in a protobuf manifest. The table
above comes from a byte-level search instead. Worth remembering if these checks get repeated.

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

### Getting through the closed test

Practitioner advice, sourced from a developer write-up (2026-08-29) rather than from Google, and
labelled as such because the author is promoting his own tool in the same piece:

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

Round 1 had 6 people, so the group needs roughly doubling — and specifically with **Android** owners,
which is the real constraint rather than willingness. Start asking now: this is task 0.5 and it runs
while Google verifies the account.

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

## Backlog — real, but not blocking launch

### Custom SMTP for Supabase auth emails

Supabase's dashboard warns it plainly: *"You're using the built-in email service. This service has
rate limits and is not meant to be used for production apps."* The limit is a handful of emails per
hour.

**Why it is not urgent.** The app signs in anonymously on launch (`app/index.tsx` calls
`signInAnonymously()`), so a tester opens it and starts using it without ever creating an account or
triggering an email. Closed-test email volume should be near zero.

**Why it cannot be ignored forever.** Every account signup and every password reset goes through it.
The moment real users arrive, the rate limit becomes the thing that stops people getting into the
app — and a tester who cannot receive a confirmation or reset email is a tester who drops out, which
is what breaks a 14-day streak.

Fix when convenient: Supabase → Authentication → Emails → SMTP Settings. Resend has a free tier
around 3,000 emails a month and takes minutes to wire up. Deferred deliberately 2026-09-05 — Standa's
call, and the right one.

**Related: email confirmation on sign-up is ON**, checked and deliberately left that way
2026-09-05. It means a user who signs up with an email cannot get in until they click a confirmation
link delivered by that same rate-limited service. Small exposure during the closed test, since
anonymous sign-in means most testers never create an account; a real funnel problem at public
launch. If a tester ever reports "I signed up and nothing arrived", this is the cause — confirm them
by hand in Supabase → Authentication → Users.

---

## Still worth looking up

Offered, and genuinely useful — these are the gaps this roadmap could not close from the material at
hand:

1. **The closed-testing requirements page** (`support.google.com/…/answer/14151465`) — the exact
   current tester count and duration, and how the console reports progress toward them. Sources
   disagree between 12 and 20; Google's own text says **12**, and 20 appears to be the superseded
   figure still circulating. Worth reading once from the source, since the whole schedule hangs on it.
2. **Confirm the account type really is unchangeable** on Google's "Choose a developer account type"
   page before creating anything. Every secondary source says so; it is a one-shot decision and
   deserves a primary source.
3. **Store listing asset specs** — current required screenshot counts and pixel dimensions for
   phones, and whether the feature graphic is mandatory or optional for a phone-only app. The one
   gap none of the supplied material touched.
4. **Play Payments policy, donations section** — whether a pure donation that unlocks nothing can use
   a non-Google payment method for an individual developer who is not a registered nonprofit, and in
   which regions — plus whether *linking out* to Buy Me a Coffee from inside the app is allowed at
   all, which is a separate rule from whether the donation itself needs Play Billing. The other case
   is already
   settled: anything a "donation" unlocks makes it a purchase, which must use Play Billing.

---

## Is the app ready for testing?

Audited 2026-08-29. **Functionally yes; technically unproven.**

**What is genuinely ready.** The app works — typecheck clean, `expo-doctor` 18/18, every screen
verified in the browser preview, and round 1 put it in front of real people who found real bugs that
were then fixed. Content, flows and copy are in a testable state.

**~~What has never been proven~~ — resolved 2026-09-05.** The first native build succeeded and was
verified from the artifact; see Phase 2. The paragraph below is kept because it explains what the
risk was and why an internal test is still worth running first.

The app had **never been built natively.** There is no `android/`
directory, `prebuild` has never run, and round 1 was distributed through **Expo Go**
(`docs/real-user-testing-checklist.md:21`, and the Maestro runbook still assumes
`E2E_APP_ID=host.exp.Exponent`). A production AAB is a different runtime from Expo Go: its own
manifest and permissions, release-mode JS, `__DEV__` false, R8 shrinking, the real icon and splash.
Everything that has been verified so far was verified somewhere else.

That is not a reason to delay — it is the reason task 2.2 exists and why an internal test (3.0) is
worth running first. But nobody should be surprised if the first build surfaces something.

### Blockers before a build reaches testers, in order

1. 🚨 **Supabase env vars in EAS** (2.0) — without them the app installs and does nothing.
2. **Merge `play-store-prep` and `play-store-roadmap`** (0.6) — the analytics fix must ship before
   anyone submits quest feedback, or the identifier starts landing in the database again.
3. **`{{ .Token }}` in the Supabase reset-password template** (0.4) — otherwise password reset is
   inert, and a tester locked out of their account is a tester who stops being active.
4. **Brand name confirmed** (0.7) — the first upload fixes the package name permanently.
5. **Legal pages deployed** (2.4) — the privacy policy URL is required in Play Console.

### Known open issues, neither a blocker

- **"Leave doesn't save progress"** (round-1 bug #8, part E) — never reproduced, so never fixed.
  Worth handing to round-2 testers as something to watch for.
- The synthesis lists a **"saves 10× on web"** duplicate-memory bug as still open, but
  `app/memory/new.tsx` now navigates straight to the saved memory precisely because "a multi-button
  `Alert.alert` never renders on web". It reads as fixed and the synthesis simply was not updated —
  and it was web-only regardless, so it does not affect an Android closed test.

### Everything else

Done and verified: `eas.json` with three named submit tracks, real app icon, in-app account deletion,
privacy policy, terms, the public deletion page, password reset, and the analytics anonymization fix
(script run against production 2026-08-29, both counts 0).

Not started: everything requiring the Play Console account, and the first build.
