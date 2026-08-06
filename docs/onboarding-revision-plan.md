# Onboarding revision plan

**Status (2026-08-06): §1, §2, and §4 are done.** Only §3's history-vs-overwrite question remains
open — see the note inline below.

Current onboarding is 7 steps: welcome → how it works → categories → pace →
intensity → baseline scales → summary (`app/onboarding.tsx`). Answers are stored
as `OnboardingPreferences` (`categories`, `intensity`, `pace`, plus the
`natureConnection`/`isolation` baseline scales) and only ever used to *score*
quest recommendations (`recommendQuestsForPreferences`,
`recommendQuestsInCategory`) — nothing in the app restricts access based on
them. That fact isn't communicated anywhere in the UI right now.

> Note: the old step-4 `focus` question (comfort_zone/calm/connection/wonder)
> was retired in the 2026-07-22 pass — three of its four options just re-picked a
> category already chosen in step 2. It was replaced by an **intensity** question
> (Gentle/Balanced/Bold), so the three onboarding "knobs" are now orthogonal:
> Theme (categories) / Time (pace) / Intensity. See
> `docs/feedback/round-1-synthesis.md`.

## What this revision needs to add

### 1. ✅ Done — Copy: "these are just recommendations, you still have access to everything"
- Onboarding's summary step footnote: "Just a starting point — every quest stays open, and you
  can update your answers anytime." (`app/onboarding.tsx`)
- Explore's recommended section: "Based on your answers — every quest is still yours to try."
  (`components/explore/ExploreQuestPanel.tsx`)

### 2. ✅ Done — Copy: "you can change these answers later"
- Same footnote as §1 covers both messages in one line.

### 3. ✅ Done (edit entry point + reopen flow) — 🔍 history-vs-overwrite still unresolved
- "Edit preferences" is a real, non-admin-gated entry point on the Progress tab's account card,
  reopening the categories/pace/intensity/baseline steps without replaying welcome/how-it-works,
  and without touching quest/memory history.
- **Still open:** answers are overwritten in place, not versioned. The 3-month re-ask banner
  (built 2026-08-06, `components/progress/BaselineReaskBanner.tsx`) nudges a re-answer but the
  *previous* nature-connection/isolation values are lost on save — so "compare baseline vs. 3
  months later" (backlog #1's actual ask, including the marketing-aggregate use case) isn't
  possible yet. Needs a real decision: keep a small history table, or accept overwrite-only and
  drop the comparison ask.

### 4. ✅ Done — New questions: loneliness / disconnection from nature
- Both scales exist in onboarding step 5 (`natureConnection`, `isolation` on
  `OnboardingPreferences`), feeding the 3-month re-ask above. They currently do **not** affect
  recommendation scoring — pure baseline metrics, per the "purely a baseline metric" option this
  plan called out as an open question.

## Suggested step order once all of this lands

0. Welcome
1. How it works
2. Categories
3. Pace
4. Intensity
5. **New:** nature connection + isolation scale(s)
6. Summary — recommended quests + "just a starting point, always editable"
   copy

## Open decisions

- **Overwrite vs. version onboarding answers (ties to backlog #1) — still unresolved,** the one
  real gap left in this plan. Everything else below is settled/built.
- ~~Do the new nature/isolation questions feed recommendation scoring at all, or are they purely a
  baseline metric?~~ Decided by how it was built: purely a baseline metric, no scoring impact.
- ~~Exact wording/placement of the "still have access to everything" and "editable later"
  copy~~ — done, see §1/§2 above.
