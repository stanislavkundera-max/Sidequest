# Onboarding revision plan (plan only — not yet implemented)

Current onboarding is 6 steps: welcome → how it works → categories → pace →
focus → summary (`app/onboarding.tsx`). Answers are stored as
`OnboardingPreferences` (`categories`, `intensity`, `pace`, `focus`) and only
ever used to *score* quest recommendations (`recommendQuestsForPreferences`,
`recommendQuestsInCategory`) — nothing in the app restricts access based on
them. That fact isn't communicated anywhere in the UI right now.

## What this revision needs to add

### 1. Copy: "these are just recommendations, you still have access to everything"
- Where: the **summary step** (step 5, "Your map is ready") is the natural
  spot — it's already showing the recommended quests, so a line right there
  ("These are just a starting point — every quest in Journey is open to
  you") lands at the moment it's most relevant.
- Possibly reinforce lightly on the **Explore** recommendation card too
  (small caption under "Recommended for you"), since that's the other place
  the recommendation logic is visible.

### 2. Copy: "you can change these answers later"
- Same summary step is the right spot to set the expectation before they
  even finish.
- Needs a real feature to point to (see §3) — don't promise it without the
  entry point existing.

### 3. Feature: let any user (not just admin) edit their answers later
- Right now only the **admin account** can redo onboarding
  (`resetOnboardingComplete` + `/onboarding`), gated by `isAdminEmail`.
- Plan: add a non-destructive "Edit preferences" entry point for everyone —
  likely from the Progress tab's account area — that reopens the
  categories/pace/focus steps (steps 2–4) without replaying welcome/how-it-
  works, and without wiping quest/memory history the way the admin
  "Delete all progress" does.
- Data model question to settle at implementation time: overwrite in place,
  or keep a history (baseline vs. latest)? Backlog item #1 (3-month re-ask)
  already wants historical answers for progress comparison — these two
  should share one design instead of building answer-versioning twice.

### 4. New questions: loneliness / disconnection from nature
- Add to the existing question set (not replacing categories/pace/focus):
  - How connected do you feel to nature right now? (scale)
  - How often do you feel isolated / disconnected from people? (scale)
- These map to the value-proposition outcomes (`docs/value-proposition.md`)
  — peace/aliveness (nature) and social relationships (isolation) — so they
  double as a baseline for measuring whether the app actually moves those
  numbers over time, not just a recommendation input.
- Needs: new fields on `OnboardingPreferences` (or a separate
  `OnboardingBaseline` type, if these are meant for the 3-month re-ask
  comparison rather than recommendation scoring), plus a new step in the
  flow and a Supabase column pair (or a small history table if we go with
  the "keep history" answer from §3).

## Suggested step order once all of this lands

0. Welcome
1. How it works
2. Categories
3. Pace
4. Focus
5. **New:** nature connection + isolation scale(s)
6. Summary — recommended quests + "just a starting point, always editable"
   copy

## Open decisions before building (revisit when there's time to start)

- Overwrite vs. version onboarding answers (ties to backlog #1).
- Do the new nature/isolation questions feed recommendation scoring at all,
  or are they purely a baseline metric?
- Exact wording/placement of the "still have access to everything" and
  "editable later" copy — draft once this moves from plan to build.
