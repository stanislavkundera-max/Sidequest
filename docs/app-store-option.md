# The iOS / App Store option

**Status: parked 2026-09-05.** Nothing here is decided and nothing in the repo was changed as a
result of it. This is a handoff so the research does not have to be redone if the question comes
back.

> **Corrected later the same day.** The Android track moved a long way in the hours after this was
> written — EAS project linked (`0f3bb07`), first native build succeeded (`edebd04`), Play Console
> created and paid (`f6a4918`). Three claims below went stale immediately and have been fixed in
> place: §1's "never built natively," §2's hedge on the 12/14 rule, and §5's step 4. The
> recommendation in §4 is unaffected — if anything §4 got stronger, since the closed-test
> requirement is now confirmed rather than assumed. The four config deltas in §1 were re-checked
> against the current `eas.json` and `app.config.ts` and are all still outstanding.

**The question that prompted it:** "How hard would it be to put the app on the App Store instead of
Google Play? Most of my friends have iPhones — I'm the one on Android."

That framing (*instead of*) turns out to be the wrong frame, and the reason why is the whole point of
this document. See §4.

---

## 1. Porting effort — there is nothing to port

Audited from the repo on 2026-09-05.

| Checked | Result |
|---|---|
| Native project folders | None. `ios/` and `android/` do not exist — pure Expo SDK 54 managed workflow, both platforms generated from the same JS at build time |
| `ios.bundleIdentifier` | ✅ Already set: `com.sidequestlife.app` (`app.config.ts`) |
| Platform-split source files | None. No `.ios.tsx` / `.android.tsx` anywhere |
| `Platform.OS` branches | 11 total, 10 of them *web vs. native*. The one genuinely iOS-specific branch already exists and is written: `src/features/quests/questCalendar.ts:23` (`getDefaultCalendarAsync`, because iOS has no "primary writable calendar" concept) |
| Dependencies | All first-class on iOS — expo-calendar, expo-image-picker, reanimated, paper, screens, safe-area. Nothing Android-only |
| Info.plist permission strings | ✅ Verified by reading the plugin sources, not assumed. `expo-calendar/plugin/build/withCalendar.js` emits both `NSCalendarsUsageDescription` and `NSCalendarsFullAccessUsageDescription` from the existing `calendarPermission`; `expo-image-picker` emits `NSPhotoLibraryUsageDescription` + `NSCameraUsageDescription`, and the existing `microphonePermission: false` genuinely removes `NSMicrophoneUsageDescription` rather than leaving it blank |
| Mac required? | **No.** EAS Build compiles on Expo's macOS machines and handles code signing |

So the honest estimate is **a day of configuration, not a rewrite.** The actual deltas:

1. **`eas.json` has zero iOS entries.** Every profile is Android-only today — `preview` builds an APK,
   `production` builds an AAB, and all three `submit` profiles name Play tracks. Needs iOS blocks and
   a submit profile carrying `appleId` / `ascAppId` / `appleTeamId`.
2. **`ios.config.usesNonExemptEncryption: false` is missing** from `app.config.ts`. Without it every
   single TestFlight upload stops and waits on the export-compliance question in App Store Connect.
   One line, saves an interruption on every build forever.
