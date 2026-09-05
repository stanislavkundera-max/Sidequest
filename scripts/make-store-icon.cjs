/**
 * Produces the 512x512 listing icon Play Console asks for.
 *
 * `assets/images/icon.png` is 1024x1024, and Play wants exactly 512x512, 32-bit
 * PNG. Rather than add an image library for one resize, this renders the source
 * into a 512x512 canvas using the Chromium that Playwright already ships.
 *
 * Play also rejects transparency on the listing icon, so the canvas is filled
 * with the brand beige first — matching `android.adaptiveIcon.backgroundColor`
 * in app.config.ts — instead of leaving an alpha channel that would fail
 * validation or render unpredictably.
 *
 * Usage: node scripts/make-store-icon.cjs
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SRC = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
const OUT = path.join(__dirname, '..', 'store-assets', 'play', 'icon-512.png');
const SIZE = 512;
const BACKGROUND = '#f4f1ec'; // same as the adaptive icon background

(async () => {
  if (!fs.existsSync(SRC)) throw new Error(`Source icon not found: ${SRC}`);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const dataUri = `data:image/png;base64,${fs.readFileSync(SRC).toString('base64')}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: SIZE, height: SIZE },
    deviceScaleFactor: 1,
  });

  await page.setContent(
    `<style>
       html,body{margin:0;padding:0;width:${SIZE}px;height:${SIZE}px;background:${BACKGROUND};}
       img{width:${SIZE}px;height:${SIZE}px;display:block;}
     </style>
     <img src="${dataUri}">`
  );
  await page.waitForLoadState('networkidle');
  // omitBackground stays false on purpose: Play rejects a transparent icon.
  await page.screenshot({ path: OUT, omitBackground: false });
  await browser.close();

  const out = fs.readFileSync(OUT);
  console.log(
    `Wrote ${path.relative(process.cwd(), OUT)} — ` +
      `${out.readUInt32BE(16)}x${out.readUInt32BE(20)}, ${(out.length / 1024).toFixed(0)} kB`
  );
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
