# Stage 6 Validation Note

## Why this stage exists

Stage 6 adds minimum instrumentation so we can learn whether Side Quest Life is creating real value in early user testing.

This stage intentionally avoids major product expansion and focuses on:

- core event measurement
- retention groundwork
- clear validation queries
- lightweight qualitative feedback

## Key hypotheses

1. Users will activate at least one quest in their first session.
2. Users will complete at least one quest in their first week.
3. Users will create memories for completed quests.
4. Memory logging increases return behavior.

## Success metrics

- onboarding completion rate
- quest activation rate
- quest completion rate
- memory creation rate
- D2 return rate
- D7 return rate

## How to evaluate first user tests

1. Run `supabase/schema.sql` (includes `analytics_events` table and policies).
2. Ask test users to use the app naturally for 7+ days.
3. Run `supabase/validation_queries.sql` after data accumulates.
4. Review qualitative feedback (`quest_feedback_submitted` event properties).
5. Decide based on signal quality:
   - If activation is low, simplify quest discovery and first-action flow.
   - If completion is low, reduce friction in quest detail and completion path.
   - If memory creation is low, simplify memory capture after completion.
   - If D2/D7 are low, improve meaningfulness of first quest and memory prompts.

## Event source of truth

All Stage 6 event names and tracking entry points are centralized in:

- `src/constants/validation.ts`
- `src/lib/analytics/index.ts`

This keeps provider swapping and experiment expansion low-risk later.
