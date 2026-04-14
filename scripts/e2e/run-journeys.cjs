const { spawnSync } = require('node:child_process');
const path = require('node:path');

const isSmoke = process.argv.includes('--smoke');
const projectRoot = path.resolve(__dirname, '..', '..');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status ?? 1;
}

const webStatus = run('npm', ['run', isSmoke ? 'e2e:web:smoke' : 'e2e:web']);
const nativeStatus = run('npm', ['run', isSmoke ? 'e2e:native:smoke' : 'e2e:native']);
const reportStatus = run('npm', ['run', 'e2e:report']);

if (reportStatus !== 0) {
  process.exit(reportStatus);
}

if (webStatus !== 0 || nativeStatus !== 0) {
  process.exit(1);
}

process.exit(0);
