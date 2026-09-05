/**
 * Renders Play Store feature graphic options at the required 1024x500.
 *
 * The feature graphic is the banner at the top of the store listing and a
 * required field. Google also reuses it in promotional placements, where it can
 * be cropped — so nothing load-bearing goes near the edges, and every option
 * keeps its content inside a centred safe area.
 *
 * Brand from BRANDING.md: forest green ground, beige cairn, amber top stone,
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

/** Amber tints from BRANDING.md §2, used to give the accent real weight. */
const AMBER_SOFT = '#face89';
const AMBER_PALE = '#ffe3ac';

/**
 * Variations on the chosen layout — mark left, wordmark right.
 *
 * The first round put amber on the top stone only, and Standa's critique was
 * right: one small oval carried the entire accent, so it read as a stray
 * colour rather than a decision. These give the amber enough area to look
 * intentional. All keep content in a centred safe area so Google's promotional
 * crops cannot remove anything load-bearing.
 */
const OPTIONS = {
  // Standa's suggestion: the whole cairn amber, wordmark in beige.
  'a1-all-amber': `
    <div class="fg" style="background:${GREEN};display:flex;align-items:center;gap:52px;padding:0 96px">
      ${cairn(210, [AMBER, AMBER, AMBER, AMBER])}
      <div style="color:${BEIGE}">
        <div class="wordmark" style="font-size:66px">Side Quest Life</div>
        <div class="tag" style="margin-top:18px;color:${PALE}">Break the routine. Start living.</div>
      </div>
    </div>`,

  // Light falling down the stack: warm at the top, cooling toward the base.
  'a2-warm-rise': `
    <div class="fg" style="background:${GREEN};display:flex;align-items:center;gap:52px;padding:0 96px">
      ${cairn(210, [BEIGE, AMBER_PALE, AMBER_SOFT, AMBER])}
      <div style="color:${BEIGE}">
        <div class="wordmark" style="font-size:66px">Side Quest Life</div>
        <div class="tag" style="margin-top:18px;color:${PALE}">Break the routine. Start living.</div>
      </div>
    </div>`,

  // Amber everywhere, including the type — warmest, least contrast on the name.
  'a3-amber-word': `
    <div class="fg" style="background:${GREEN};display:flex;align-items:center;gap:52px;padding:0 96px">
      ${cairn(210, [AMBER, AMBER, AMBER, AMBER])}
      <div style="color:${AMBER}">
        <div class="wordmark" style="font-size:66px">Side Quest Life</div>
        <div class="tag" style="margin-top:18px;color:${AMBER_PALE};opacity:.75">Break the routine. Start living.</div>
      </div>
    </div>`,

  // The reverse: stones stay beige, the accent moves into the wordmark.
  'a4-amber-type': `
    <div class="fg" style="background:${GREEN};display:flex;align-items:center;gap:52px;padding:0 96px">
      ${cairn(210, [BEIGE, BEIGE, BEIGE, BEIGE])}
      <div>
        <div class="wordmark" style="font-size:66px;color:${AMBER}">Side Quest Life</div>
        <div class="tag" style="margin-top:18px;color:${PALE}">Break the routine. Start living.</div>
      </div>
    </div>`,

  // Half and half — the top two stones lit, the base still stone-coloured.
  'a5-top-lit': `
    <div class="fg" style="background:${GREEN};display:flex;align-items:center;gap:52px;padding:0 96px">
      ${cairn(210, [BEIGE, BEIGE, AMBER, AMBER])}
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
  console.log('\nPick one, delete the rest.');
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
