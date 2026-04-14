# Small Real-User Testing Checklist (5-15 users)

Use this before inviting external testers.

## 1) Backend and config readiness

- [ ] Run `supabase/schema.sql`
- [ ] Run `supabase/seed.sql`
- [ ] Run `supabase/production_prep.sql`
- [ ] Confirm `.env` has valid:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Restart Expo after env updates

## 2) Build and device readiness

- [ ] `npm install`
- [ ] `npm run typecheck`
- [ ] `npx expo start --tunnel` for real device access
- [ ] Verify opening on at least:
  - one iOS device (Expo Go)
  - one Android device (Expo Go)

## 3) Core flow smoke tests

Run each as a real user:

- [ ] Auth: sign up / sign in
- [ ] Onboarding: complete once and verify it does not reappear unexpectedly
- [ ] Quest activation: activate at least one weekly quest
- [ ] Quest completion: complete an active quest
- [ ] Memory creation: add text memory (and optional photo)
- [ ] Memory timeline: open memories tab and memory detail

## 4) Analytics checks

Run in Supabase SQL editor:

```sql
select event_name, count(*) as c
from public.analytics_events
group by event_name
order by c desc;
```

Expected core events include:

- `app_opened`
- `home_viewed`
- `onboarding_started`
- `onboarding_completed`
- `quest_list_viewed`
- `quest_activated`
- `quest_completed`
- `memory_created`
- `memories_timeline_viewed`

## 5) Stability checks

- [ ] No unhandled crash during full core flow
- [ ] Errors, if any, are visible and recoverable
- [ ] Console logs include `[app-error]` entries with context for troubleshooting

## 6) Pilot instructions for testers

- Ask users to complete at least 1 quest and create at least 1 memory in the first week.
- Ask users to return on day 2 and day 7 if possible.
- Use in-app quest feedback prompt after completion for qualitative insight.