3. **`ios.supportsTablet: true` should probably become `false`.** It is set today and it costs twice:
   an extra required screenshot size (13" iPad, exactly 2064×2752) *and* a reviewer who tests the app
   on an iPad, on a UI nothing has ever tailored for iPad. Turning it off removes both. Already
   flagged in `docs/launch-plan.md` as "arguably no current benefit."
4. **Screenshots retarget cheaply.** `scripts/capture-store-screenshots.cjs:22-23` is parameterized —
   change `WIDTH`/`HEIGHT` to 1320×2868 (6.9" iPhone; Apple rejects off-by-one) and re-run. The same
   two caveats from `store-assets/play/README.md` still apply: they come from the web build, and two
   of them show empty states.

**Untested surfaces that need a real device**, in rough order of risk: the calendar flow (iOS 17+
splits calendar consent into write-only vs. full access, and `getDefaultCalendarAsync` sits on the
full-access side), the image picker, the `KeyboardAvoidingView behavior="padding"` branches in
`app/(auth)/sign-in.tsx` and `app/(auth)/forgot-password.tsx`, and safe-area insets on notched devices.

**The standing caveat, ~~as written~~ corrected 2026-09-05:** ~~the app has never been built natively
for *either* platform.~~ It has now — but **Android only** (`edebd04`: AAB, versionCode 2, 14.5
minutes, `targetSdkVersion` 36 read back from the manifest rather than trusted from config). That
retires the general "does this thing even compile" unknown, which was the larger half of the risk.

What it does *not* retire is the iOS-specific half: no iOS build has ever run, and the parts that
differ are exactly the parts that were never exercised — Apple code signing, provisioning profiles,
and the App Store Connect upload path. EAS handles all three, but "handles it" and "has done it once
for this project" are different states.

---

## 2. Testing: TestFlight has no equivalent of the 12/14 rule

Verified 2026-09-05 against current sources (see §6). This is the sharpest difference between the two
platforms and the reason the question was worth asking at all.

| | Google Play (personal account) | Apple TestFlight |
|---|---|---|
| Minimum testers | **12, opted in and actually using the app** | 0 |
| Minimum duration | **14 continuous days** | none |
| If a tester drops out | Clock **resets** | nothing happens |
| Internal testers | — | 100, instant, no review |
| External testers | — | 10,000, by email or public link |
| Review before testing can start | no | **yes**, but light: first build of a version only, ~24h (range 4–48h). Later builds of the same version clear in minutes |
| Build lifetime | — | **90 days**, then it disappears from testers' devices along with local state |
| Review for public release | days | ~90% within 24–48h |

**2026 update on the Play side:** Google now also checks that the 12 testers *genuinely used* the app,
not merely that they opted in. The requirement applies to personal Play Console accounts created on or
after 2023-11-13.

~~Per commit `ec8dbbd` the account type was settled as **Personal**, so this almost certainly applies
— `docs/launch-plan.md` still hedges on it. The hedge is looking optimistic.~~ **Settled 2026-09-05,
and the optimism did not survive the day.** The account was created and paid (`f6a4918`), and
`docs/play-store-roadmap.md:118` now states it flatly: the account is Personal and post-2023-11-13,
so **the closed test is required.** Round 1 had six people; the roadmap's advice is to recruit ~20
Android users for buffer, since dropping below twelve restarts the clock.

This matters for §4 rather than just being bookkeeping. The central argument there — that the twelve
cannot be filled with friends, because the friends are on iPhones — was written while the requirement
was still hypothetical. It is now a confirmed constraint, so the argument no longer depends on an
assumption.

**The strategically important fact:** *TestFlight does not require ever publishing to the App Store.*
Create the App Store Connect record, upload a build, clear the light beta review, and you have a
public link for testers. No full App Store review, no screenshots, no nutrition label.

**But the gate moves rather than disappearing.** Apple's cost is editorial, not calendar-bound.
Roughly 4 in 10 first submissions are rejected and the most common single reason is Guideline 4.2
("minimum functionality" — the app doesn't look finished). The classic trigger is an empty-looking
first run, and `store-assets/play/README.md` already admits `05-memories` and `06-progress` show empty
states because capture runs on a fresh anonymous account. Google effectively does not do this. A
rejection also goes onto the account's history, which a delay does not.

Also still owed, and more urgent for Apple than for Google: the **demo/reviewer account**, already on
the gap list in `docs/launch-plan.md`.

---

## 3. Costs, and the ones that turned out not to matter

- **$99/year (Apple) vs. $25 once (Google).** Over three years, $297 vs. $25. Real, not decisive.
- **EU DSA trader status** — worth writing down because it *looks* like an Apple-specific problem and
  isn't. Both stores require the declaration and both publicly display trader contact details on the
  listing. Not a differentiator; don't re-research it.
- **Reusable across both stores, already done:** privacy policy, terms, in-app account deletion, the
  public deletion page, store listing copy, and the first-party-only analytics posture (no IDFA, no
  ad network, no third-party SDK) that keeps both privacy questionnaires in the simple lane. Apple's
  nutrition label answers are largely derivable from the Play data-safety answers already pre-computed
  in `docs/play-store-handoff.md` §5.

---

## 4. The actual trade-off, and the recommendation

Two forces pull opposite ways.

**For iOS: the testers are physically there.** Stronger than it first sounds. `docs/launch-plan.md`
assumes the round-1 group (6 people) covers half of the needed 12. If most of those friends are on
iPhones, the Play closed test cannot be filled with friends at all — it gets filled by recruiting
strangers to satisfy a formality, producing feedback from people who don't care about the app. That
is the precise opposite of what a closed test is for. TestFlight also ships a built-in feedback
channel with annotated screenshots straight from the app; Play internal testing has no equivalent.

**Against iOS: Standa cannot dogfood it.** He is on Android, and with no Mac there is no simulator
either. He would be the one person unable to run his own release build — for an app whose entire loop
is "go do something in the real world," which he iterates on daily. Every bug report arrives
secondhand.

**Recommendation as of 2026-09-05: not *instead of* — add it, and swap the roles.**

- **Play stays the release target.** ~90% done, $25 is trivial, identity verification is the longest
  pole and has to run regardless — and Standa lives on Android, so his own dev loop stays there.
- **TestFlight becomes the testing channel.** The $99 doesn't buy an App Store listing; it buys a
  distribution channel to the friends who actually exist, with no 14-day clock and no scramble for
  twelve warm bodies.
- **Both clocks run at once.** The Play 14 days tick in the background with whoever does have Android,
  while real feedback arrives from iOS in days.

**One thing not to do:** don't submit to the App Store proper before the redesign lands. Guideline 4.2
against the pre-redesign UI with empty states is an avoidable slap, and an Apple rejection is worse
than a delay.

---

## 5. If this gets revived, do these in order

1. **Apple Developer Program enrollment, $99** — verification runs 24h to ~2 weeks, so it is the
   calendar-bound step, exactly like Play Console identity verification. Start it first, do everything
   else while waiting.
2. `app.config.ts`: add `ios.config.usesNonExemptEncryption: false`; decide `supportsTablet`.
3. `eas.json`: iOS blocks on the build profiles + an iOS submit profile.
4. First `eas build --platform ios`. ~~Still gated on `eas init` / an Expo login, same as the Android
   build.~~ **No longer gated on Expo at all** — the project was linked on 2026-09-05 (`0f3bb07`),
   projectId `47896bf8-1a57-4fb8-9f0c-6c84df8e4a6a` under the `sidequestlife` owner, pinned by hand in
   `app.config.ts` because `eas init` cannot write to a dynamic TypeScript config. The only remaining
   gate is step 1: Apple enrollment and the signing credentials that come with it. Note the Supabase
   env vars were set for the `production` and `preview` EAS environments, which are platform-agnostic
   — an iOS build inherits them and will not hit the "Configure Supabase env vars" fallback.
5. App Store Connect record + TestFlight internal group (no review needed) → then external + the light
   beta review.
6. Demo/reviewer account with credentials — needed for both stores, blocking for Apple.
7. Only later, and only after the redesign: nutrition label, 1320×2868 screenshots, full App Store
   review.

## Open questions this document does not answer

- ~~Whether the Play 12/14 requirement actually applies to the account.~~ **Closed 2026-09-05: it
  does.** See §2.
- Whether enough friends would install TestFlight to make the iOS channel worth $99 — the entire
  argument in §4 rests on this and it has never been asked out loud. **Still the one that matters**,
  and now the only one of the three that is cheap to answer: it is a question for Standa, not an
  engineering task.
- How the app behaves on any iOS device. Nobody has ever run it on one — still true after the first
  native build, which was Android.

## 6. Sources (checked 2026-09-05)

- https://ontest.app/blog/google-play-12-testers-14-days-requirement-explained
- https://www.testerscommunity.com/blog/google-play-closed-testing-requirements-2026
- https://techconcepts.org/blog/testflight-guide
- https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information/
- https://developer.apple.com/programs/enroll/
- https://www.superappp.com/blog/why-apps-get-rejected-from-the-app-store-2026-guide
- https://www.revenuecat.com/blog/growth/the-ultimate-guide-to-app-store-rejections
