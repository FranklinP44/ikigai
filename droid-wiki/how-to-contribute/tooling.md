# Tooling

TypeScript and Vite build the dependency-free browser app; Oxlint, Oxfmt, Vitest, Playwright, and Git hooks validate contributions. Optional Droid functional QA selects browser checks separately.

Active contributors: FranklinP44

## Purpose

Use this reference for local commands and repository automation. Exact dependency versions belong in [Dependencies](../reference/dependencies.md), and workflow execution details in [Deployment](../deployment.md).

## Local tools

| Tool | Role |
| --- | --- |
| npm | Uses committed `package-lock.json`; CI installs with `npm ci`. `package.json` has nine dev dependencies and no runtime dependencies. |
| TypeScript | Strict checking with no emitted JavaScript; Vite transpiles. `tsconfig.json` also rejects unused locals and parameters. |
| Vite | Dev server, production bundle, and preview; `vite.config.ts` uses relative asset URLs. |
| Oxlint | `.oxlintrc.json` enables correctness, suspicious-code, performance, naming, import, TypeScript, and test rules. Warnings fail `npm run lint`. Used instead of typescript-eslint because this project uses TypeScript 7. |
| Oxfmt | `.oxfmtrc.json` sets a 100-column print width and omits arrow parentheses when possible. Generated output, the lockfile, and `droid-wiki/` are ignored. |
| Vitest and V8 coverage | Node-based tests, isolated threads, shuffled order, reports, and 100% pure-module coverage. See [Testing](testing.md). |
| Playwright | `playwright.config.ts` runs `e2e/diagram.spec.ts` against the built page in Chromium; separate from Vitest and agent-driven QA. |
| Husky and lint-staged | Installation configures `.husky/pre-commit`; staged code is linted/autofixed and formatted before project type checking, the instructions check, and unit tests. See [Development workflow](development-workflow.md). |

Oxlint ignores `dist/`, `coverage/`, `reports/`, `playwright-report/`, `test-results/`, `droid-wiki/`, and `.github/` in `.oxlintrc.json`. Its Node script override permits console output in `scripts/`; app console warnings still fail lint. `.oxfmtrc.json` also excludes both Playwright output directories, and `.gitignore` keeps them out of ordinary additions.

## npm commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server at http://localhost:5173 |
| `npm run build` | `tsc --noEmit` then Vite build into `dist/` |
| `npm run preview` | Serve the built bundle at http://localhost:4173 |
| `npm run lint` / `npm run lint:fix` | Check with warnings denied / apply Oxlint fixes |
| `npm run format` / `npm run format:check` | Format in place / check without modifying |
| `npm run test` / `npm run test:watch` | Run Vitest once / watch |
| `npm run test:coverage` | Run tests with the enforced coverage thresholds |
| `npm run test:durations` | Summarize the latest JSON test report |
| `npm run test:e2e` | Build, serve on 4173, and run the fixed Chromium suite; may reuse an existing local server |
| `npm run check:agents-md` | Check contributor instructions against the repository |

Before finishing, run `check:agents-md`, `lint`, `format:check`, `test:coverage`, and `build` through npm, in that order.

## Browser test tooling

`@playwright/test` in `package.json` supplies the runner. Install Chromium once with `npx playwright install chromium`; `.github/workflows/e2e.yml` uses `--with-deps` for system libraries too. `playwright.config.ts` uses the Desktop Chrome preset, fully parallel tests, and a strict-port built preview at http://localhost:4173. Existing servers are reused only outside CI, so stop stale previews before testing current changes.

