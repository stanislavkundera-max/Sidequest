# Usability Feedback — Round 1 Synthesis

Moderated usability sessions, 5 testers: **Mára (M)**, **Evka (E)**, **Dejv (D)**, **Terka (T)**, **Martin (Mar)**.
Method: [`docs/moderated-usability-session-guide.md`](../moderated-usability-session-guide.md).

Items are tagged with the testers who raised them. Where multiple testers agree, that is
the strongest prioritization signal and is called out inline. (Martin was a later follow-up
session; his items are folded in here with the `Mar` tag.)

The verbatim, unedited original notes this document triages — exactly as each tester and the
mentor wrote them — are preserved in
[`round-1-raw-notes.md`](round-1-raw-notes.md) for independent verification later.

**NPS:** E 7 · D 6–7 · T 6 · M — no number ("not the target audience") · Mar — no number given.

---

## ✅ Fixed this session (2026-08-06) — remaining Fix-now batch

- **Supabase project pause/resume, false alarm resolved.** The Supabase free-tier project had
  auto-paused from inactivity; Standa resumed it. Direct REST queries with only the publishable
  anon key still came back with `categories`/`quests`/`profiles` all empty (`Content-Range: */0`)
  — looked like data loss. It wasn't: `schema.sql`'s RLS policies correctly require the
  `authenticated` role, not bare `anon` — my test calls weren't actually signed in. Verified by
  calling `/auth/v1/signup` for a real anonymous session and re-querying with that token: all 4
  categories (Nature/Adventure/Social/Relax) and the expected quest/profile counts came back fine.
  The live app (which does sign in properly) was never affected.
