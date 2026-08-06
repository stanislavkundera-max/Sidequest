# Onboarding revision plan

**Status (2026-08-06): all 4 sections done.** Nothing open in this plan anymore.

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

### 3. ✅ Done — edit entry point + reopen flow, and the overwrite-vs-history question
- "Edit preferences" is a real, non-admin-gated entry point on the Progress tab's account card,
  reopening the categories/pace/intensity/baseline steps without replaying welcome/how-it-works,
  and without touching quest/memory history.
- **Overwrite-vs-history, resolved (Standa, 2026-08-06):** a full history table only means
  something once users have actually been on the app for months — nothing to version before
  then. Instead: `nature_connection_baseline`/`isolation_baseline` capture the user's *first-ever*
  answer once and are never overwritten, while `nature_connection`/`isolation` keep updating as
  before on every edit/re-ask. A later comparison ("baseline vs. now", including the
  marketing-aggregate use case from backlog #1) reads both pairs — no history table needed.

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

All resolved — see §1–4 above for how each landed.
