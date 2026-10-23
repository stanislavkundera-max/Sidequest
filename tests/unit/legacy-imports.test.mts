// Since Expo SDK 58 some packages keep their old functions at the root import only as stubs that
// throw at runtime ("will throw in runtime"). Typecheck passes, so the calendar step on the 1.1.0
// preview build silently did nothing. The old APIs must be imported from '<package>/legacy'.
// Run: node --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['app', 'components', 'src', 'lib', 'stores'];

/** Root imports whose old functions throw at runtime; what is allowed from the root is listed. */
const SHIMMED: Record<string, { allowed: string[] }> = {
  'expo-calendar': { allowed: [] },
  'expo-file-system': { allowed: ['File', 'Directory', 'Paths', 'EncodingType', 'FileMode', 'UploadType'] },
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test('no runtime-throwing legacy functions are imported from a package root', () => {
  const problems: string[] = [];
  for (const file of ROOTS.flatMap(sourceFiles)) {
    const text = readFileSync(file, 'utf8');
    for (const [pkg, { allowed }] of Object.entries(SHIMMED)) {
      const re = new RegExp(`import\\s+(type\\s+)?([\\s\\S]*?)\\s+from\\s+['"]${pkg}['"]`, 'g');
      for (const m of text.matchAll(re)) {
        if (m[1]) continue; // type-only imports never run
        const clause = m[2].trim();
        if (clause.startsWith('* as')) {
          problems.push(`${file}: import * from '${pkg}' — use '${pkg}/legacy' or named new-API imports`);
          continue;
        }
        const names = clause
          .replace(/^\{|\}$/g, '')
          .split(',')
          .map((n) => n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0])
          .filter(Boolean);
        const bad = names.filter((n) => !allowed.includes(n));
        if (bad.length) problems.push(`${file}: ${bad.join(', ')} from '${pkg}' — use '${pkg}/legacy'`);
      }
    }
  }
  assert.deepEqual(problems, []);
});
