// Summarizes how long the last Vitest run took, from the JSON report it writes (see
// vitest.config.ts). Prints the total, each test file, and the slowest tests, and appends the same
// Markdown to the GitHub Actions job summary when GITHUB_STEP_SUMMARY is set. Tests or a suite over
// budget produce a warning (an annotation on GitHub Actions) rather than a failure, because CI
// runner speed varies between runs.
// Usage: node scripts/report-test-durations.mjs [path-to-json]   (run the tests first)
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const REPORT_PATH = resolve(process.argv[2] ?? join(ROOT, "reports/test-results.json"));
const SLOW_TEST_MS = 1000;
const SUITE_BUDGET_MS = 10_000;
const SLOWEST_COUNT = 10;

if (!existsSync(REPORT_PATH)) {
  console.error(`No test report at ${REPORT_PATH}. Run "npm run test" first.`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(REPORT_PATH, "utf8"));
const files = report.testResults.map(file => ({
  name: relative(ROOT, file.name).split("\\").join("/"),
  duration: file.endTime - file.startTime,
  tests: file.assertionResults,
}));
const tests = files.flatMap(file =>
  file.tests.map(test => ({ file: file.name, name: test.fullName, duration: test.duration ?? 0 })),
);
const suiteEnd = Math.max(report.startTime, ...report.testResults.map(file => file.endTime));
const suiteDuration = suiteEnd - report.startTime;

const ms = value => `${Math.round(value)} ms`;
const cell = value => String(value).replaceAll("|", "\\|");
const table = (headers, rows) =>
  [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");

const slowest = tests.toSorted((a, b) => b.duration - a.duration).slice(0, SLOWEST_COUNT);
const summary = [
  "## Test durations",
  "",
  `${tests.length} tests in ${files.length} files took ${ms(suiteDuration)} ` +
    `(budget ${ms(SUITE_BUDGET_MS)}; slow test threshold ${ms(SLOW_TEST_MS)}).`,
  "",
  "### Test files",
  "",
  table(
    ["File", "Tests", "Duration"],
    files
      .toSorted((a, b) => b.duration - a.duration)
      .map(file => [file.name, file.tests.length, ms(file.duration)]),
  ),
  "",
  `### Slowest ${slowest.length} tests`,
  "",
  table(
    ["Test", "File", "Duration"],
    slowest.map(test => [test.name, test.file, ms(test.duration)]),
  ),
  "",
].join("\n");

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);

const warn = message =>
  console.log(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `Warning: ${message}`);
for (const slow of tests.filter(test => test.duration > SLOW_TEST_MS)) {
  warn(`"${slow.name}" in ${slow.file} took ${ms(slow.duration)} (over ${ms(SLOW_TEST_MS)}).`);
}
if (suiteDuration > SUITE_BUDGET_MS) {
  warn(`The test suite took ${ms(suiteDuration)} (over the ${ms(SUITE_BUDGET_MS)} budget).`);
}
