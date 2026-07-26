# AGENTS.md — Side Quest Life

**Audience:** AI assistants (e.g. Cursor) working in this repository. Read this before substantive edits so behavior and product boundaries stay aligned. Humans may skim; day-to-day setup lives in `README.md`.

---

## Product vision

Side Quest Life helps people step out of routine using **small and large real-world “side quests”**—not abstract goals, but things you can actually do today. The intended loop is:

**Action → Experience → Log → Visual progress → Identity**

The app should connect technology with **real life, nature, new experiences**, and **slow dopamine** (meaningful payoff over time). It must **not** behave like an aggressive habit tracker or hollow gamification wrapper.

---

## Positioning (anchor)

Use this line when judging copy, features, and tone:

> *An app that gently pulls you out of routine and turns it into a map of a life you actually lived.*

Repository language is **English** unless the user explicitly asks for another locale.

---

## Design principles

- **Minimal friction:** Completing a quest and logging a memory should take **few taps**.
- **Memory logging is core:** Treat journaling (text + optional photo) as a first-class flow, not an afterthought.
- **Quests must be concrete and short:** Real-world executable, no vague “be mindful” filler. When writing quest content, follow **`docs/quest-content-guidelines.md`** (rule #1: quests are about *doing*, never *abstaining* — no "don't use your phone" restriction quests).
- **Calm, grounded UI:** Earth/neutral palette and restrained typography—see `constants/Theme.ts` before changing colors or adding loud UI patterns.
- **Journey tab visuals & motion:** Follow **`docs/journey-visual-style.md`** (path spine, markers, artifacts, taps, Reanimated tone). Do not drift Journey toward generic gamified UI without updating that doc intentionally.
- **Progress tab list UI:** Reuses the **hub discover** chrome shared with the Journey catalog hub (`components/journey/journeyHubStyles.ts`, `components/progress/ProgressQuestHub.tsx`) — not the Journey world canvas. Keep list styling aligned with that pattern.
- **No aggressive reward loops:** Avoid streak pressure, endless notifications, or instant-reward psychology dressed as “wellness.”

---

## What not to build

Unless the product owner explicitly changes direction, **do not** add:

- Social feeds, profiles of other users, sharing to a public timeline, or multiplayer mechanics
- Complex gamification (leaderboards, loot, seasons, battle passes)
- Coins, points, levels, or other addictive progression currencies
- Patterns that mimic **aggressive habit trackers** (guilt copy, unbroken streak worship, punitive “you broke your streak” messaging)

Keep the **MVP scope narrow**; prefer removing or deferring scope over cramming features.

---

## Architecture rules

**Stack (do not swap without explicit approval):**

- **React Native** + **Expo** (SDK ~54) + **TypeScript**
- **Expo Router** — file-based routes under `app/`
- **Zustand** — lightweight client state (e.g. session, cached quest picks for home)
- **Supabase** — Auth, Postgres, Storage (private bucket for memory photos)

**Where things live:**

| Area | Responsibility |
|------|----------------|
| `app/` | Screens, route groups `(tabs)`, `(auth)`, dynamic routes `quest/[id]`, `memory/new`, `memory/[id]` |
| `lib/` | Supabase client (`lib/supabase.ts`), period keys (`lib/period.ts`), quest loading/completion (`lib/questData.ts`), onboarding key (`lib/onboarding.ts`) |
| `stores/` | Zustand stores (`session`, `quests`) |
| `types/` | Hand-written types aligned with DB rows (`types/database.ts`) |
| `supabase/` | `schema.sql` (tables, RLS, storage policies), `seed.sql` (example quests) |
| `components/` | Shared UI; do not hide business rules here—keep data access in `lib/` or screens |

**Data flow:** UI calls **plain functions** in `lib/` and Supabase client methods. **Do not** duplicate query logic across many screens—extract to `lib/` when the second caller appears.

**Backend shape:** Tables `quests`, `user_quests`, `memories`; Storage bucket `memory-photos` with user-scoped paths. Respect **RLS**—queries must assume per-user rows only.

---

## Coding rules

- **TypeScript** with **strict** settings (match `tsconfig.json`).
- Use **`@/`** path imports consistently with existing files.
- **Environment:** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; also surfaced via `app.config.ts` `extra` for `expo-constants`. Never commit real secrets.
- **Auth session:** Persisted with AsyncStorage via Supabase client config in `lib/supabase.ts`.
- **New features:** Prefer a small store slice or a `lib/` module over a new global pattern.
- **UI changes:** Read `constants/Theme.ts` first; keep spacing and tone consistent with existing screens.

---

## Agent checklist (before you finish a change)

- [ ] Does this respect **what not to build** and **design principles**?
- [ ] If touching data: tables and bucket names match `supabase/schema.sql`; queries are **user-scoped** under RLS.
- [ ] If touching UI: colors/spacing align with `constants/Theme.ts`.
- [ ] Run `npx tsc --noEmit` (or the project’s typecheck) after non-trivial edits.

For human-facing run instructions, see **`README.md`**.
