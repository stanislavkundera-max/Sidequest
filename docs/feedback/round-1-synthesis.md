# Usability Feedback — Round 1 Synthesis

Moderated usability sessions, 5 testers: **Mára (M)**, **Evka (E)**, **Dejv (D)**, **Terka (T)**, **Martin (Mar)**.
Method: [`docs/moderated-usability-session-guide.md`](../moderated-usability-session-guide.md).

Items are tagged with the testers who raised them. Where multiple testers agree, that is
the strongest prioritization signal and is called out inline. (Martin was a later follow-up
session; his items are folded in here with the `Mar` tag.)

**NPS:** E 7 · D 6–7 · T 6 · M — no number ("not the target audience") · Mar — no number given.

---

## ✅ Fixed this session (2026-07-26)

- **Memory section fix-now batch (T, Mar).** Photo hint added to quest detail before starting
  (when the quest usually ends with one); auto-created memories with no real evidence now open
  straight into editing instead of forcing an Edit tap; a green "Saved to your memories" banner
  plus a prominent "Done" button now appear on arrival (manual save and quest auto-save both),
  replacing the destructive-looking Edit/Delete row as the obvious next action. Character limit
  was already gone — could not find one anywhere in code.
  (`app/quest/[id].tsx`, `app/memory/[id].tsx`, `app/memory/new.tsx`, `app/quest/run/[id].tsx`,
  `src/features/memories/memoryDraft.ts`.)
- **Bug #14 ("left quest is hard to find, looks different") — design decided, built.** Root cause:
  `Leave` sends a quest to `saved_for_later`, which surfaces as the **"Liked"** section — so a
  quest you were 2/3 through landed in the same bucket as things you hearted but never started.
  The app *did* say where it went and Mar still lost it, which points at the destination **name**
  rather than the messaging. Split by whether progress exists (derived from step progress, **no
  schema change**): **"Pick up where you left off"** section above **"Liked"**, same card identity
  in both, only the action verb differs (Begin / Resume). Leave dialogs in quest detail and the
  runner now name whichever destination actually applies.
  (`JourneyQuestHub.tsx`, `questCopy.ts`, `quest/[id].tsx`, `quest/run/[id].tsx`.)
- **Bug #8 ("Leave doesn't save progress") — real cause found, fixed.** Verified live via the
  Supabase REST API that `moveActiveQuestToLater` (what Leave calls) never touches
  `step_progress_v2` — no data is actually lost. The real bug: the "Liked" card a left quest
  reappears on showed no progress indicator and a generic "Start now" button, so a quest with
  steps already done looked exactly like a fresh one. Fixed: Liked cards now show "X/Y steps
  done" and the button switches to "Resume" once progress exists
  (`components/journey/JourneyQuestHub.tsx`).
- **Bug #6 ("Quest doesn't disappear after completion") — investigated, not reproducible.**
  Traced every status-based filter in the codebase (Explore/Journey/Progress/questHelpers) and
  reproduced the exact assign→complete→refetch sequence live via the REST API — status correctly
  flips to `completed` and every filter would exclude it. No bug found in code or data. Best guess:
  the same symptom as the pre-2026-07-22 wrap-up navigation bug (completing used to route back to
  quest detail instead of Journey), possibly already resolved as a side effect. Needs a live UI
  retest to close for real — this is the limit of what static analysis + backend simulation can
  confirm.
