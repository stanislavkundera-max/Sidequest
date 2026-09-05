/**
 * Renders the Play Store feature graphic at the required 1024x500.
 *
 * The feature graphic is the banner at the top of the store listing and a
 * required field. Google also reuses it in promotional placements, where it can
 * be cropped — so nothing load-bearing goes near the edges, and every option
 * keeps its content inside a centred safe area.
 *
 * Brand from BRANDING.md: forest green ground, amber cairn, beige wordmark,
 * Fraunces for the wordmark. No transparency, which Play rejects.
 *
 * Usage: node scripts/make-feature-graphic.cjs
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const W = 1024;
const H = 500;

const GREEN = '#33471f';
const BEIGE = '#f3f2ec';
const AMBER = '#d9a441';
const PALE = '#e0ecd1';

const OUT = path.join(__dirname, '..', 'store-assets', 'play', 'feature-graphic');

/** The cairn, sized to a given height in px and drawn as inline SVG. */
function cairn(size, stones = [BEIGE, BEIGE, BEIGE, AMBER]) {
  const [s1, s2, s3, s4] = stones;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="display:block">
    <g transform="translate(50 46.2) scale(1.2) translate(-50 -50)">
      <ellipse cx="50" cy="71" rx="21"   ry="7.5" fill="${s1}"/>
      <ellipse cx="52" cy="57" rx="16"   ry="6.5" fill="${s2}"/>
      <ellipse cx="48" cy="45" rx="11.5" ry="6"   fill="${s3}"/>
      <ellipse cx="50" cy="34" rx="7"    ry="5"   fill="${s4}"/>
    </g></svg>`;
}

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:SOFT,WONK,opsz,wght@0..100,0..1,9..144,100..900&family=Inter:wght@400..600&display=swap">`;

const BASE = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  .fg{width:${W}px;height:${H}px;position:relative;overflow:hidden;
      font-family:Inter,system-ui,sans-serif}
  .wordmark{font-family:Fraunces,Georgia,serif;
     font-variation-settings:"SOFT" 40,"WONK" 1,"opsz" 120;
     font-weight:600;letter-spacing:-.01em;line-height:1}
  .tag{font-size:23px;line-height:1.45;opacity:.85}
`;

/**
 * The chosen design, settled 2026-09-05.
 *
 * The first round put amber on the top stone alone, and Standa's critique was
 * right: one small oval carried the entire accent of a 1024x500 banner, so it
 * read as a stray colour rather than a decision. The whole cairn in amber gives
 * the accent the area it needs, and the wordmark stays beige — which holds 9.08
 * against the green where amber would manage only 4.53.
 *
 * Rejected, recorded so the exploration is not repeated: a warm gradient up the
 * stack (washed-out base, top-heavy), amber in the type as well (the name loses
 * contrast at thumbnail size), amber only in the type (leaves the mark looking
 * like the first round), and a half-lit stack.
 */
const OPTIONS = {
  'feature-graphic': `
    <div class="fg" style="background:${GREEN};display:flex;align-items:center;gap:52px;padding:0 96px">
      ${cairn(210, [AMBER, AMBER, AMBER, AMBER])}
      <div style="color:${BEIGE}">
        <div class="wordmark" style="font-size:66px">Side Quest Life</div>
        <div class="tag" style="margin-top:18px;color:${PALE}">Break the routine. Start living.</div>
      </div>
    </div>`,
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

  console.log(`Feature graphics at ${W}x${H}:\n`);
  for (const [name, markup] of Object.entries(OPTIONS)) {
    await page.setContent(`${FONTS}<style>${BASE}</style>${markup}`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: file, omitBackground: false });
    const b = fs.readFileSync(file);
    console.log(`  ${name.padEnd(16)} ${b.readUInt32BE(16)}x${b.readUInt32BE(20)}  ${(b.length / 1024).toFixed(0)} kB`);
  }
  await browser.close();
  console.log('\nDone. Colours from BRANDING.md §2.');
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
