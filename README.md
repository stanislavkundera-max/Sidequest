# Side Quest Life

**Side Quest Life** is a mobile app (React Native / Expo) that nudges you out of routine with **real-world side quests**—small, concrete challenges in nature, adventure, and social connection—and lets you **log memories** (text + optional photo) so progress feels like a map of a life you actually lived, not a grind.

**One-line pitch:** *An app that gently pulls you out of routine and turns it into a map of a life you actually lived.*

**Stack:** Expo SDK ~54, TypeScript, Expo Router, Zustand, Supabase (Auth, Postgres, Storage). See `package.json` for exact dependencies.

**AI / Cursor context:** If you use an AI assistant in this repo, point it at [`AGENTS.md`](./AGENTS.md) for product boundaries and architecture rules.

---

## Setup

1. **Prerequisites:** [Node.js](https://nodejs.org/) (LTS recommended), npm, and a Supabase project when you wire the backend.
2. **Install dependencies** (from the project root):

   ```bash
   npm install
   ```

3. **Environment:** Copy `.env.example` to `.env` and set:

   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

   Restart the Expo dev server after changing env vars.

4. **Run the app:**

   ```bash
   npx expo start
   ```

   Then open in Expo Go, iOS Simulator, Android emulator, or web as you prefer.

5. **Supabase:** Create a project, run `supabase/schema.sql` then `supabase/seed.sql`, and set `.env` — see **[`supabase/README.md`](./supabase/README.md)** for the full checklist. Auth supports email/password and anonymous start (if enabled in Supabase).
6. **Production prep for pilot users:** run `supabase/production_prep.sql` to normalize legacy schema differences and ensure analytics table/indexes/policies are present.

7. **Typecheck (optional):** `npm run typecheck`
8. **Local E2E journeys + bug reports (optional):**
   - Runbook: [`docs/testing/local-e2e-runbook.md`](./docs/testing/local-e2e-runbook.md)
   - Combined smoke: `npm run e2e:smoke`
   - Combined full run: `npm run e2e:all`

---

## Folder structure

```text
app/                 # Expo Router screens and layouts
  (auth)/            # Sign-in (email/password)
  (tabs)/            # Main tabs: Today, Memories, Progress
  quest/[id].tsx     # Quest detail + complete
  memory/new.tsx     # Create memory (modal)
  memory/[id].tsx    # Memory detail
  onboarding.tsx
  index.tsx          # Entry redirect (onboarding → auth → tabs)
lib/                 # Supabase client, period keys, quest helpers, onboarding key
src/repositories/    # Supabase data access layers (profiles, quests, user quests, memories, photos)
stores/              # Zustand (session, quest cache for home)
types/               # TypeScript types for DB-shaped data
constants/           # Theme and shared UI tokens
components/          # Shared UI (Expo template leftovers + shared pieces)
supabase/            # schema.sql, seed.sql, README.md (dashboard wiring checklist)
assets/              # Images, fonts
app.config.ts        # Expo config + extra env for Supabase
tsconfig.json
```

---

## MVP features (current scope)

- **Onboarding** — stored in `profiles` (`onboarding_completed`, `intensity_preference`, `preferred_categories`)
- **Auth** — Supabase auth (email/password, plus optional anonymous start)
- **Quest catalog** — loaded from Supabase `categories` + `quests`
- **Quest progression** — activation/completion stored in `user_quests` with active limits enforced
- **Memories** — timeline from `memory_entries`, reverse chronological, optional photo upload to Supabase Storage
- **Persistence** — quests, memories, and onboarding survive app restarts and sessions

**Quest categories:** Nature, Adventure, Social, Relax.

---

## Current status (Stage 5)

- Core flow is stable: startup -> auth -> onboarding -> quests -> memories -> progress.
- Main async screens include explicit loading, empty, and error states.
- Quest limits are enforced in UI and data layer (3 weekly / 2 monthly / 1 yearly).
- Memory creation handles optional photo upload with pending feedback and graceful failures.
- Deep-link and missing-data paths fail safely with user-facing fallback screens.

## Known limitations

- No offline mode yet (network is required for reliable persistence).
- Photo URLs are signed and may eventually need refresh/renewal handling for long-lived archives.
- Error telemetry is basic (user-facing messages exist; centralized logging is still minimal).

## Major user flows implemented

- Sign in/sign up (and optional anonymous start when enabled in Supabase)
- Onboarding persistence in `profiles`
- Quest browse/activate/complete with limits
- Memory timeline + detail
- Memory creation with optional photo upload to Supabase Storage
- Progress overview and persisted state after app restart

## Stage 6 focus (next)
- validation layer: centralized analytics, event log, retention groundwork
- feature flag groundwork for small future experiments
- lightweight in-app qualitative feedback capture

## Stage 6 validation layer

Stage 6 adds the minimum instrumentation to test product value with real users, without expanding core product scope.

### Analytics configuration

- Central tracking API lives in `src/lib/analytics/index.ts`.
- Event names are centralized in `src/constants/validation.ts`.
- Current providers:
  - console logger (always on)
  - Supabase event log (`analytics_events` table) when env config is valid
- Core interface:
  - `identifyUser(userId, traits?)`
  - `trackEvent(name, properties?)`
  - `resetAnalytics()`

### Events tracked

- Onboarding:
  - `onboarding_started`
  - `onboarding_completed`
  - `onboarding_skipped`
  - `category_preferences_selected`
  - `intensity_selected`
- Quest discovery/activation:
  - `quest_list_viewed`
  - `quest_detail_viewed`
  - `quest_activated`
  - `quest_activation_failed_limit_reached`
- Quest completion:
  - `quest_completed`
  - `quest_completion_abandoned`
- Memories:
  - `memory_creation_started`
  - `memory_created`
  - `memory_creation_failed`
  - `memory_viewed`
  - `memories_timeline_viewed`
- Engagement:
  - `app_opened`
  - `home_viewed`
  - `profile_viewed`
- Validation:
  - `returned_day_2`
  - `returned_day_7`
- Qualitative:
  - `quest_feedback_submitted`

### Validation metrics and queries

- SQL groundwork is in `supabase/validation_queries.sql`.
- Metrics supported:
  - onboarding completion rate
  - users with at least one quest activation
  - users with at least one quest completion
  - users with at least one memory
  - average active quests by timeframe
  - D2 return rate
  - D7 return rate

### Product questions this stage answers

- Do users take action in the first session (activate quests)?
- Do users complete quests in the first week?
- Do users log memories after quest completion?
- Does memory logging correlate with return behavior (D2/D7)?

## Small real-user testing readiness

- Checklist: `docs/real-user-testing-checklist.md`
- Device run mode: `npx expo start --tunnel`
- Required backend baseline:
  - `supabase/schema.sql`
  - `supabase/seed.sql`
  - `supabase/production_prep.sql`

---

## License

Private project unless you add a license file later.
