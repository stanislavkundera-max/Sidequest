const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..', '..');
const reportsDir = path.join(projectRoot, 'docs', 'testing', 'reports');
const playwrightPath = path.join(
  projectRoot,
  'test-results',
  'playwright',
  'results.json'
);
const maestroPath = path.join(projectRoot, 'test-results', 'maestro', 'results.xml');

function safeRead(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function summarizePlaywrightFailures() {
  const raw = safeRead(playwrightPath);
  if (!raw) return [];

  const data = JSON.parse(raw);
  const failures = [];

  function walkSuite(suite, parentTitles) {
    const chain = [...parentTitles, suite.title].filter(Boolean);
    for (const spec of suite.specs ?? []) {
      for (const testCase of spec.tests ?? []) {
        const expectedStatus = testCase.expectedStatus ?? 'passed';
        const finalStatus =
          testCase.results?.[testCase.results.length - 1]?.status ?? testCase.status;
        if (finalStatus && finalStatus !== expectedStatus) {
          const errorMsg =
            testCase.results?.find((result) => result.error)?.error?.message ??
            testCase.results?.[0]?.error?.message ??
            'No error message recorded.';
          failures.push({
            source: 'web',
            journey: [...chain, spec.title].join(' > '),
            testName: spec.title,
            expected: expectedStatus,
            actual: finalStatus,
            details: errorMsg,
            artifacts: 'test-results/playwright/html and trace/video artifacts',
          });
        }
      }
    }
    for (const child of suite.suites ?? []) {
      walkSuite(child, chain);
    }
  }

  for (const suite of data.suites ?? []) {
    walkSuite(suite, []);
  }

  return failures;
}

function decodeXmlEntities(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function summarizeMaestroFailures() {
  const raw = safeRead(maestroPath);
  if (!raw) return [];

  const failures = [];
  const testCaseRegex =
    /<testcase[^>]*name="([^"]*)"[^>]*>([\s\S]*?)<\/testcase>|<testcase[^>]*name="([^"]*)"[^>]*\/>/g;

  for (const match of raw.matchAll(testCaseRegex)) {
    const testName = decodeXmlEntities(match[1] || match[3] || 'Unnamed Maestro flow');
    const inner = match[2] || '';
    const failureMatch = inner.match(/<failure(?:[^>]*)>([\s\S]*?)<\/failure>/);
    if (!failureMatch) continue;
    const details = decodeXmlEntities(failureMatch[1].trim() || 'No failure body.');
    failures.push({
      source: 'native',
      journey: `Maestro flow > ${testName}`,
      testName,
      expected: 'passed',
      actual: 'failed',
      details,
      artifacts: 'test-results/maestro/results.xml and Maestro logs',
    });
  }

  return failures;
}

function formatMarkdown(failures) {
  const now = new Date();
  const timestamp = now.toISOString();
  const envInfo = [
    `- Generated: ${timestamp}`,
    `- Host OS: ${os.platform()} ${os.release()}`,
    `- Node: ${process.version}`,
    `- Web report found: ${fs.existsSync(playwrightPath) ? 'yes' : 'no'}`,
    `- Native report found: ${fs.existsSync(maestroPath) ? 'yes' : 'no'}`,
  ].join('\n');

  const summary = [
    `- Total failed scenarios: ${failures.length}`,
    `- Web failures: ${failures.filter((f) => f.source === 'web').length}`,
    `- Native failures: ${failures.filter((f) => f.source === 'native').length}`,
  ].join('\n');

  const detailBlocks =
    failures.length === 0
      ? 'No failures were detected in parsed test artifacts.'
      : failures
          .map(
            (f, index) => `## Bug ${index + 1}: ${f.testName}

- Journey: ${f.journey}
- Platform: ${f.source}
- Expected: ${f.expected}
- Actual: ${f.actual}
- Artifact hints: ${f.artifacts}

### Steps attempted
1. Executed automated E2E journey scenario.
2. Followed scripted user interactions for this flow.
3. Captured assertion/error from test runner.

### Expected vs actual
- Expected: ${f.expected}
- Actual: ${f.actual}

### Raw failure details
\`\`\`
${f.details}
\`\`\`
`
          )
          .join('\n');

  return `# Local E2E Bug Report

## Environment
${envInfo}

## Summary
${summary}

${detailBlocks}
`;
}

const failures = [
  ...summarizePlaywrightFailures(),
  ...summarizeMaestroFailures(),
];

const markdown = formatMarkdown(failures);
fs.mkdirSync(reportsDir, { recursive: true });

const stamp = new Date().toISOString().replaceAll(':', '-');
const latestPath = path.join(reportsDir, 'latest.md');
const archivedPath = path.join(reportsDir, `${stamp}.md`);
fs.writeFileSync(latestPath, markdown);
fs.writeFileSync(archivedPath, markdown);

console.log(`Bug report written: ${latestPath}`);
console.log(`Archived report written: ${archivedPath}`);
