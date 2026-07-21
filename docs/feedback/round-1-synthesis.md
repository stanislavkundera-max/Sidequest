# Usability Feedback — Round 1 Synthesis

Moderated usability sessions, 4 testers: **Mára (M)**, **Evka (E)**, **Dejv (D)**, **Terka (T)**.
Method: [`docs/moderated-usability-session-guide.md`](../moderated-usability-session-guide.md).

Items are tagged with the testers who raised them. Where multiple testers agree, that is
the strongest prioritization signal and is called out inline.

**NPS:** E 7 · D 6–7 · T 6 · M — no number ("not the target audience").

---

## ✅ Fixed this session (2026-07-21)

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

---

## 🐛 Bugs (broken behavior, fix now)

### Critical — blocks the core loop
1. **Sign up doesn't work** — E, D. (For E it "eventually confirmed" → possibly email-confirmation / latency rather than fully dead.)
2. **Memory save is broken** — E: looks like the memory didn't save, so the user saves it 10× → then it shows 10×. Related: M: "memories don't propagate on wrap-up." ✅ *M's half fixed above; E's "10× on web" half still open — likely missing `alertCompat` in `memory/new.tsx`.*
3. **Timer / stopwatch can't be stopped or reset** — M, D. (D started it by accident and couldn't stop it; M afraid of losing progress.) ✅ **Fixed** — see above.

### High
4. **Edit preferences doesn't work** — E.
5. **Recommended quest disappears after you pick it → leaves a huge empty window** — E.
6. **Quest doesn't disappear after completion** (it should) — E.
7. **Social / message quest**: moves to step 2 but stays on the same screen with the same text — E.
8. **Leave doesn't save progress** (unlike the back arrow) — E; and **neither back arrow nor Leave returns to home** — D. 🔧 *"Returns to home" half fixed above; "doesn't save progress" half still open.*
9. **Memory crops the image** — T. ✅ **Fixed** — see above.
10. **Tab menu doesn't highlight** the active tab when switching — D. ✅ **Fixed** — see above.
11. **Feedback form**: user doesn't know how to submit + it doesn't disappear after sending — E. ✅ **Fixed** — see above.

---

## 🔧 Fix now (copy / UX polish)

### Onboarding
- Nature + Adventure pre-selected with no "why" explanation — M.
- "What are you after right now?" — confusing word order, can't picture anything — M.
- "How often do you feel isolated?" — too vague (generally vs. recently) — M.
- Quest frequency not explained with numbers — M.
- Compass in the middle of the first-screen image is distracting — T.
- "How much time do you have" → "how much time do you want to dedicate" — D.
- "Your map is ready" → rename to "Almost set"; bottom text too long — D.
- "What pulls you" duplicates the category selection — T.

### Quests / detail
- **Quest length**: daily / weekly / monthly doesn't make sense → reframe as *how much time it takes* — M, E, D (3 testers).
- Wrap-up message looks like an **error** / disliked notification — E, T.
- "I scheduled it" → "let's schedule it" — D. *(still open)*
- "wrap up quest" unclear → "every step is done" — D. ✅ **Fixed** — see above.
- Progress quest detail: too much text + duplicates the memory → split them, less text — T.
- Sort the activity list by completion time (newest first) — D.
- "World???" as a category name is confusing — E.
- Progress tab icon disliked — T.

### Explore map
- Question marks → prefer icons, smaller / cleaner — T, D.
- "Likes" are confusing (what do they mean) — E.

### Memory
- Remove the character limit — T.
- **Communicate the photo up front** and **don't make it mandatory** at the end — T (raised twice).
- Let the user add a note directly without an edit step — T.

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

## ⚠️ To decide — recorded only, not resolved

These are either contradictory between testers or conflict with `AGENTS.md`. Logged for a
later product call; no decision made yet.

1. **Community / sharing / do a quest with someone / leaderboard** — requested by M and T.
   But [`AGENTS.md`](../../AGENTS.md) explicitly lists social feeds, multiplayer, and
   leaderboards under **"What not to build."** → Direction change, not an automatic yes.
2. **Scrollable / movable map** — M and E want it (path upward, completed steps visible);
   **T has no need to scroll.** Contradictory.
3. **Notifications / pressure** — M wants a "you're not completing this quest" nudge;
   **D wants zero pressure, a quiet companion.** Contradictory, and touches product identity.

---

## Notable strategic remarks
- Content **quantity is extremely important** — M.
- Would need "crazy shit" / a stronger hook to actually keep using it — M.
- Target audience: not for everyone (M is not the target).
- Should be a **quiet companion, zero pressure** — D.
