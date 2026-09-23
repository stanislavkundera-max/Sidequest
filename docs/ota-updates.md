# Shipping without a build (EAS Update)

Set up 2026-09-23 (R2-30). **It only starts working from the next build onwards** — an app already
installed from versionCode 10 has no update client in it and will keep getting changes the old way,
through Play.

## Why

A JavaScript-only change — copy, screens, logic, images — used to need a full build and a Play
review that Google states can take up to seven days. That made reacting to closed-test feedback
within the test impossible. An update lands on testers' phones in minutes and never goes near Google.

## Sending one

```bash
npx eas-cli update --branch production --message "what changed"
```

`--branch production` matches the `channel` on the production build profile (`eas.json`); the
`preview` and `development` profiles have their own. Testers get it on the next app launch: the
update downloads in the background and is applied when they next open the app.

## What still needs a full build

`runtimeVersion` is set to the **fingerprint** policy, computed from the native project. An update
whose fingerprint does not match the installed app is never delivered to it — which is the point:

- a new native library (`expo-file-system`, `expo-notifications`, …)
- the app icon or the splash screen
- anything in `app.config.ts` that lands in the native project

Change one of those and the update is simply ignored by older builds; you ship a new build instead.
That is deliberate. With a version-based policy the same update would be delivered and crash on
launch, and the person would just see the app die.

**Assets do ship in updates.** New images inside the app (category art, illustrations) go over the
air; only the icon and splash are native.

## What this does not change

- **Quest content lives in Supabase**, not in the bundle. Editing quest text needs the generated SQL
  run against the project — no app update at all, neither OTA nor build.
- Play's closed-test clock is unaffected either way: it counts testers opted in, not releases.

## Order of operations for the next release

1. Land the JS changes on `main`.
2. If anything native changed → `eas build` → upload to Play, and the update is carried in it.
3. If not → `eas update --branch production` and it is with testers in minutes.
