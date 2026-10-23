/**
 * Installs weekly / monthly / yearly quest card backgrounds into `assets/images/`.
 * - If Cursor-generated art exists under `.cursor/projects/.../assets/`, copies those PNGs.
 * - Otherwise keeps the PNGs already there (the valley art is a JPEG and cannot stand in for them).
 *
 * Run: `npm run assets:timeframes`
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.join(__dirname, '..');
const images = path.join(root, 'assets', 'images');
const valley = path.join(images, 'journey-valley-background.jpg');

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

for (const t of tf) {
  const dest = path.join(images, `journey-timeframe-${t}.png`);
  const gen = path.join(generatedDir, `journey-timeframe-${t}.png`);
  if (fs.existsSync(gen)) {
    fs.copyFileSync(gen, dest);
    console.log('Copied generated', path.relative(root, dest));
  } else if (fs.existsSync(dest)) {
    // The valley is JPEG data: copied under a .png name, the Android build refuses it (AAPT,
    // SDK 58 build, 2026-10-23). Keep the PNG that is already there.
    console.log('Kept existing', path.relative(root, dest), '(no generated art at', gen + ')');
  } else {
    console.error('Missing', path.relative(root, dest), '— supply a real PNG; the valley is a JPEG.');
    process.exitCode = 1;
  }
}
