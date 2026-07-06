/**
 * Installs weekly / monthly / yearly quest card backgrounds into `assets/images/`.
 * - If Cursor-generated art exists under `.cursor/projects/.../assets/`, copies those PNGs.
 * - Otherwise duplicates `journey-valley-background.png` so Metro always resolves the requires.
 *
 * Run: `npm run assets:timeframes`
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.join(__dirname, '..');
const images = path.join(root, 'assets', 'images');
const valley = path.join(images, 'journey-valley-background.png');

const home = os.homedir();
const generatedDir = path.join(
  home,
  '.cursor',
  'projects',
  'c-Users-StanislavKundera-OneDrive-Byzkids-Plocha-Master-Cursor-Project-App',
  'assets'
);

const tf = ['weekly', 'monthly', 'yearly'];
if (!fs.existsSync(valley)) {
  console.error('Missing source:', valley);
  process.exit(1);
}
const valleyBuf = fs.readFileSync(valley);

for (const t of tf) {
  const dest = path.join(images, `journey-timeframe-${t}.png`);
  const gen = path.join(generatedDir, `journey-timeframe-${t}.png`);
  if (fs.existsSync(gen)) {
    fs.copyFileSync(gen, dest);
    console.log('Copied generated', path.relative(root, dest));
  } else {
    fs.writeFileSync(dest, valleyBuf);
    console.log('Wrote valley copy', path.relative(root, dest), '(no generated art at', gen + ')');
  }
}
