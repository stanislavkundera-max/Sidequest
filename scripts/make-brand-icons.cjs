/**
 * Renders the Side Quest Life cairn mark into every icon asset the app and the
 * Play listing need.
 *
 * The mark and its colours are decided in BRANDING.md §2 and §4: a cairn on a
 * forest-green ground, beige stones, one amber stone on top catching the last
 * light. Generating them from one source means a change to the mark is one
 * script run rather than five hand edits.
 *
 * Outputs
 *   assets/images/icon.png            1024  full-bleed, green ground
 *   assets/images/adaptive-icon.png   1024  foreground only, transparent
 *   assets/images/splash-icon.png     1024  transparent, for the splash screen
 *   store-assets/play/icon-512.png     512  Play listing, no transparency
 *
 * Android's adaptive icon only guarantees the centre 66 of 108 dp — everything
 * outside that circle can be masked away. The foreground is therefore drawn at
 * SAFE_SCALE so the whole cairn survives any launcher's mask shape.
 *
 * Usage: node scripts/make-brand-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const GREEN = '#33471f';
const BEIGE = '#f3f2ec';
const AMBER = '#d9a441';

/**
 * Scale for the adaptive-icon foreground.
 *
 * Android guarantees only the centre 66 of 108 dp — a safe radius of 30.6 in
 * this 100-unit viewBox. The cairn itself spans x 29–71 and y 29–78.5, so once
 * optically centred its furthest content sits 27.2 from the middle. The largest
 * scale that still fits is therefore 30.6 / 27.2 = 1.12, and this leaves a
 * little margin under that.
 *
 * The first version of this script used 0.58, computed as though the mark
 * filled the whole canvas. It does not — it fills about half — so the icon came
 * out at roughly 29% of the frame and read as a tiny mark floating in a large
 * green circle. Measure the shape, not the canvas.
 */
const SAFE_SCALE = 1.05;

/** Full-bleed icons are not masked as tightly, so the mark can sit larger. */
const FULL_SCALE = 1.2;

const ROOT = path.join(__dirname, '..');
const OUT_APP = path.join(ROOT, 'assets', 'images');
const OUT_STORE = path.join(ROOT, 'store-assets', 'play');

/** The cairn. Stones do not touch, so each reads against the ground behind it. */
/**
 * The cairn. All four stones carry the accent: the feature graphic settled on an
 * all-amber mark, and an icon coloured differently would read as a second
 * version of the same logo where the two sit together on the listing page.
 * Costs some legibility at 48px — amber holds 4.53 against the green where
 * beige held 9.08 — and the shape carries recognition more than the contrast
 * does. Standa's call, 2026-09-05.
 */
function cairn({ stone, top }) {
  return `
    <ellipse cx="50" cy="71" rx="21"   ry="7.5" fill="${stone}"/>
    <ellipse cx="52" cy="57" rx="16"   ry="6.5" fill="${stone}"/>
    <ellipse cx="48" cy="45" rx="11.5" ry="6"   fill="${stone}"/>
    <ellipse cx="50" cy="34" rx="7"    ry="5"   fill="${top}"/>`;
}

/**
 * The stack spans y 29–78, so its geometric centre sits at ~53 rather than 50
 * and the mark reads as sitting low in the frame. Nudging it up optically
 * centres it — the difference is small on screen and obvious once seen.
 */
const OPTICAL_LIFT = -3.8;

function svg({ size, background, scale = 1, stone = BEIGE, top = AMBER }) {
  const inner = cairn({ stone, top });
  const body = `<g transform="translate(50 ${50 + OPTICAL_LIFT}) scale(${scale}) translate(-50 -50)">${inner}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    ${background ? `<rect width="100" height="100" fill="${background}"/>` : ''}
    ${body}
  </svg>`;
}

async function render(page, markup, size, file, transparent) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>${markup}`
  );
  await page.screenshot({ path: file, omitBackground: transparent });
  const b = fs.readFileSync(file);
  console.log(
    `  ${path.relative(ROOT, file).padEnd(42)} ${b.readUInt32BE(16)}x${b.readUInt32BE(20)}  ${(b.length / 1024).toFixed(0)} kB`
  );
}

(async () => {
  fs.mkdirSync(OUT_APP, { recursive: true });
  fs.mkdirSync(OUT_STORE, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  console.log('Rendering the cairn mark:\n');

  // App icon — full bleed on the brand green.
  await render(page, svg({ size: 1024, background: GREEN, scale: FULL_SCALE, stone: AMBER }), 1024,
    path.join(OUT_APP, 'icon.png'), false);

  // Adaptive foreground — transparent, scaled into the safe circle. The green
  // ground comes from android.adaptiveIcon.backgroundColor in app.config.ts.
  await render(page, svg({ size: 1024, background: null, scale: SAFE_SCALE, stone: AMBER }), 1024,
    path.join(OUT_APP, 'adaptive-icon.png'), true);

  // Splash — transparent, sits on the splash backgroundColor.
  await render(page, svg({ size: 1024, background: null, scale: 0.7, stone: GREEN, top: AMBER }), 1024,
    path.join(OUT_APP, 'splash-icon.png'), true);

  // Play listing — 512 and no alpha channel, which Play rejects.
  await render(page, svg({ size: 512, background: GREEN, scale: FULL_SCALE, stone: AMBER }), 512,
    path.join(OUT_STORE, 'icon-512.png'), false);

  await browser.close();
  console.log('\nDone. Colours from BRANDING.md §2.');
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