- **"World???" (E) — found and fixed.** Same investigation surfaced the real source: no Supabase
  category is named "World" — the confusion came from `AllQuestsList.tsx`'s catalog count line,
  "X quests **in this world**" (the app's map metaphor), which reads as a nonsense label next to a
  category picker. Changed to "X quests in this category".
- **Found in passing: leftover debug-instrumentation `fetch()` calls, removed.** 3 spots in
  `components/journey/JourneyWorldScene.tsx` and `components/journey/JourneyAtmosphere.tsx` had
  `// #region agent log` blocks POSTing layout telemetry to `http://127.0.0.1:7500/ingest/...` on
  every layout event — leftover from an earlier automated debugging session (hypothesis IDs
  H2–H4), never cleaned up. Harmless for real users (the local debug server doesn't exist outside
  that one dev session, so the fetch just silently fails), but dead weight firing on every resize.
  Removed all three, plus the now-unused `LayoutChangeEvent` import and handler-only code paths.
- **Notification-intensity setting (mentor decision #3) — scoped, not yet built.** Confirmed the
  app has zero notification infrastructure today (no `expo-notifications` usage anywhere). Standa
  chose to scope this as *preference field + UI control only* for now (no real notification
  sending yet) — still to build.
- **Cadence relabel (weekly/monthly/yearly)** — Standa's call: leave as-is for now. Duration
  humanizing already addressed the main complaint; the cadence rename itself stays parked.

---

## 🔍 Self-audit (2026-07-27) — Standa asked me to check my own work the same way

Standa asked me to re-check everything from today with the same "can I undo it, does it lead
somewhere correct" logic used for the unlike fix. Found two real problems in my own work and a
few pre-existing ones surfaced along the way:

- **Bug I introduced: the calendar-step merge (item 6 in Fix-now) silently deleted real
  functionality instead of merging it — reverted.** The 3 "book a slot/instructor/night away"
  quests I "fixed" have their first step ask a plain text question ("which organization, and
  when's your shift?") — not an actual device-calendar action. The calendar-reminder step I
  suppressed was the *only* thing that ever added a real event to the user's phone calendar for
  these quests. Checked the runner code: a step's UI is chosen by `action.kind === 'calendar'`
  first, falling back to `interaction.kind` — the two can't coexist on one step today, so there
  was no way to actually merge them without a runner change I hadn't scoped or asked about.
  Reverted `src/constants/questJourneys.ts` to its pre-fix state; these 3 quests keep their
  separate calendar-reminder step. A real merge (if still wanted) needs a proper follow-up, not a
  quick regex change.
- **Bug I introduced: 3 navigation destinations in the runner still pointed at Journey after
  today's Progress-tab move, contradicting the promised destination.** `app/quest/run/[id].tsx`
  had `router.replace('/(tabs)/journey')` after Leave, after completing a quest, and on "Not yet —
  keep this active" — all stale once paused/liked quests moved to Progress. Fixed: Leave and
  quest-completion now land on `/(tabs)/profile` (where the result is actually visible); "Not yet —
  keep this active" (quest stays active, not paused) now goes to the quest's own detail page
  instead, since neither Journey nor Progress highlights a specific active quest.
- **Verified as correct, no changes needed:** Unlike deletes the row and makes the quest
  re-eligible for Recommended/Liked; Resume/Begin correctly reactivates the same row via
  `assignQuestToUser`'s "reopen" branch without touching step progress; the Reflection-hide fix
  only applies to completed quests with a real memory and un-hides itself if that memory is later
  deleted (reactive on the memories store); the Guide-tip collapse only hides supplementary text,
  never the step's title/detail.
- **Pre-existing issues found, not caused by today's work:**
  - Two alert strings told users to "use the Journey tab to let one wait" (`app/quest/select.tsx`,
    `app/quest/run/[id].tsx`) — inaccurate regardless of today's changes, since Journey (the plain
    catalog) has never had a "let it wait" control; that lives on a quest's own detail page.
    Corrected both to say that directly.
  - Three more orphaned, never-mounted files found the same way `JourneyQuestHub.tsx` was: a full
    "Active path" screen (`app/quest/active.tsx`, zero references anywhere — not even a Stack
    registration in `app/_layout.tsx`), `components/progress/ProgressQuestHub.tsx` (unused, but
    wrongly cited below in bug #10's fix note as contributing to the sort order — verified
    `CompletedShowcase.tsx` alone genuinely does that sort correctly), and a full "Completed
    quests" screen (`app/quest/completed.tsx` — had a `Stack.Screen` registration in
    `app/_layout.tsx` giving it a header, but no actual navigation call anywhere reaches it; `git
    log` shows it predates even the Journey/Progress rework, from the app's earlier flat-list era).
    Standa confirmed none relate to anything on the roadmap — **deleted all three**, removed the
    dangling `quest/completed` Stack registration, and corrected the stale references to
    `ProgressQuestHub.tsx` in `AGENTS.md` and `docs/journey-visual-style.md` (which described it as
    the live Progress-tab UI).

---

## ✅ Fixed this session (2026-07-27, after live use)

Standa tried the app after the fix-now batch above and reported two things directly:

- **Bug: no way to unlike a quest.** The heart/"Like" action only ever wrote
  `saved_for_later` — there was no reverse action anywhere in the codebase (`git grep` confirmed
  zero "unlike"/remove call sites). Once liked, a quest was stuck in "Liked" forever with no exit
  besides starting it for real. Added a real unlike: `removeSavedForLaterQuest` (repository) +
  `unlikeQuest` (store) delete the row outright — safe because a zero-progress "Liked" row only
  ever existed to record the like, there is no data to preserve. Surfaced as an "Unlike" button
  next to Begin, shown only on zero-progress Liked cards (`components/journey/PausedAndLikedSections.tsx`)
  — paused ("Pick up where you left off") cards keep Resume only, since removing those would
  silently drop real step progress.
- **"Pick up where you left off" and "Liked" moved from Journey to Progress (for now).** Standa's
  own call: these felt like they belonged under Progress, not mixed into the full quest catalog.
  Moved `PausedAndLikedSections` from `app/(tabs)/journey.tsx` to
  `app/(tabs)/profile/ProgressOverview.tsx`, above the completed-quests showcase; Journey is back
  to being just the catalog browser. Updated `QUEST_COPY.leaveDestination` and the Leave-dialog
  accessibility label to say "Progress" instead of "Journey" so the promised destination matches
  reality again. Marked "for now" per Standa — revisit if it doesn't feel right after more use.

---

## ✅ Fixed this session (2026-07-27, continued further)

- **Bug #15's real cause found — and it retroactively reopens #8 and #14.** Standa reproduced it
  directly: leaving a quest mid-way (stopwatch running) popped the correct dialog — *"You will
  find it in Journey under 'Pick up where you left off'"* — but he could never find that section.
  Digging in: **the "Pick up where you left off" / "Liked" split I built earlier this session for
  #8 and #14 lived entirely inside `components/journey/JourneyQuestHub.tsx` — a component nothing
  in the app ever imports.** The real, live Journey tab (`app/(tabs)/journey.tsx`) renders
  `AllQuestsList`, a plain full-catalog-by-category browser with no saved/liked section at all.
  `git log` confirms both files were created together in the same big rework commit, before this
  feedback round started — `AllQuestsList` got wired to the screen, `JourneyQuestHub` never did.
  So every fix I made to it (the progress badge, the Resume/Begin split, the whole section) was
  logically correct but **shipped to nothing** — testers could never have seen it, which is
  exactly what #15 (and, in hindsight, #14) describes.
  - **Fix:** extracted just the paused/liked logic and card into a new, focused
    `components/journey/PausedAndLikedSections.tsx`, mounted directly in the real
    `app/(tabs)/journey.tsx` above the catalog browser. `AllQuestsList` now takes its `actions`
    (start/like/busy/path-full-modal) as a prop instead of creating its own, so the screen owns a
    single shared action/modal instance instead of two independent ones.
  - **Deleted `JourneyQuestHub.tsx`** — confirmed via `git grep` it had zero remaining references
    anywhere (code, tests, docs) once the working logic was moved out; keeping a second,
    identical-looking but non-rendering component around is exactly how this happened in the
    first place.
  - **Retracting the "✅ Fixed" status on #8 and #14 from earlier this session** — the underlying
    logic/design was right and didn't need to change, but neither had actually reached a real
    screen until now. Marking both fixed-for-real below, dated today.
  - Still unverified live (same sandboxed-browser sign-in block as before) — confident in this one
    though, since I can now point at the exact commit that created the orphaned component and
    confirm nothing else in the codebase ever pointed to it.

## ✅ Fixed this session (2026-07-27, continued)

- **Bugs #6 and #7 — actually fixed, not just verified.** Standa asked to keep pushing on these
  as real fixes rather than waiting on a live-UI retest, so I dug deeper instead of stopping at
  "investigated, no bug found":
  - **#6 (quest doesn't disappear after completion):** found it — the "Every step is done" screen's
    secondary exit was labeled "Back to journey" with no indication it *doesn't* complete the
    quest. Reading "every step is done" as "I'm finished" and tapping that instead of "Complete
    quest" leaves the quest active forever, invisibly. Relabeled to "Not yet — keep this active".
  - **#7 (social/message quest stuck on step 2):** the earlier "fixed by the schema migration"
    claim in this doc was wrong — corrected below. The real cause: quest-runner interaction
    components had no `key={step.id}`, so React reused the same component instance across two
    consecutive steps of the same kind (exactly `q-w-05`'s first two steps, both text-input),
    leaking the previous step's typed text into the next one. Fixed with a `key` prop on every
    interaction branch.
  - Both required re-reading `src/constants/questJourneys.ts` and `enrichQuestWithJourney`
    closely enough to realize the DB migration's "every quest had zero steps" framing was
    incorrect — a richly-detailed local fallback was always active regardless of the DB state.
    The migration itself is still correctly applied and still matters for `step_progress`
    persistence and profile preferences; only the *step-content* part of that claim is retracted.

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
  **Correction (2026-07-27): this design was right but never actually shipped** — it was built into
  a component nothing in the app renders. See the 2026-07-27 finding above and bug #14 below.
- **Bug #8 ("Leave doesn't save progress") — real cause found, fixed.** Verified live via the
  Supabase REST API that `moveActiveQuestToLater` (what Leave calls) never touches
  `step_progress_v2` — no data is actually lost. The real bug: the "Liked" card a left quest
  reappears on showed no progress indicator and a generic "Start now" button, so a quest with
  steps already done looked exactly like a fresh one. Fixed: Liked cards now show "X/Y steps
  done" and the button switches to "Resume" once progress exists
  (`components/journey/JourneyQuestHub.tsx`).
  **Correction (2026-07-27): same as #14 above — see bug #8 below for the real fix.**
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
  - `quests`: `action_steps`, `journey_intro`, `suggested_group` missing entirely from the DB.
    **Correction (2026-07-27):** this turned out *not* to mean testers saw empty quests — I was
    wrong to claim that originally. `enrichQuestWithJourney` (`src/constants/questJourneys.ts`)
    already falls back to a full, richly-interactive step catalog whenever the DB's
    `action_steps` is empty, and that fallback was always active. The migration still matters
    (it's what makes the DB the real source of truth instead of silently relying on a hardcoded
    fallback forever), but it is **not** the explanation for bug #7 — see the real cause found
    below instead.
  - `user_quests`: `step_progress_v2` **and** legacy `step_progress` both missing → even where
    steps existed, completing one could never persist to the database (silently lost on refresh).
    This part of the finding stands as originally described.
  - **Extra find:** `step_progress_v2` was never in `production_prep.sql`'s column list at all —
    only in `schema.sql`'s `CREATE TABLE IF NOT EXISTS`, which is a no-op on an existing table.
    Fixed in `supabase/production_prep.sql` (added `add column if not exists step_progress_v2`) so
    this doesn't recur on other environments.
  - **Fix applied:** ran `production_prep.sql` (adds missing columns, idempotent) + the
    `action_steps`/`journey_intro`/`suggested_group` backfill block from `seed.sql`, then the one
    added `step_progress_v2` column. All verified end-to-end via direct REST calls (profile
    preference write/read round-trip, quest step content present, step completion + revert
    write/read round-trip) — not just "no error," actually confirmed the data persists correctly.
  - **Not fully closed at the time:** couldn't complete a live UI retest in this session — the
    sandboxed preview browser blocks the app's automatic anonymous sign-in (a tooling/sandbox
    quirk, confirmed via direct API calls that the backend itself works fine). Since then, #6 and
    #7 got real code-level root causes and fixes, and #8/#14/#15 turned out to be one connected
    bug (the paused/liked section was built correctly but never mounted on a real screen) — now
    fixed for real, see the 2026-07-27 finding above. None of this round's bugs are still open;
    all fixes still want a live UI pass once the sandbox sign-in block is resolved.
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
  and the completed-list newest-first sort. "World???" (E) — see the 2026-08-06 fix above; it
  wasn't a Supabase category, it was the Journey catalog's "X quests in this world" count line.

---

## 🐛 Bugs (broken behavior, fix now)

### Critical — blocks the core loop
1. **Sign up doesn't work** — E, D. (For E it "eventually confirmed" → possibly email-confirmation / latency rather than fully dead.) ✅ **Fixed** — see above (plus a possible remaining Supabase dashboard setting to check).
2. **Memory save is broken** — E: looks like the memory didn't save, so the user saves it 10× → then it shows 10×. Related: M: "memories don't propagate on wrap-up." ✅ **Fixed** — both halves, see above.
3. **Timer / stopwatch can't be stopped or reset** — M, D. (D started it by accident and couldn't stop it; M afraid of losing progress.) ✅ **Fixed** — see above.

### High
4. **Edit preferences doesn't work** — E. ✅ **Root cause fixed** — see schema-migration finding above. Preference writes now persist and verified end-to-end via API; UI retest still recommended.
5. ~~Recommended quest disappears after you pick it → leaves a huge empty window~~ — **moved to "To decide" below** (it's a recommendation-behavior design question, not a pure bug — see decision #6 there).
6. **Quest doesn't disappear after completion** (it should) — E, **Mar** (2 testers). ✅ **Real cause found and fixed (2026-07-27).** Traced every status filter and the backend write path and found nothing wrong there (that part of the earlier investigation stands). The actual bug: on the "Every step is done" screen, the secondary exit link was labeled **"Back to journey"** — it does *not* complete the quest, but nothing said so. A tester who read "every step is done" as "I'm finished" and tapped that link (instead of the primary "Complete quest" button) would leave the quest permanently active, with no sign anything was skipped — exactly matching "doesn't disappear after completion." Relabeled to **"Not yet — keep this active"** (`app/quest/run/[id].tsx`), so the two exits are no longer easy to confuse.
7. **Social / message quest**: moves to step 2 but stays on the same screen with the same text — E. ✅ **Real cause found and fixed (2026-07-27).** The earlier "likely fixed by the schema migration" note was wrong — I later found that `enrichQuestWithJourney` already backfills full step content from a local catalog whenever the database's `action_steps` is empty, so quests never actually had zero steps for testers. The real bug: the quest runner's interaction components (`InputStepAction`, `TimerStepAction`, etc.) weren't `key`-ed by step id, so when two consecutive steps share the same interaction kind — exactly the case for `q-w-05` ("Message someone"), whose first two steps are both text-input — React reused the same component instance instead of remounting it, leaking the previous step's typed text (and, for timers, its running state) into the next step. Fixed by adding `key={step.id}` to every interaction branch in `renderInteraction` (`app/quest/run/[id].tsx`).
8. **Leave doesn't save progress** (unlike the back arrow) — E; and **neither back arrow nor Leave returns to home** — D. ✅ **Fixed for real (2026-07-27).** "Returns to home" fixed earlier (see 2026-07-22 above). For "doesn't save progress": verified via live API round-trip that `moveActiveQuestToLater` (what Leave calls) never touches `step_progress_v2` — the data was never actually lost. The **real bug** was that the "Liked" card (where a left quest reappears) showed zero progress indicator and a generic "Start now" button, so a quest with steps already done looked indistinguishable from a fresh one. Built the progress badge + Resume/Begin split, but into `JourneyQuestHub.tsx` — a component that turned out to never be mounted anywhere (see the finding above). Now moved into `components/journey/PausedAndLikedSections.tsx`, rendered on the actual live Journey tab.
9. **Memory crops the image** — T. ✅ **Fixed** — see above.
10. **Tab menu doesn't highlight** the active tab when switching — D. ✅ **Fixed** — see above.
11. **Feedback form**: user doesn't know how to submit + it doesn't disappear after sending — E. ✅ **Fixed** — see above.
12. **Can't go back a step in the quest runner** — from step 2 there is no way back to step 1 — Mar. ✅ **Fixed** — see above ("Back a step").
13. ~~"Likes" may not work + unclear purpose~~ — **moved to "To decide" below** (decision #7 — what liking is even *for* needs settling before the mechanism can be judged working or broken).
14. **After leaving/closing a quest it's hard to find again, and looks different in Journey** — Mar closed a quest, didn't know where it went, later found it via Journey where it looked different from where he'd left it. ✅ **Fixed for real (2026-07-27).** Root cause was that leaving a half-done quest dumped it into the **"Liked"** wishlist bucket (`Leave` → `saved_for_later`), mixing "hearted, never started" with "was 2/3 through it". Designed the split ("Pick up where you left off" above "Liked", same card, Begin/Resume verb) on 2026-07-26, but built it into a component that was never mounted on any real screen (see the finding above) — so this never actually reached Mar or any tester. Now mounted on the real Journey tab via `components/journey/PausedAndLikedSections.tsx`.
15. **Pausing a quest with the stopwatch running "redirects" somewhere, and nothing shows up there** — reported by the mentor (2026-07-27). ✅ **Real cause found and fixed (2026-07-27).** Standa reproduced it precisely: leaving mid-quest showed the correct dialog ("find it in Journey under 'Pick up where you left off'"), but that section didn't exist anywhere he could actually navigate to. Cause: the entire paused/liked-section UI (built for #8 and #14) lived in `components/journey/JourneyQuestHub.tsx`, a component `git grep` confirms was never imported by any screen — the real Journey tab has always rendered a different, plain catalog-browser component instead. Fixed by moving that logic into the live screen and deleting the orphaned component. Not independently live-verified (sandboxed browser still blocks automatic sign-in), but high confidence given the exact match to Standa's own repro and the concrete git-history proof of the orphaned component.

---

## 🔧 Fix now (copy / UX polish)

### Onboarding
- Nature + Adventure pre-selected with no "why" explanation — M. ✅ **Fixed** — categories start empty (prior commit).
- "What are you after right now?" — confusing word order, can't picture anything — M. ✅ **Resolved** — that step (old `focus`) was replaced by the intensity question.
- "How often do you feel isolated?" — too vague (generally vs. recently) — M. ✅ **Resolved** — current copy asks "recently felt isolated".
- Nature-connection scale reads as "how much you *like* nature", not how much time you spend in it — Mar. ✅ **Fixed (2026-07-27)** — reworded to "How much time have you spent in nature lately?" / Rarely ↔ Often.
- "disconnected from people" reads as "don't get *along* with people", not lonely/isolated — Mar. ✅ **Fixed** — reworded to "lonely or isolated".
- "How it works" invites tapping — users try to click the rows even though they aren't interactive — Mar (D noted the same). ✅ **Fixed (2026-07-27)** — those rows used the exact same card chrome (border, radius, background) as the genuinely-tappable option cards two steps later; stripped that to a plain row with a thin bottom divider so it no longer reads as a button.
- Quest frequency not explained with numbers — M. ✅ **Fixed (2026-07-27)** — added a 4th "How it works" row: "Go at your own pace — Up to 3 quests active at once — weekly, monthly, or yearly, whichever fits."
- Compass in the middle of the first-screen image is distracting — T. ✅ **Fixed** — removed the centered compass badge from the welcome hero.
- "How much time do you have" → "how much time do you want to dedicate" — D. ✅ **Fixed**.
- "Your map is ready" → rename to "Almost set"; bottom text too long — D. ✅ **Fixed (2026-07-27)** — headline now "Almost set." (edit mode: "Updated and ready."); footnote was already shortened.
- "What pulls you" duplicates the category selection — T. ✅ **Fixed** — see above (Theme/Time/Intensity reframe).

### Quests / detail
- **Quest length**: daily / weekly / monthly doesn't make sense → reframe as *how much time it takes* — M, E, D, Mar (4 testers). Mar's concrete example: an Adventure "monthly · 720 minutes" quest reads as hopelessly abstract. 🔧 *Duration humanized (720 min → "12 h") — see above. The weekly/monthly/yearly cadence relabel still open (needs product call, tied to limits).*
- The in-quest **"Guide"** tip block is disliked / feels like extra noise — D, Mar. ✅ **Fixed (2026-07-27)** — collapsed by default, with a small chevron to expand; was always-visible italic text pushed above the step's interaction.
- Merge the "book / arrange" step with the calendar step so scheduling is a single action — Mar. ✅ **Fixed (2026-07-27)** — the 3 quests where step 1 books a real slot with a provider (`q-m-05`, `q-m-06`, `q-y-02`) no longer get the auto-inserted "put it on your calendar" step right after — booking with a provider already fixes a date/time, so the second step was pure busywork. Other quests that just say "pick a day" (no external provider) still get the calendar-reminder step, since those genuinely need a separate nudge to commit.
- Wrap-up message looks like an **error** / disliked notification — E, T. ✅ **Fixed** — warmed the completion title + rewrote the error-like calendar copy (browser-native dialog chrome on web is unchanged).
- "I scheduled it" → "let's schedule it" — D. ✅ **Fixed** — the web calendar-step button now reads "Let's schedule it" (the in-dialog confirm stays "I scheduled it" as a past-tense attestation).
- "wrap up quest" unclear → "every step is done" — D. ✅ **Fixed** — see above.
- Progress quest detail: too much text + duplicates the memory → split them, less text — T. ✅ **Fixed (2026-07-27)** — the static "Reflection" prompt block on quest detail now hides once a memory already exists for that quest (the memory itself has the real content; repeating the same generic prompt next to "View memory" was the duplication).
- Sort the activity list by completion time (newest first) — D. ✅ **Already satisfied** — the completed list sorts newest-first (`CompletedShowcase.tsx`). Active list is oldest-started-first by design. *(Correction 2026-07-27: originally also credited `ProgressQuestHub.tsx`, which turned out to be unused dead code — deleted; `CompletedShowcase.tsx` alone was always the real source of this behavior.)*
- "World???" as a category name is confusing — E. ✅ **Found and fixed (2026-08-06)** — not a Supabase category after all (the DB's 4 categories are Nature/Adventure/Social/Relax, confirmed live via an authenticated REST query). The real source: the Journey tab's category-catalog count line read "X quests **in this world**" (`components/journey/AllQuestsList.tsx`) — the app's map/world metaphor, but out of context next to a category picker it reads exactly like a nonsense label. Changed to "X quests in this category".
- Progress tab icon disliked — T. ✅ **Fixed (2026-07-27)** — swapped the FontAwesome "user" (reads as Profile/Account) for "trophy", matching the tab's actual content (a showcase of completed quests).

### Explore map
- Question marks → prefer icons, smaller / cleaner — T, D. ✅ **Fixed (2026-07-27)** — unrevealed map markers no longer show a large "?" glyph; replaced with a small `sparkles-outline` icon, keeping the tiny category-accent badge in the corner.
- "Likes" are confusing — what they mean, why they exist, and whether they even work — E, Mar. (See bug #13.)

### Memory
- Remove the character limit — T. ✅ **Already satisfied** — no `maxLength` exists anywhere in the memory forms; could not reproduce in code, likely fixed in an earlier pass.
- **Communicate the photo up front** and **don't make it mandatory** at the end — T (raised twice). ✅ **Fixed** — quest detail now shows a small camera hint ("This one usually ends with a photo...") before you begin, when `quest.suggestedProofType === 'photo'`. Photo was already optional at save time (`app/quest/[id].tsx`).
- Let the user add a note directly without an edit step — T. ✅ **Fixed** — when the quest runner auto-creates a memory with no real evidence (only confirm/timer steps, so the body is just the generic placeholder), "View memory" now opens straight into editing instead of a read-only screen you'd have to tap Edit on first.
- Add a big, clear **green "Done"** state in Memories after finishing — Mar. ✅ **Fixed** — a green "Saved to your memories" banner now shows on arrival, for both manual saves (`memory/new.tsx`) and quest auto-saves.
- After finishing, don't strand the user on the memory page that shows **Delete**; make it easy to exit — Mar (reinforces T's wrap → memory → progress confusion). ✅ **Fixed** — a prominent "Done" button (→ Memories tab) now appears above the Edit/Delete row whenever you've just landed here from a save, so the obvious next action isn't a destructive one.

### Notifications (new, from mentor decision #3)
- Build a real **notification-intensity setting** the user controls, rather than picking a
  single app-wide stance on nudges. Resolves the M-vs-D contradiction on pressure/nudges without
  compromising the default "quiet companion" experience for people who never touch it.

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
- Duolingo-style visual overview / progress screen — D, T. 🔸 On hold alongside decision #4 (gamification) — Duolingo's visual language is inseparable from its streak/points system, so this waits on the same philosophy question.
- Guide / avatar in the app — D.
- Link to the phone's focus mode — D.
- Multiple-choice on "what do you want more of" — D.
- 3-month re-ask of the onboarding question (`tasks.md` #1).

### Monetization signal
- Nobody would pay for the app directly, but **via ads / a free month** E, D, and T would try it.
  ✅ **Decided (mentor, 2026-07-27): ads are out** — conflicts with the product's own philosophy
  (the "quiet companion, zero pressure" positioning). Monetization as a whole can wait — not
  urgent, revisit later.

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
3. ~~Notifications / pressure~~ — M wants a "you're not completing this quest" nudge;
   **D wants zero pressure, a quiet companion.** ✅ **Decided (mentor, 2026-07-27):** don't pick a
   side — let the person set how much the app "bothers" them via a real notification-intensity
   setting. Solves both without compromising the "quiet companion" default for people who never
   touch the setting. **Not built yet** — added to the Part 2 plan below.
4. **Gamification — levels, bonus points, stars** — Mar wants quests to carry levels / bonus
   points, and a **star** for completing a bonus "side-quest within a quest" (framed like "win the
   fight, don't lose a life"). `AGENTS.md` explicitly bans points, levels, and complex
   gamification. 🔸 **Mentor lean (2026-07-27), not a hard decision:** shelve this — "for now,
   maybe forever" — pending whether any gamification fits the product's philosophy at all. Already
   recurred once (Mar); per the ambiguity-handling rule, revisit only if it comes up independently
   again rather than acting on this alone.
5. **Category structure — merge Nature + Adventure? rework/remove Relax?** — Mar: Nature and
   Adventure feel very similar ("big difference? can they be merged?"); Relax — especially
   "do-nothing" activities — competes with digital-wellbeing apps and may not fit. Affects the
   4-category model and the Explore map. (Relates to resolved decision #1 above.) ✅ **Decided
   (mentor, 2026-07-27):** don't rework quests or merge categories now — wait for real usage data
   on how people actually interact with the categories before deciding anything structural.
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
8. ~~What should "leaving/closing a quest" actually leave behind?~~ ✅ **Decided (2026-07-26),
   actually built and shipped (2026-07-27)** — the first build lived in a component the app never
   rendered (see bug #14/#15). Decision: a left quest's resting place depends on whether it has
   progress — quests with steps done go to a dedicated **"Pick up where you left off"** section,
   quests with none stay in **"Liked"** (pure wishlist). One card identity across both; only the
   action verb changes (Begin / Resume). Derived from step progress, so no schema change.

---

## Notable strategic remarks
- Content **quantity is extremely important** — M.
- Would need "crazy shit" / a stronger hook to actually keep using it — M.
- Target audience: not for everyone (M is not the target).
- Should be a **quiet companion, zero pressure** — D.
- Martin's pre-open mental model was **game-like and social** (NPC quest-givers, user-submitted
  quests, co-op) — informs the community decision above — Mar.

## Mentor review (2026-07-27)
The user's mentor reviewed this document and this round's fixes. His calls are folded into the
relevant sections above (decisions #3, #4, #5; the monetization note; bug #15). Two standing
notes from that review:
- **Design work is confirmed tracked** in [`tasks.md`](../../tasks.md) — #6 (color palette),
  #7 (branding/voice), #8 (Explore map art) — all deliberately deferred to post-MVP, not dropped.
- Ambiguous or philosophically-open mentor guidance (like decision #4) is logged as a *leaning*,
  not forced into an immediate roadmap change — see the memory note on handling this
  (`feedback-mentor-ambiguity-handling`), so a recurring theme doesn't get lost but a single
  mention also doesn't overturn the roadmap.
