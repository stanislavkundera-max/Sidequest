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
function cairn(size, { stone = BEIGE, top = AMBER } = {}) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="display:block">
    <g transform="translate(50 46.2) scale(1.2) translate(-50 -50)">
      <ellipse cx="50" cy="71" rx="21"   ry="7.5" fill="${stone}"/>
      <ellipse cx="52" cy="57" rx="16"   ry="6.5" fill="${stone}"/>
      <ellipse cx="48" cy="45" rx="11.5" ry="6"   fill="${stone}"/>
      <ellipse cx="50" cy="34" rx="7"    ry="5"   fill="${top}"/>
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

/** Four directions, all inside a centred safe area so cropping cannot hurt. */
const OPTIONS = {
  'a-mark-left': `
    <div class="fg" style="background:${GREEN};display:flex;align-items:center;gap:52px;padding:0 96px">
      ${cairn(210)}
      <div style="color:${BEIGE}">
        <div class="wordmark" style="font-size:66px">Side Quest Life</div>
        <div class="tag" style="margin-top:18px;color:${PALE}">Break the routine. Start living.</div>
      </div>
    </div>`,

  'b-centred': `
    <div class="fg" style="background:${GREEN};display:flex;flex-direction:column;
         align-items:center;justify-content:center;gap:14px">
      ${cairn(190)}
      <div class="wordmark" style="font-size:58px;color:${BEIGE}">Side Quest Life</div>
      <div class="tag" style="color:${PALE}">Break the routine. Start living.</div>
    </div>`,

  'c-quiet': `
    <div class="fg" style="background:${BEIGE};display:flex;align-items:center;gap:56px;padding:0 104px">
      ${cairn(200, { stone: GREEN, top: AMBER })}
      <div style="color:${GREEN}">
        <div class="wordmark" style="font-size:64px">Side Quest Life</div>
        <div class="tag" style="margin-top:18px;color:#5c6b49">
          Small real-world quests, guided step by step.
        </div>
      </div>
    </div>`,

  'd-mark-only': `
    <div class="fg" style="background:${GREEN};display:flex;align-items:center;justify-content:center">
      ${cairn(330)}
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
