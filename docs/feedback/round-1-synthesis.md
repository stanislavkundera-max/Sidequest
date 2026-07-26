# Usability Feedback — Round 1 Synthesis

Moderated usability sessions, 5 testers: **Mára (M)**, **Evka (E)**, **Dejv (D)**, **Terka (T)**, **Martin (Mar)**.
Method: [`docs/moderated-usability-session-guide.md`](../moderated-usability-session-guide.md).

Items are tagged with the testers who raised them. Where multiple testers agree, that is
the strongest prioritization signal and is called out inline. (Martin was a later follow-up
session; his items are folded in here with the `Mar` tag.)

**NPS:** E 7 · D 6–7 · T 6 · M — no number ("not the target audience") · Mar — no number given.

---

## ✅ Fixed this session (2026-07-26)

- **🎯 Root cause found: live Supabase project was missing several migrations.** Diagnosed via
  live REST API testing against the actual tester-facing project (not just static code reading).
  `profiles`, `quests`, and `user_quests` were missing columns that `supabase/production_prep.sql`
  is supposed to add:
  - `profiles`: `pace_preference`, `nature_connection`, `isolation_score` missing →
    `saveOnboardingStateForUser`'s fallback chain silently degraded to saving only
    `intensity_preference`, with categories/pace/baseline scales never persisting. **This is the
    confirmed root cause of bug #4 ("Edit preferences doesn't work")** — no error shown, so it
    looked like a no-op bug rather than a schema gap.
  - `quests`: `action_steps`, `journey_intro`, `suggested_group` missing entirely →
    every quest had **zero guided steps**. The whole step-by-step runner (timers, calendar step,
    "Guide" tips, step navigation) had no content to run on for any tester. Very likely a
    contributing cause of **bug #7** ("social/message quest stays on the same screen") — with no
    step data, the runner has nothing to advance to.
  - `user_quests`: `step_progress_v2` **and** legacy `step_progress` both missing → even where
    steps existed, completing one could never persist to the database (silently lost on refresh).
  - **Extra find:** `step_progress_v2` was never in `production_prep.sql`'s column list at all —
    only in `schema.sql`'s `CREATE TABLE IF NOT EXISTS`, which is a no-op on an existing table.
    Fixed in `supabase/production_prep.sql` (added `add column if not exists step_progress_v2`) so
    this doesn't recur on other environments.
  - **Fix applied:** ran `production_prep.sql` (adds missing columns, idempotent) + the
    `action_steps`/`journey_intro`/`suggested_group` backfill block from `seed.sql`, then the one
    added `step_progress_v2` column. All verified end-to-end via direct REST calls (profile
    preference write/read round-trip, quest step content present, step completion + revert
    write/read round-trip) — not just "no error," actually confirmed the data persists correctly.
  - **Not fully closed:** couldn't complete a live UI retest of #5/#6/#8b/#13/#14 in this session —
    the sandboxed preview browser blocks the app's automatic anonymous sign-in (a tooling/sandbox
    quirk, confirmed via direct API calls that the backend itself works fine). Recommend retesting
    these five in a real browser (`npx expo start --web`, then a normal Chrome/Safari tab) now that
    the schema is fixed — several may resolve on their own now that steps and preferences actually
    persist.
  - **Also noticed in passing:** seed quest `q-m-04` ("Digital sunset: no screens after 9 p.m.")
    is an existing abstention-style quest that now violates the round-1 decision in
    `docs/quest-content-guidelines.md` (rule #1, "no don't-do-X quests"). Content cleanup, not
    urgent — flagging for a later pass.
- **Quest length reads as abstract ("720 min")** (fix-now — M, E, D, Mar) — added a
  `formatQuestDuration` helper (`src/features/quests/questCopy.ts`) that switches to hours above an
  hour (720 min → "12 h", 90 min → "1 h 30 min") and applied it everywhere a quest/step duration
  shows (quest detail, Pick-quests, runner step, Journey hub, catalog row). *This fixes the abstract
  **duration**; the separate weekly/monthly/yearly **cadence** labels — tied to the 3/2/1 limits —
  are left as-is, that relabel needs a product call.*
- **Wrap-up / calendar messages felt error-like** (fix-now — E, T) — warmed the completion title
  ("Nice work — quest complete") and rewrote the calendar-step / calendar-hint copy to drop the
  uncertain "stays on your calendar" phrasing. `app/quest/run/[id].tsx`.
- **Can't go back a step in the quest runner** (bug #12, Mar) — added a `revertStep` store action
  (mirrors `completeStepWithEvidence`) plus a "Back a step" control in the runner header, shown once
  you're past step 1.
- **Onboarding copy** — pace headline "How much time do you have?" → "…want to dedicate?" (D);
  isolation question "isolated or disconnected from people" → "lonely or isolated" (Mar read
  "disconnected" as "don't get *along* with people").

---

## ✅ Fixed this session (2026-07-22)

- **Onboarding "What pulls you" duplicates the category selection** (fix-now item, T) —
  diagnosed as a real duplication, not just wording: step 2 picks categories (+3 signal) and
  step 4's `focus` options `calm`/`connection`/`wonder` just re-selected the Relax/Social/Nature
  category the user already picked (`focusScore` in `suggestedQuests.ts`); only `comfort_zone`
  was orthogonal. Reframed onboarding around **three orthogonal knobs — Theme / Time /
  Intensity**: step 2 headline → "How do you want to spend more time?"; step 4 → "How bold
  should your quests be?" (Gentle / Balanced / Bold), reviving the previously-dead `intensity`
  field (already had DB column + `intensity_selected` event) and retiring `focus` from the data
  model. Scoring now rewards difficulty fit instead of double-counting category. No Supabase
  migration (the `focus_preference` column is left unused). Touches `app/onboarding.tsx`,
  `src/features/quests/suggestedQuests.ts`, and the onboarding types/storage/repository.
- **Sign up "doesn't work"** (bug #1, E, D) — no code error, but `signUp()` against an
  already-registered-but-unconfirmed email returns a *silent success* from Supabase
  (`data.user.identities` empty, no error, no new confirmation email — a deliberate
  anti-enumeration behavior). The app showed the same "check your email" message either way,
  so a repeat signup attempt looked identical to a working one that quietly did nothing.
  [`sign-in.tsx`](../../app/(auth)/sign-in.tsx) now detects this case and shows "This email is
  already registered..." instead. **If sign-up still fails after this, the next suspect is the
  Supabase dashboard's "Confirm email" setting — not something fixable from the repo.**
- **Memory saves 10× on web** (bug #2, E) — found the exact cause: the success path called a
  multi-button `Alert.alert(...)`, which **does not render at all on web**. The Save button
  re-enabled immediately with zero visible feedback, so testers tapped Save repeatedly.
  [`memory/new.tsx`](../../app/memory/new.tsx) now navigates straight to the saved memory on
  success instead of waiting on a dialog; also swapped every remaining raw `Alert.alert` in
  `memory/new.tsx` and `memory/[id].tsx` for the web-safe `alertCompat`.
- **Timer/stopwatch can't be stopped or reset** (bug #3) — added a confirm-gated "Reset timer"
  action to [`TimerStepAction.tsx`](../../components/quest-run/TimerStepAction.tsx).
- **Leave / Wrap-up / "Back to quest" don't return to the app** (part of bug #8) — all three now
  navigate to the Journey tab instead of stranding the user on the quest detail stack screen.
  See [`app/quest/run/[id].tsx`](../../app/quest/run/[id].tsx). The "Leave doesn't save progress"
  half of bug #8 (E) is still open — needs reproduction.
- **Memory crops the image** (bug #9) — added `resizeMode="contain"` in
  [`memory/new.tsx`](../../app/memory/new.tsx) and [`memory/[id].tsx`](../../app/memory/[id].tsx).
- **Tab menu doesn't highlight the active tab** (bug #10) — `accent` and `textMuted` had almost
  identical perceived brightness; lightened the inactive tab tint in
  [`app/(tabs)/_layout.tsx`](../../app/(tabs)/_layout.tsx) for real contrast.
- **Feedback form: no visible submit** (bug #11) — rating buttons in
  [`QuestFeedbackCard.tsx`](../../src/features/feedback/QuestFeedbackCard.tsx) now just select a
  rating; an explicit "Send feedback" button appears once one is picked.
- **"Memories don't propagate on wrap-up"** (part of bug #2, M) — the auto-memory-save failure
  after completing a quest was completely silent (quest completion always showed "Nice work" with
  no sign a memory was supposed to exist). Now surfaces "We couldn't save a memory for it
  automatically" with an "Add a memory" action. This fixes the *visibility* of the failure; the
  underlying cause of why the auto-save occasionally fails is not confirmed and would need live
  logs (`quest.runner.autoMemory` in the error logger) to diagnose further. **E's separate "saves
  10× on web" complaint is a different root cause (raw `Alert.alert` not showing on web in
  `memory/new.tsx`) and is still open.**
- **"Wrap up quest" copy unclear** (fix-now item, D) — renamed to "Complete quest" (button),
  "open to finish" (`questHelpers.ts` hint), and "finish it" (`ProgressOverviewBlocks.tsx`) across
  all user-facing spots.
- **Quick copy/UX batch** (fix-now items) — (1) web calendar-step button "I scheduled it" →
  "Let's schedule it" (D); (2) removed the distracting centered compass badge from the onboarding
  welcome hero (T); (3) shortened the over-long "Your map is ready" footnote (D). Also confirmed
  already-resolved: category pre-selection, the old "What are you after" step, the isolation copy,
  and the completed-list newest-first sort. "World???" (E) couldn't be located in code — likely a
  Supabase-sourced category name.

---

## 🐛 Bugs (broken behavior, fix now)

### Critical — blocks the core loop
1. **Sign up doesn't work** — E, D. (For E it "eventually confirmed" → possibly email-confirmation / latency rather than fully dead.) ✅ **Fixed** — see above (plus a possible remaining Supabase dashboard setting to check).
2. **Memory save is broken** — E: looks like the memory didn't save, so the user saves it 10× → then it shows 10×. Related: M: "memories don't propagate on wrap-up." ✅ **Fixed** — both halves, see above.
3. **Timer / stopwatch can't be stopped or reset** — M, D. (D started it by accident and couldn't stop it; M afraid of losing progress.) ✅ **Fixed** — see above.

### High
4. **Edit preferences doesn't work** — E. ✅ **Root cause fixed** — see schema-migration finding above. Preference writes now persist and verified end-to-end via API; UI retest still recommended.
5. **Recommended quest disappears after you pick it → leaves a huge empty window** — E. Catalog has 5 active quests/category, ruling out "too few quests"; auto-refill logic (`ExploreQuestPanel`'s `recommended` useMemo) reads correctly in code. Needs live UI retest, now that schema is fixed.
6. **Quest doesn't disappear after completion** (it should) — E, **Mar** (2 testers). Checked `completeUserQuest`'s fallback path (a live theory) — all referenced columns (`status`, `completed_at`, `note`, `photo_url`) exist, so that specific theory is ruled out. Root cause still unconfirmed; needs live UI retest.
7. **Social / message quest**: moves to step 2 but stays on the same screen with the same text — E. 🔧 *Likely fixed as a side effect* — the matching quest (`q-w-05`, "Message someone...") had zero `action_steps` before the schema fix, so "step 2" had nothing to render; it now has real 3-step content. Needs live UI confirmation.
8. **Leave doesn't save progress** (unlike the back arrow) — E; and **neither back arrow nor Leave returns to home** — D. 🔧 *"Returns to home" half fixed above; "doesn't save progress" half still open.*
9. **Memory crops the image** — T. ✅ **Fixed** — see above.
10. **Tab menu doesn't highlight** the active tab when switching — D. ✅ **Fixed** — see above.
11. **Feedback form**: user doesn't know how to submit + it doesn't disappear after sending — E. ✅ **Fixed** — see above.
12. **Can't go back a step in the quest runner** — from step 2 there is no way back to step 1 — Mar. ✅ **Fixed** — see above ("Back a step").
13. **"Likes" may not work + unclear purpose** — Mar questions whether liking does anything at all and why it exists; E was also confused by likes. Needs repro. (See also the Explore "Likes" copy item.)
14. **After leaving/closing a quest it's hard to find again, and looks different in Journey** — Mar closed a quest, didn't know where it went, later found it via Journey where it looked different from where he'd left it. Overlaps #6 and #8.

---

## 🔧 Fix now (copy / UX polish)

### Onboarding
- Nature + Adventure pre-selected with no "why" explanation — M. ✅ **Fixed** — categories start empty (prior commit).
- "What are you after right now?" — confusing word order, can't picture anything — M. ✅ **Resolved** — that step (old `focus`) was replaced by the intensity question.
- "How often do you feel isolated?" — too vague (generally vs. recently) — M. ✅ **Resolved** — current copy asks "recently felt isolated".
- Nature-connection scale reads as "how much you *like* nature", not how much time you spend in it — Mar. (Ambiguity on the step-5 baseline scale.)
- "disconnected from people" reads as "don't get *along* with people", not lonely/isolated — Mar. ✅ **Fixed** — reworded to "lonely or isolated".
- "How it works" invites tapping — users try to click the rows even though they aren't interactive — Mar (D noted the same).
- Quest frequency not explained with numbers — M.
- Compass in the middle of the first-screen image is distracting — T. ✅ **Fixed** — removed the centered compass badge from the welcome hero.
- "How much time do you have" → "how much time do you want to dedicate" — D. ✅ **Fixed**.
- "Your map is ready" → rename to "Almost set"; bottom text too long — D. 🔧 *Bottom footnote shortened; headline kept as "Your map is ready" (rename to "Almost set" not done).*
- "What pulls you" duplicates the category selection — T. ✅ **Fixed** — see above (Theme/Time/Intensity reframe).

### Quests / detail
- **Quest length**: daily / weekly / monthly doesn't make sense → reframe as *how much time it takes* — M, E, D, Mar (4 testers). Mar's concrete example: an Adventure "monthly · 720 minutes" quest reads as hopelessly abstract. 🔧 *Duration humanized (720 min → "12 h") — see above. The weekly/monthly/yearly cadence relabel still open (needs product call, tied to limits).*
- The in-quest **"Guide"** tip block is disliked / feels like extra noise — D, Mar.
- Merge the "book / arrange" step with the calendar step so scheduling is a single action — Mar.
- Wrap-up message looks like an **error** / disliked notification — E, T. ✅ **Fixed** — warmed the completion title + rewrote the error-like calendar copy (browser-native dialog chrome on web is unchanged).
- "I scheduled it" → "let's schedule it" — D. ✅ **Fixed** — the web calendar-step button now reads "Let's schedule it" (the in-dialog confirm stays "I scheduled it" as a past-tense attestation).
- "wrap up quest" unclear → "every step is done" — D. ✅ **Fixed** — see above.
- Progress quest detail: too much text + duplicates the memory → split them, less text — T.
- Sort the activity list by completion time (newest first) — D. ✅ **Already satisfied** — the completed list sorts newest-first (`ProgressQuestHub.tsx`, `CompletedShowcase.tsx`). Active list is oldest-started-first by design.
- "World???" as a category name is confusing — E. ⚠️ **Couldn't locate** — no "World" label in code; likely a Supabase-sourced category name (`categories.name`), so rename lives in the DB/dashboard, not the repo.
- Progress tab icon disliked — T.

### Explore map
- Question marks → prefer icons, smaller / cleaner — T, D.
- "Likes" are confusing — what they mean, why they exist, and whether they even work — E, Mar. (See bug #13.)

### Memory
- Remove the character limit — T.
- **Communicate the photo up front** and **don't make it mandatory** at the end — T (raised twice).
- Let the user add a note directly without an edit step — T.
- Add a big, clear **green "Done"** state in Memories after finishing — Mar.
- After finishing, don't strand the user on the memory page that shows **Delete**; make it easy to exit — Mar (reinforces T's wrap → memory → progress confusion).

---

## 💡 Features / variants (later — need a product decision)

### 🔥 Strongest signal — all 4 testers
- **Let the user pick a quest from a pool instead of forced recommendations.** Variants:
  - Click an icon → always choose from 3, recommended ones just highlighted (T).
  - A pool at the top, then progress up the path (M).
  - D agrees with M; E hit the same friction (recommended quest vanished).
  - Ties directly into [`tasks.md`](../../tasks.md) #5 and #9.

### Other
- Quests **refill** after a completed one disappears — E.
- More interactive final onboarding screen; pick 0–3 quests at the end — D, T.
- Edit preferences available to everyone + click straight through to a quest at the end — E, D (`tasks.md` #9).
- "Your thoughts / feelings" reflection at wrap-up (à la Garmin Connect) + achievements — D, E.
- Filters in memories — T.
- Duolingo-style visual overview / progress screen — D, T.
- Guide / avatar in the app — D.
- Link to the phone's focus mode — D.
- Multiple-choice on "what do you want more of" — D.
- 3-month re-ask of the onboarding question (`tasks.md` #1).

### Monetization signal
- Nobody would pay for the app directly, but **via ads / a free month** E, D, and T would try it.

---

## ✅ Product decisions (resolved)

1. **No "abstention / negation" quests.** Quests whose goal is to *not* do something
   (don't use your phone after 8pm, don't sleep past midnight, don't eat after 8) do **not**
   belong in this app — that's digital-wellbeing / restriction territory, and testers read the
   framing as a mismatch (Mar). Quests must be about *doing* something real; if the intent is
   "less phone", express it as a positive action instead. **Now the first rule in
   [`docs/quest-content-guidelines.md`](../quest-content-guidelines.md)** (product-owner decision,
   2026-07-26).

---

## ⚠️ To decide — recorded only, not resolved

These are either contradictory between testers or conflict with `AGENTS.md`. Logged for a
later product call; no decision made yet.

1. **Community / sharing / do a quest with someone / leaderboard / co-op** — requested by M, T,
   and Mar. Mar's whole *pre-open* mental model was game-like and social: NPCs that hand out
   quests, other users submitting quests, co-op play; he also expected a **public profile** (with
   privacy / visibility settings). But [`AGENTS.md`](../../AGENTS.md) explicitly lists social
   feeds, multiplayer, other-user profiles, and leaderboards under **"What not to build."**
   → Direction change, not an automatic yes. He also noted community "is not the core of the app".
2. **Scrollable / movable map** — M and E want it (path upward, completed steps visible);
   **T has no need to scroll.** Contradictory.
3. **Notifications / pressure** — M wants a "you're not completing this quest" nudge;
   **D wants zero pressure, a quiet companion.** Contradictory, and touches product identity.
4. **Gamification — levels, bonus points, stars** — Mar wants quests to carry levels / bonus
   points, and a **star** for completing a bonus "side-quest within a quest" (framed like "win the
   fight, don't lose a life"). `AGENTS.md` explicitly bans points, levels, and complex
   gamification. → Direction change, not an automatic yes.
5. **Category structure — merge Nature + Adventure? rework/remove Relax?** — Mar: Nature and
   Adventure feel very similar ("big difference? can they be merged?"); Relax — especially
   "do-nothing" activities — competes with digital-wellbeing apps and may not fit. Affects the
   4-category model and the Explore map. (Relates to resolved decision #1 above.)

---

## Notable strategic remarks
- Content **quantity is extremely important** — M.
- Would need "crazy shit" / a stronger hook to actually keep using it — M.
- Target audience: not for everyone (M is not the target).
- Should be a **quiet companion, zero pressure** — D.
- Martin's pre-open mental model was **game-like and social** (NPC quest-givers, user-submitted
  quests, co-op) — informs the community decision above — Mar.