The local reporter is list-only by default. CI adds GitHub annotations and HTML output, one retry, and traces on first retry; it uploads available reports only on failure for 14 days. Select local HTML output explicitly with `npm run test:e2e -- --reporter=html`. This independent PR/manual workflow needs no Factory secret, credits, or QA label. See [Testing](testing.md#playwright-end-to-end-tests) for the eight cases and scope limits.

## Instruction and report scripts

`scripts/check-agents-md.mjs` checks `AGENTS.md` bidirectionally against non-lifecycle npm scripts and CI npm commands. It also validates inline paths and cited identifiers, CSS names, attributes, and lint rules against source/configuration. Keep the instructions current; do not weaken the checker.

`scripts/report-test-durations.mjs` reads `reports/test-results.json`, prints suite/file durations and the ten slowest tests, and appends the table to the Actions job summary when configured. Tests over 1 second or a suite over 10 seconds produce warnings, not failing gates.

`scripts/check-qa-report.mjs` exports `evaluateQaReport()` for report text and `checkQaReportFile()` for files. Its CLI takes a report path and process outcome, prints the gate diagnostic, and sets a failing exit status for invalid reports, FAIL/BLOCKED results, or an unsuccessful process. `scripts/check-qa-report.test.ts` runs through the ordinary Vitest checks, including subprocess exit-status cases. `vitest.config.ts` collects both `src/` and `scripts/` tests.

## Functional QA tooling

`.factory/skills/qa/SKILL.md` is the diff-aware orchestrator; `.factory/skills/qa-web/SKILL.md` is the browser-flow menu. `.factory/skills/qa/config.yaml` supplies environment URLs, app matching/exclusions, the anonymous visitor, and evidence settings. It declares `test_tool: agent-browser` and `build_command: "npm run build"` but no `dev_command` or `port`; server commands live in the web skill. Generic wiki screenshot discovery therefore cannot discover a capture-ready app from those fields.

`.factory/settings.json` registers the `factory-plugins` marketplace from `Factory-AI/factory-plugins` and enables `droid-control@factory-plugins`. CI explicitly installs and verifies the project plugin in `scripts/provision-qa-browser.sh` before starting Droid QA. Its browser-use route drives agent-browser with Capture and Verify. These are external agent tools, not app dependencies or npm scripts.

`.github/workflows/qa.yml` installs Node 24, npm packages, and Factory Droid, provisions the browser, then invokes the skills through `scripts/run-qa.sh`. Only QA uses Node 24; app support and the Node 22 build/E2E jobs are unchanged. It is an optional, informational workflow gated by the `qa` PR label, or manual dispatch. `FACTORY_API_KEY` is required in CI; no app credentials or `.env` are needed. Local runs use localhost:5173 and built-page preview uses localhost:4173. Never use production as a branch-testing fallback.

`scripts/provision-qa-browser.sh` installs global agent-browser 0.37.1 and its managed Chrome with dependencies, clears browser overrides, creates an empty isolated config, and verifies `about:blank` in an owned bootstrap session. It exports absolute driver/config/browser paths through `GITHUB_ENV`. `scripts/run-qa.sh` checks those paths and the driver version, restores only the provisioned settings, and closes its separate owned session on exit. The model must not attach to other browsers, use system Chrome, or replace the driver. Provisioning is readiness, not application validation.

Current evidence settings are `imagemagick: false`, `video_evidence: false`, `droid_control.compose: false`, and `failure_learning: suggest_in_report`. The workflow reads flags with runner-provided `yq`, rejects video or Compose in CI, and conditionally installs only ImageMagick when requested. No optional ImageMagick package is requested by the current defaults; managed Chrome's dependencies are installed separately by provisioning.

Reports use text snapshots plus downloadable screenshots/logs under gitignored `qa-results/`; the workflow updates one PR comment. `scripts/check-qa-report.mjs` validates the main results table independently of legends and Notes. Reports and logs are published before final process/gate failure. A single exact no-app-diff INCONCLUSIVE row is accepted but claims no browser validation. See [Functional QA](../features/functional-qa.md), [Testing](testing.md), and [Configuration](../reference/configuration.md) before changing flows or evidence behavior.

## Review and documentation automation

- `.github/workflows/droid-review.yml` runs code and shallow security review only for non-draft PRs labeled `droid-review`. New commits, reopening, and ready-for-review events can rerun it while labeled; unrelated label additions do not.
- `.github/workflows/droid.yml` responds to `@droid` in the configured issue, PR, and review events. This mention-driven workflow is separate from auto review. Both use `Factory-AI/droid-action@main` and the Factory API secret.
- `.github/workflows/droid-wiki-refresh.yml` refreshes and uploads the wiki to Factory, then uses a separate job for a rolling PR. Video and GitHub wiki sync are disabled. See [Wiki refresh](../features/wiki-refresh.md).
- `.github/workflows/publish-wiki-to-confluence.yml` independently converts/publishes merged wiki changes; ordinary relevant PRs get a dry run. Do not confuse Factory upload with Confluence publication.

## Dependency updates

`.github/dependabot.yml` schedules npm and GitHub Actions weekly on Monday, and the Confluence publisher's pip packages monthly. Releases wait 7 days; npm majors wait 14.

- Vitest and `@vitest/*` updates are grouped together so runner and coverage packages stay aligned.
- Other npm dev-dependency minor/patch updates share a PR; other majors arrive individually.
- Vitest, `@vitest/*`, and lint-staged major updates are ignored because their next majors require a higher Node floor. Upgrade those manually with the supported Node version.
- Actions updates share one group, and pip updates share the Confluence group. The branch-tracking Factory action is not managed like version-tagged Actions.
- For other npm majors, review the changelog and check `npm view <package>@<version> engines.node` still permits Node 20.19; CI runs Node 22 and cannot establish that compatibility.
- Update dependencies with npm rather than hand-editing `package-lock.json`, and merge only after checks pass.

## Key source files

`package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `e2e/diagram.spec.ts`, `.github/workflows/e2e.yml`, `.oxlintrc.json`, `.oxfmtrc.json`, `.gitignore`, `.husky/pre-commit`, `scripts/check-agents-md.mjs`, `scripts/report-test-durations.mjs`, `scripts/check-qa-report.mjs`, `scripts/check-qa-report.test.ts`, `scripts/provision-qa-browser.sh`, `scripts/run-qa.sh`, `.github/dependabot.yml`, `.factory/settings.json`, `.factory/skills/qa/config.yaml`, and `.github/workflows/qa.yml`.
