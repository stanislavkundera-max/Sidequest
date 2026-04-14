import { defineConfig, devices } from '@playwright/test';

const webPort = Number(process.env.E2E_WEB_PORT ?? 4173);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './tests/e2e/web',
  outputDir: 'test-results/playwright/artifacts',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/playwright/results.json' }],
    ['html', { outputFolder: 'test-results/playwright/html', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `npx expo start --web --port ${webPort}`,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
