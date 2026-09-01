/**
 * Captures Play Store listing screenshots from the running web build.
 *
 * Play needs phone screenshots and they are a required listing field, but they
 * can be replaced later without a new app review — so shooting the current UI
 * is useful now and is not wasted when the redesign lands.
 *
 * Renders at 1080x1920 (a standard 9:16 phone frame, comfortably inside Play's
 * accepted range) and drives the app the way a first-time user meets it: the
 * app signs in anonymously on launch, so no credentials are needed.
 *
 * Usage: start the web server first, then
 *   node scripts/capture-store-screenshots.cjs
 * Override the target with E2E_BASE_URL if the port differs.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:8081';
const OUT = path.join(__dirname, '..', 'store-assets', 'play', 'screenshots');
const WIDTH = 1080;
const HEIGHT = 1920;

/** Play renders these at phone size, so shoot at 1x of a 9:16 frame. */
const VIEWPORT = { width: WIDTH / 3, height: HEIGHT / 3 };
const SCALE = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Waits for real content instead of a fixed delay.
 *
 * A first run shot the loading spinner: anonymous sign-in plus the onboarding
 * check took longer than the timeout allowed, and a spinner is not a listing
 * screenshot. Polls until the screen has actual text on it.
 */
async function waitForContent(page, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const text = await page.evaluate(() => document.body.innerText.trim());
    if (text.length > 25) return true;
    await sleep(500);
  }
  console.warn('  ! still no content after', timeoutMs, 'ms');
  return false;
}

async function shoot(page, name) {
  await waitForContent(page);
  await sleep(700);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  const { width, height } = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  console.log(`  saved ${name}.png  (viewport ${width}x${height} @${SCALE}x)`);
  return file;
}

/** What the screen currently shows, trimmed — used to decide where we are. */
async function visible(page, lines = 6) {
  return page.evaluate(
    (n) =>
      document.body.innerText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, n),
    lines
  );
}

/** Clicks the first element whose trimmed text matches, if present. */
async function tap(page, text) {
  const el = page.locator(`text="${text}"`).first();
  if ((await el.count()) === 0) return false;
  try {
    await el.click({ timeout: 4000 });
    await sleep(600);
    return true;
  } catch {
    return false;
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    colorScheme: 'light',
  });

  console.log(`Target: ${BASE}`);
  console.log(`Output: ${OUT}\n`);

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90_000 });
  await waitForContent(page, 45_000); // anonymous sign-in + onboarding check

  console.log('Landed on:', await visible(page));
  await shoot(page, '01-welcome');

  // Walk onboarding by repeatedly pressing whatever moves it forward.
  const forward = ['Continue', 'Next', 'Get started', 'Start', 'Done', 'Finish'];
  for (let step = 0; step < 12; step += 1) {
    let moved = false;
    for (const label of forward) {
      if (await tap(page, label)) {
        moved = true;
        break;
      }
    }
    if (!moved) break;
    console.log(`  onboarding step ${step + 1}:`, await visible(page, 3));
  }

  console.log('\nAfter onboarding:', await visible(page));
  await shoot(page, '02-after-onboarding');

  for (const [route, name] of [
    ['/explore', '03-explore'],
    ['/journey', '04-journey'],
    ['/memories', '05-memories'],
    ['/profile', '06-progress'],
  ]) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await sleep(2000);
    console.log(`${route}:`, await visible(page, 4));
    await shoot(page, name);
  }

  await browser.close();
  console.log('\nDone.');
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
