# Local E2E Journey Tests Runbook

This runbook executes all core user journeys locally and generates a Markdown bug report.

## Coverage

- Bootstrap and route gating (`/` -> auth/onboarding/tabs)
- Auth screen validation and mode switching
- Onboarding progression
- Tabs navigation (Home, Memories, Progress)
- Quest selection/activation entry points
- Memory creation entry points
- Empty/fallback state entry points

## Prerequisites

- Dependencies installed: `npm install`
- Web browser runtime for Playwright
- For authenticated journeys (recommended):
  - `E2E_AUTH_EMAIL`
  - `E2E_AUTH_PASSWORD`
- For native Maestro flows:
  - Maestro CLI installed from [official docs](https://maestro.mobile.dev/getting-started/installing-maestro)
  - Device/emulator connected
  - `E2E_APP_ID` set (for Expo Go this is typically `host.exp.Exponent`)

## Install browser binaries once

```bash
npx playwright install chromium
```

## Commands

- Full web journeys:
  - `npm run e2e:web`
- Web smoke only:
  - `npm run e2e:web:smoke`
- Full native journeys:
  - `npm run e2e:native`
- Native smoke only:
  - `npm run e2e:native:smoke`
- Combined (web + native + Markdown report):
  - `npm run e2e:all`
- Combined smoke:
  - `npm run e2e:smoke`
- Regenerate report from existing artifacts:
  - `npm run e2e:report`

## Output Artifacts

- Playwright report JSON: `test-results/playwright/results.json`
- Playwright HTML report: `test-results/playwright/html`
- Maestro JUnit XML: `test-results/maestro/results.xml`
- Generated bug report (latest): `docs/testing/reports/latest.md`
- Generated bug report (archive): `docs/testing/reports/<timestamp>.md`

## Suggested local workflow before pushing

1. `npm run typecheck`
2. `npm run e2e:smoke`
3. Fix failures in generated report
4. `npm run e2e:all`
5. Verify `docs/testing/reports/latest.md` is clean or actionable

## Notes

- The report generator only stores safe environment metadata (platform/time/node version).
- Do not include secrets in test output or screenshots.
