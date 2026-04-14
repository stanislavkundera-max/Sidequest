# Native E2E Flows (Maestro)

Flow files in `tests/e2e/native/flows` cover bootstrap, auth/onboarding entry points, tabs, quest, memory, and fallback states.

Run via npm scripts:

- `npm run e2e:native`
- `npm run e2e:native:smoke`

Required env:

- `E2E_APP_ID` (for Expo Go commonly `host.exp.Exponent`)

Output:

- `test-results/maestro/results.xml`