- **Bugs #5 and #13 moved from "bugs" to "To decide"** — on reflection both are product-design
  questions (what should the Explore "Recommended" refill behavior be; what are "Likes" even
  for), not code defects. See the "To decide" section, items 6–7.
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
5. ~~Recommended quest disappears after you pick it → leaves a huge empty window~~ — **moved to "To decide" below** (it's a recommendation-behavior design question, not a pure bug — see decision #6 there).
6. **Quest doesn't disappear after completion** (it should) — E, **Mar** (2 testers). 🔍 **Investigated, no bug found.** Traced every consumer of `user_quest.status` across Explore/Journey/Progress/questHelpers — all filter consistently. Reproduced the exact assign→complete→refetch sequence live via the Supabase REST API (not just code reading): status correctly flips to `completed` and every list-filter predicate in the codebase would exclude it. Best guess: this was the *same* symptom as the old wrap-up navigation bug (pre-2026-07-22 fix, completing a quest routed back to the quest **detail** screen instead of Journey) and may already be resolved as a side effect of that fix. Needs a live UI retest to actually close — could not reproduce further via static analysis or backend simulation alone.
7. **Social / message quest**: moves to step 2 but stays on the same screen with the same text — E. 🔧 *Likely fixed as a side effect* — the matching quest (`q-w-05`, "Message someone...") had zero `action_steps` before the schema fix, so "step 2" had nothing to render; it now has real 3-step content. Needs live UI confirmation.
8. **Leave doesn't save progress** (unlike the back arrow) — E; and **neither back arrow nor Leave returns to home** — D. ✅ **Both halves fixed.** "Returns to home" fixed earlier (see 2026-07-22 above). For "doesn't save progress": verified via live API round-trip that `moveActiveQuestToLater` (what Leave calls) never touches `step_progress_v2` — the data was never actually lost. The **real bug** was that the "Liked" card (where a left quest reappears) showed zero progress indicator and a generic "Start now" button, so a quest with steps already done looked indistinguishable from a fresh one. Fixed: the Liked card now shows "X/Y steps done" and switches the button to "Resume" once any step is complete (`components/journey/JourneyQuestHub.tsx`).
9. **Memory crops the image** — T. ✅ **Fixed** — see above.
10. **Tab menu doesn't highlight** the active tab when switching — D. ✅ **Fixed** — see above.
11. **Feedback form**: user doesn't know how to submit + it doesn't disappear after sending — E. ✅ **Fixed** — see above.
12. **Can't go back a step in the quest runner** — from step 2 there is no way back to step 1 — Mar. ✅ **Fixed** — see above ("Back a step").
13. ~~"Likes" may not work + unclear purpose~~ — **moved to "To decide" below** (decision #7 — what liking is even *for* needs settling before the mechanism can be judged working or broken).
14. **After leaving/closing a quest it's hard to find again, and looks different in Journey** — Mar closed a quest, didn't know where it went, later found it via Journey where it looked different from where he'd left it. ✅ **Fixed** — root cause was that leaving a half-done quest dumped it into the **"Liked"** wishlist bucket (`Leave` → `saved_for_later`), mixing "hearted, never started" with "was 2/3 through it". Note the app *did* tell him where it went ("You will find it under Journey → Liked") and he still lost it — the destination *name* was the problem, not the messaging. Now split into two sections: **"Pick up where you left off"** (has progress) above **"Liked"** (wishlist), same card identity in both with only the action verb changing (Begin / Resume). No schema change — the split is derived from step progress. Leave dialogs now name the correct destination.

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
- Remove the character limit — T. ✅ **Already satisfied** — no `maxLength` exists anywhere in the memory forms; could not reproduce in code, likely fixed in an earlier pass.
- **Communicate the photo up front** and **don't make it mandatory** at the end — T (raised twice). ✅ **Fixed** — quest detail now shows a small camera hint ("This one usually ends with a photo...") before you begin, when `quest.suggestedProofType === 'photo'`. Photo was already optional at save time (`app/quest/[id].tsx`).
- Let the user add a note directly without an edit step — T. ✅ **Fixed** — when the quest runner auto-creates a memory with no real evidence (only confirm/timer steps, so the body is just the generic placeholder), "View memory" now opens straight into editing instead of a read-only screen you'd have to tap Edit on first.
- Add a big, clear **green "Done"** state in Memories after finishing — Mar. ✅ **Fixed** — a green "Saved to your memories" banner now shows on arrival, for both manual saves (`memory/new.tsx`) and quest auto-saves.
- After finishing, don't strand the user on the memory page that shows **Delete**; make it easy to exit — Mar (reinforces T's wrap → memory → progress confusion). ✅ **Fixed** — a prominent "Done" button (→ Memories tab) now appears above the Edit/Delete row whenever you've just landed here from a save, so the obvious next action isn't a destructive one.

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
6. **Explore "Recommended" behavior after you pick one** (moved from bug #5, E) — today
   `ExploreQuestPanel` shows exactly one recommended quest per category (`limit: 1`); claiming it
   should make the *next*-best quest recompute into that slot automatically (confirmed intent:
   "v momentě co si vybere doporučenej quest, tak by se tam měl objevit další doporučený quest").
   Needs a decision on the actual shape before more fixing: single auto-refilling slot (current
   code's apparent intent), or a small pool (3) the strongest tester signal already asks for (see
   "🔥 Strongest signal" above) — those two designs overlap and shouldn't be built twice.
7. **What are "Likes" actually for?** (moved from bug #13, E, Mar) — mechanically it's
   `saveQuestForLater` (moves a quest to the "Liked" bucket in Journey) and the write path is
   sound, but testers couldn't tell you what tapping the heart is *supposed* to accomplish or
   confirm it did anything. Before touching the code, decide what liking should communicate to
   the user (a bookmark? a preference signal? something else?) and how it should visibly confirm
   itself.
8. ~~What should "leaving/closing a quest" actually leave behind?~~ ✅ **Decided and built**
   (2026-07-26). Decision: a left quest's resting place depends on whether it has progress —
   quests with steps done go to a dedicated **"Pick up where you left off"** section, quests
   with none stay in **"Liked"** (pure wishlist). One card identity across both; only the action
   verb changes (Begin / Resume). Derived from step progress, so no schema change. See bug #14.

---

## Notable strategic remarks
- Content **quantity is extremely important** — M.
- Would need "crazy shit" / a stronger hook to actually keep using it — M.
- Target audience: not for everyone (M is not the target).
- Should be a **quiet companion, zero pressure** — D.
- Martin's pre-open mental model was **game-like and social** (NPC quest-givers, user-submitted
  quests, co-op) — informs the community decision above — Mar.
