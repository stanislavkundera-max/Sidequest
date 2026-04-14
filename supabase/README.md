# Supabase setup (Stage 4)

Run these steps in the [Supabase dashboard](https://supabase.com/dashboard).

## 1) Create project

1. Create/open a Supabase project.
2. Wait until the database is ready.

## 2) Auth configuration

1. Authentication -> Providers -> Email: enable Email.
2. Optional guest-friendly mode: enable Anonymous sign-ins if you want silent guest start.
3. For fast development, disable email confirmation, or keep it on for stricter flow.

The app supports real authenticated users and ensures `profiles` rows are created on first auth session.

## 3) Database schema + seed

1. SQL Editor -> new query -> run `schema.sql`.
2. SQL Editor -> new query -> run `seed.sql`.
3. SQL Editor -> new query -> run `production_prep.sql` (normalizes legacy table naming and ensures analytics events infra for pilot testing).

`schema.sql` creates:
- `profiles`
- `categories`
- `quests`
- `user_quests`
- `memory_entries`
- `future_goals` (future-ready, optional)
- RLS policies
- storage bucket `quest-memory-photos`

## 4) Environment variables

1. Project Settings -> API.
2. Copy Project URL and anon public key.
3. Create `.env` from `.env.example`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

4. Restart Expo after env changes.

## 5) Storage bucket check

Bucket expected by app: `quest-memory-photos` (private).

The app uploads to `{user_id}/{filename}` and stores signed URLs in `memory_entries.photo_url` (and optional `user_quests.photo_url` when used).

## 6) Smoke test

1. Start app, sign in (or anonymous if enabled).
2. Complete onboarding, restart app, confirm onboarding persists.
3. Open quest browser, activate quests, verify timeframe limits (3 weekly / 2 monthly / 1 yearly).
4. Complete a quest.
5. Create a memory with optional photo.
6. Restart app and verify quest state + memories are still present.
