/**
 * Renders the Google Play phone screenshots (1080x1920) for the Dawn redesign, 1.1.0.
 *
 * Mentor, 2026-10-17 (docs/feedback/mentor-2026-10-17-raw-notes.md): the screenshots are the
 * introduction on Google Play and should answer "what do I get?" — a feeling ("appreciate my days
 * more"), not a feature list. So each one carries one sentence about how it feels, a short line
 * under it, and the real screen below in a phone frame on the Dawn sunrise ground.
 *
 * The screens in `store-assets/play/screenshots/source/` are captures of the web build at
 * 390x844 @3x from a test guest that finished six quests (2026-10-23). Replace them and run this
 * again after a design change; the captions live here.
 *
 * Usage: node scripts/make-play-screenshots.cjs
 * If Playwright's own browser is missing, point PLAYWRIGHT_CHROMIUM_EXECUTABLE at a Chromium.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const W = 1080;
const H = 1920;
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'store-assets', 'play', 'screenshots', 'source');
const OUT = path.join(ROOT, 'store-assets', 'play', 'screenshots');
const FONTS = path.join(ROOT, 'node_modules', '@expo-google-fonts', 'inter');

/** In listing order. The first two are the ones people see without scrolling. */
const SHOTS = [
  {
    file: '01-explore.png',
    source: 'explore.png',
    title: 'Make your days worth remembering.',
    line: 'Real-world side quests that pull you out of the same week on repeat.',
    brand: true,
  },
  {
    file: '02-journey.png',
    source: 'journey.png',
    title: "Do something you've never done. This week.",
    line: 'Small ones for a Tuesday, big ones worth planning for.',
  },
  {
    file: '03-quest.png',
    source: 'quest.png',
    title: 'Get up, go out, step by step.',
    line: 'Every quest tells you exactly what to do next.',
  },
  {
    file: '04-memories.png',
    source: 'memories.png',
    title: 'Keep how it felt, not just that it happened.',
    line: 'A few words after every quest, and a question for each day.',
  },
  {
    file: '05-stone.png',
    source: 'done.png',
    title: 'Every quest leaves a stone.',
    line: 'No points, no streaks. Just the days you went.',
  },
  {
    file: '06-progress.png',
    source: 'progress.png',
    title: 'Appreciate your days more.',
    line: 'See the days you actually lived, month by month.',
  },
];

const font = (weight, file) =>
  `@font-face{font-family:Inter;font-weight:${weight};src:url(data:font/ttf;base64,${fs
    .readFileSync(path.join(FONTS, file))
    .toString('base64')}) format('truetype');}`;

/** The cairn as in the app: four chunky stones, orange #f0b27a (BRANDING.md §4). */
const CAIRN = `<svg width="34" height="40" viewBox="0 0 34 40" aria-hidden="true"><g fill="#f0b27a">
  <ellipse cx="17" cy="6" rx="6" ry="4.6"/><ellipse cx="16" cy="15" rx="9" ry="5"/>
  <ellipse cx="18" cy="25" rx="12" ry="5.6"/><ellipse cx="17" cy="35" rx="16" ry="5"/></g></svg>`;

function page(shot, imgB64) {
  const phoneW = 780;
  const phoneH = Math.round((phoneW * 2532) / 1170);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${font(400, '400Regular/Inter_400Regular.ttf')}
${font(500, '500Medium/Inter_500Medium.ttf')}
${font(700, '700Bold/Inter_700Bold.ttf')}
*{margin:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:Inter,sans-serif;color:#f3f2ec;
  background:
    radial-gradient(70% 34% at 50% 0%, rgba(248,220,170,.34) 0%, rgba(215,154,140,.14) 55%, rgba(215,154,140,0) 100%),
    radial-gradient(60% 40% at 100% 100%, rgba(240,150,120,.28) 0%, rgba(240,150,120,0) 70%),
    linear-gradient(180deg,#47536b 0%,#7f7a96 13%,#a88a8d 25%,#7a6556 38%,#4a4132 52%,#3d372a 70%,#4b4331 100%);}
body{display:flex;flex-direction:column;align-items:center}
.top{align-self:stretch;padding:${shot.brand ? 64 : 84}px 72px 0}
.brand{display:flex;align-items:center;gap:14px;margin-bottom:26px;font-weight:700;font-size:26px;letter-spacing:.2em;color:#ffe2c2}
h1{font-weight:700;font-size:70px;line-height:1.08;letter-spacing:-.02em;text-wrap:balance}
p{margin-top:22px;font-weight:500;font-size:33px;line-height:1.35;color:#ece4d0;text-wrap:balance}
.phone{flex:none;margin-top:52px;width:${phoneW}px;height:${phoneH}px;
  border-radius:64px;padding:12px;background:#1b1a12;
  box-shadow:0 40px 90px rgba(10,9,5,.55),0 0 0 2px rgba(240,178,122,.35),0 0 120px rgba(240,150,120,.18)}
.phone img{display:block;width:100%;height:100%;border-radius:52px}
</style></head><body>
<div class="top">${shot.brand ? `<div class="brand">${CAIRN}SIDE QUEST LIFE</div>` : ''}
<h1>${shot.title}</h1><p>${shot.line}</p></div>
<div class="phone"><img src="data:image/png;base64,${imgB64}"></div>
</body></html>`;
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  });
  const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const shot of SHOTS) {
    const img = fs.readFileSync(path.join(SRC, shot.source)).toString('base64');
    await tab.setContent(page(shot, img), { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    // JPEG-free PNG with no transparency: Play rejects alpha in screenshots.
    await tab.screenshot({ path: path.join(OUT, shot.file), omitBackground: false });
    console.log('wrote', shot.file);
  }
  await browser.close();
})();
