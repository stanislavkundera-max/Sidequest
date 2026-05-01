import { expect, test, type Page } from '@playwright/test';

const AUTH_EMAIL = process.env.E2E_AUTH_EMAIL;
const AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD;
const ONBOARDING_EMAIL = process.env.E2E_ONBOARDING_EMAIL;
const ONBOARDING_PASSWORD = process.env.E2E_ONBOARDING_PASSWORD;

async function textVisible(page: Page, text: string) {
  return (await page.getByText(text, { exact: false }).count()) > 0;
}

async function landOnApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
}

async function clickVisibleText(page: Page, text: string) {
  const target = page.getByText(text, { exact: true }).first();
  await expect(target).toBeVisible();
  await target.click();
}

async function detectSurface(page: Page): Promise<'auth' | 'onboarding' | 'home' | 'unknown'> {
  if (await textVisible(page, 'Welcome back')) return 'auth';
  if (await textVisible(page, 'Side Quest Life')) return 'onboarding';
  // After auth + onboarding, the tab bar should show Journey.
  if (await textVisible(page, 'Journey')) return 'home';
  return 'unknown';
}

async function clickByAccessibilityLabel(page: Page, label: string) {
  const target = page.getByRole('button', { name: label, exact: false }).first();
  await expect(target).toBeVisible();
  await target.click();
}

async function signInFromAuthSurface(page: Page, email: string, password: string) {
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await clickVisibleText(page, 'Sign in');
}

async function completeOnboardingIfVisible(page: Page) {
  if ((await detectSurface(page)) !== 'onboarding') return;
  await clickVisibleText(page, 'Next');
  await expect(page.getByText('Pick your preferred categories.')).toBeVisible();
  await clickVisibleText(page, 'Next');
  await expect(page.getByText('Choose intensity.')).toBeVisible();
  await clickVisibleText(page, 'Bold');
  await clickVisibleText(page, 'Start quests');
}

async function ensureAuthenticatedOrSkip(page: Page, options?: { allowOnboardingCompletion?: boolean }) {
  const allowOnboardingCompletion = options?.allowOnboardingCompletion ?? true;
  const surface = await detectSurface(page);
  if (surface === 'auth') {
    if (!AUTH_EMAIL || !AUTH_PASSWORD) {
      test.skip(
        true,
        'No E2E_AUTH_EMAIL/E2E_AUTH_PASSWORD provided for authenticated journeys.'
      );
    }
    await signInFromAuthSurface(page, AUTH_EMAIL as string, AUTH_PASSWORD as string);
  }

  await expect
    .poll(() => detectSurface(page), { timeout: 30_000 })
    .not.toBe('unknown');

  if ((await detectSurface(page)) === 'onboarding' && allowOnboardingCompletion) {
    await completeOnboardingIfVisible(page);
    await expect
      .poll(() => detectSurface(page), { timeout: 30_000 })
      .toBe('home');
  }

  const after = await detectSurface(page);
  if (after !== 'home') {
    test.skip(true, 'Could not reach authenticated state for this journey test.');
  }
}

test.describe('User journeys on web', () => {
  test('@smoke bootstrap route gate', async ({ page }) => {
    await landOnApp(page);
    await expect
      .poll(
        async () =>
          (await textVisible(page, 'Welcome back')) ||
          (await textVisible(page, 'Side Quest Life')) ||
          (await textVisible(page, 'Choose a quest')),
        { timeout: 30_000 }
      )
      .toBeTruthy();
  });

  test('auth validation and mode switch', async ({ page }) => {
    await page.goto('/sign-in');
    if (!(await textVisible(page, 'Welcome back'))) {
      test.skip(true, 'Sign-in screen not reachable in current session.');
    }
    await clickVisibleText(page, 'Sign in');
    await expect(page.getByText('Enter email and password.')).toBeVisible();
    await clickVisibleText(page, 'Need an account? Sign up');
    await expect(page.getByText('Create account')).toBeVisible();
  });

  test('onboarding flow progresses through all steps', async ({ page }) => {
    await page.goto('/onboarding');
    if (await textVisible(page, 'Welcome back')) {
      const email = ONBOARDING_EMAIL ?? AUTH_EMAIL;
      const password = ONBOARDING_PASSWORD ?? AUTH_PASSWORD;
      if (!email || !password) {
        test.skip(
          true,
          'Onboarding test requires E2E_ONBOARDING_EMAIL/E2E_ONBOARDING_PASSWORD (or E2E_AUTH_* fallback).'
        );
      }
      await signInFromAuthSurface(page, email as string, password as string);
    }
    if (await textVisible(page, 'Choose a quest')) {
      test.skip(
        true,
        'Onboarding already completed for this account. Use dedicated E2E_ONBOARDING_* user.'
      );
    }

    await expect(page.getByText('Side Quest Life')).toBeVisible();
    await completeOnboardingIfVisible(page);
    await expect
      .poll(() => detectSurface(page), { timeout: 30_000 })
      .toMatch(/home|auth/);
  });

  test('tabs, quest journey, memory journey, and profile journey', async ({ page }) => {
    await landOnApp(page);
    await ensureAuthenticatedOrSkip(page);

    // Journey -> choose a quest
    await clickByAccessibilityLabel(page, 'Open quest chooser');
    await expect(page.getByText('Choose a quest')).toBeVisible({ timeout: 30_000 });

    // Choose a quest -> quest selection
    await clickVisibleText(page, 'Nature');
    await expect(page.getByText('Pick your quests')).toBeVisible();

    const activateButton = page.getByText('Activate', { exact: true }).first();
    if ((await activateButton.count()) > 0) {
      await activateButton.click();
    }

    // From quest list, open a quest detail by clicking first visible quest title text.
    const questTitle = page.locator('text=/.*· ~\\d+ min.*/').first();
    if ((await questTitle.count()) > 0) {
      await questTitle.click();
      await expect(
        page.getByText('Reflection', { exact: false }).or(
          page.getByText('Quest not found')
        )
      ).toBeVisible();
    }

    // Memory flow from tab
    await clickVisibleText(page, 'Memories');
    await expect(page.getByText('Memories')).toBeVisible();
    await clickVisibleText(page, '+ New');
    await expect(page.getByText('What stayed with you?')).toBeVisible();
    await page.getByPlaceholder('A feeling, a detail, a small surprise…').fill(
      'E2E: quick memory check after journey.'
    );
    await clickVisibleText(page, 'Save memory');

    // Progress profile flow
    await clickVisibleText(page, 'Progress');
    await expect(page.getByText('Progress')).toBeVisible();
    await expect(
      page.getByText(/No scores, no streaks/)
    ).toBeVisible();
  });

  test('empty and error-state journey entry points are reachable', async ({ page }) => {
    await landOnApp(page);
    await ensureAuthenticatedOrSkip(page);

    // Journey -> choose a quest (should be reachable)
    await clickByAccessibilityLabel(page, 'Open quest chooser');
    await expect(page.getByText('Choose a quest')).toBeVisible({ timeout: 30_000 });

    await clickVisibleText(page, 'Memories');
    await expect(page.getByText('Memories')).toBeVisible();
    await expect(
      page.getByText('No memories yet').or(page.getByText('Your reflections in reverse chronological order.'))
    ).toBeVisible();
  });
});
