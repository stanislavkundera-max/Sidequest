const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const isSmoke = process.argv.includes('--smoke');
const projectRoot = path.resolve(__dirname, '..', '..');
const flowsDir = path.join(projectRoot, 'tests', 'e2e', 'native', 'flows');
const outDir = path.join(projectRoot, 'test-results', 'maestro');
const outFile = path.join(outDir, 'results.xml');

const appId = process.env.E2E_APP_ID || process.env.MAESTRO_APP_ID;
if (!appId) {
  console.error(
    'Missing E2E_APP_ID (or MAESTRO_APP_ID). Example: host.exp.Exponent for Expo Go.'
  );
  process.exit(1);
}

if (!fs.existsSync(flowsDir)) {
  console.error(`Flow directory not found: ${flowsDir}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const allFlows = fs
  .readdirSync(flowsDir)
  .filter((file) => file.endsWith('.yaml'))
  .sort();
const selectedFlows = isSmoke ? allFlows.slice(0, 2) : allFlows;
const userHome = process.env.USERPROFILE || process.env.HOME || '';
const maestroFallback = path.join(userHome, 'maestro', 'maestro', 'bin', 'maestro.bat');
const maestroCommand = fs.existsSync(maestroFallback) ? maestroFallback : 'maestro';
const useShell = maestroCommand.endsWith('.bat');

if (selectedFlows.length === 0) {
  console.error('No Maestro flow files found.');
  process.exit(1);
}

const run = spawnSync(
  maestroCommand,
  [
    'test',
    ...selectedFlows.map((name) => path.join(flowsDir, name)),
    '--format',
    'junit',
    '--output',
    outFile,
    `--env=APP_ID=${appId}`,
  ],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: useShell,
  }
);

if (run.error && run.error.code === 'ENOENT') {
  console.error(
    'Maestro CLI not found. Install locally: https://maestro.mobile.dev/getting-started/installing-maestro'
  );
  process.exit(1);
}

process.exit(run.status ?? 1);
