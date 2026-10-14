# Configuration

The browser app needs no environment variables or runtime configuration. Build and contributor checks use `package.json` and the config files below; Confluence publishing uses the tool variables in `.env.example`, while CI agent workflows use a separate Factory secret. App behavior remains controlled by constants in `src/geometry.ts` and `src/main.ts` and custom properties in `src/styles.css`. See [Deployment](../deployment.md) for workflow execution and [Trust boundaries](../security.md) for credentials.

## `package.json`

| Field | Value | Notes |
| --- | --- | --- |
| `private` | `true` | Prevents accidental `npm publish` |
| `type` | `"module"` | `.js` files in the project are treated as ES modules |
| `scripts.dev` | `vite` | Dev server at http://localhost:5173 |
| `scripts.build` | `tsc --noEmit && vite build` | Type-check first, then bundle into `dist/`. A type error stops the build |
| `scripts.preview` | `vite preview` | Serves `dist/` at http://localhost:4173 |
| `scripts.lint`, `scripts.lint:fix` | `oxlint --deny-warnings`, `oxlint --fix` | Warnings fail the check; the second command applies fixes |
| `scripts.format`, `scripts.format:check` | `oxfmt`, `oxfmt --check` | Format in place or check without rewriting |
| `scripts.test`, `scripts.test:watch` | `vitest run`, `vitest` | One run or watch mode |
| `scripts.test:coverage` | `vitest run --coverage` | Enforces pure-module coverage thresholds |
| `scripts.test:durations` | `node scripts/report-test-durations.mjs` | Summarizes the last JSON test report |
| `scripts.test:e2e` | `playwright test` | Fixed Chromium suite against a locally served build |
| `scripts.check:agents-md` | `node scripts/check-agents-md.mjs` | Checks documented scripts, source paths and identifiers |
| `scripts.prepare` | `husky` | Installs the Git hook during npm installation |
| `devDependencies` | Nine development packages | No runtime `dependencies`; exact ranges and locks in [Dependencies](dependencies.md) |
| `allowScripts` | `{ "fsevents": false }` | Blocks the install script of the optional macOS `fsevents` package, which ships a prebuilt binary |

There is no `engines` field. `README.md` asks for Node 20.19+ or 22.12+, the range Vite 8 declares.

## `tsconfig.json`

Used only for type checking (`noEmit`). Vite strips types itself when bundling.

| Option | Value | Effect |
| --- | --- | --- |
| `target` | `ES2022` | Language level assumed for checking |
| `module` | `ESNext` | ES module syntax |
| `moduleResolution` | `bundler` | Resolves imports the way Vite does, so `./data` works without an extension |
| `lib` | `ES2022`, `DOM`, `DOM.Iterable` | Browser globals and iterable `NodeList` |
| `types` | `vite/client` | Vite's client types (for example CSS imports and `import.meta.env`) |
| `strict` | `true` | All strict checks, including `strictNullChecks` |
| `noEmit` | `true` | `tsc` writes no files |
| `isolatedModules` | `true` | Each file must be compilable alone, as Vite compiles them |
| `verbatimModuleSyntax` | `true` | Type-only imports must use `type`, as in `import { type ZoneKey }` |
| `noUnusedLocals` | `true` | Unused variables are errors |
| `noUnusedParameters` | `true` | Unused parameters are errors |
| `noFallthroughCasesInSwitch` | `true` | Each `switch` case must end with `break` or `return` |
| `skipLibCheck` | `true` | Skips checking `.d.ts` files in `node_modules` |
| `include` | `["src"]` | Only `src/` is checked. `vite.config.ts` is not |

## `vite.config.ts`

| Option | Value | Effect |
| --- | --- | --- |
| `base` | `'./'` | Built asset URLs are relative, so `dist/` works under the GitHub Pages subpath `/ikigai/` |

Everything else uses Vite defaults: `index.html` at the repo root is the entry, output goes to `dist/`.

## `playwright.config.ts`

These settings control the fixed suite in `e2e/diagram.spec.ts`, not the optional Factory QA skills.

| Option | Value | Effect |
| --- | --- | --- |
| `testDir` | `"e2e"` | Collects browser tests separately from Vitest |
| `fullyParallel` | `true` | Allows tests in the same file to run in parallel |
| `forbidOnly` | `!!process.env.CI` | Rejects focused tests in CI |
| `retries` | `1` in CI, `0` otherwise | One retry only in CI |
| `reporter` | CI: GitHub and HTML with `open: "never"`; local: list | No automatic local HTML report |
| `use.baseURL` | `http://localhost:4173` | `page.goto("/")` targets the built preview |
| `use.trace` | `"on-first-retry"` | Records a trace on first retry; none on a default local run |
| `projects` | One `chromium` project with `devices["Desktop Chrome"]` | Desktop Chromium coverage only |
| `webServer.command` | `npm run build && npm run preview -- --port 4173 --strictPort` | Builds before starting preview, unless an existing server is reused |
| `webServer.url` | `http://localhost:4173` | Server readiness URL |
| `webServer.reuseExistingServer` | `!process.env.CI` | Local reuse can test a stale preview; CI does not reuse |
| `webServer.timeout` | `120_000` ms | Startup timeout, not per-test timeout |

Install Chromium once with `npx playwright install chromium`. CI uses `--with-deps` for system libraries too. The runner reads `CI` to select behavior, but the app needs no environment setup. See [Testing](../how-to-contribute/testing.md#playwright-end-to-end-tests) for assertions and explicit local report options.

## Tests, linting, formatting, and hooks

| File | Configuration |
| --- | --- |
| `vitest.config.ts` | Merges `vite.config.ts`; collects `src/**/*.test.ts` and `scripts/**/*.test.ts` in Node, with no enabled globals. Uses threaded workers, isolated module graphs, parallel files, shuffled file/test order, and restored mocks |
| `vitest.config.ts` | Slow-test threshold 1000 ms. Default + JSON reporters locally; also GitHub annotations and JUnit on Actions. Outputs `reports/test-results.json` and `reports/junit.xml` |
| `vitest.config.ts` | V8 coverage includes source TypeScript but excludes `src/main.ts` and tests. Statements, branches, functions and lines each require 100%; text, HTML and JSON summary reports go to `coverage/`, including on failure |
| `.oxlintrc.json` | ESLint, TypeScript, Unicorn, Oxc and import plugins; browser/ES2022 environment. Correctness/suspicious categories are errors, performance warnings fail `npm run lint` through `--deny-warnings` |
| `.oxlintrc.json` | Enforces type imports, no explicit `any` or non-null assertions, import checks, kebab-case filenames and identifier capitalization. Config/scripts overrides use Node; scripts permit console output; overrides for `src/**/*.{test,spec}.ts` and `scripts/**/*.test.ts` enable Vitest rules, including no focused/disabled tests and consistent filenames, not the Playwright suite in `e2e/` |
| `.oxlintrc.json` | Ignores `dist/`, `coverage/`, `reports/`, `playwright-report/`, `test-results/`, `droid-wiki/`, and `.github/` |
| `.oxfmtrc.json` | Print width 100, avoids arrow parentheses where possible. Ignores `dist/`, `coverage/`, `reports/`, `playwright-report/`, `test-results/`, `droid-wiki/`, and `package-lock.json` |
| `package.json` | `lint-staged` runs Oxlint with fixes and denied warnings, then Oxfmt, on staged TS/JS variants. Staged JSON/JSONC/CSS/HTML/Markdown/YAML uses Oxfmt |
| `.husky/pre-commit` | Runs `lint-staged`, `tsc --noEmit`, the AGENTS checker, then `vitest run`, using `npx --no-install` for package binaries |

The hook is not the full completion gate: before finishing, run `npm run check:agents-md`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, and `npm run build`. It does not run Playwright; `AGENTS.md` also asks for `npm run test:e2e` before pushing page changes. See [Testing](../how-to-contribute/testing.md) for isolation, shuffle-seed reproduction, and separate browser coverage.

## Functional QA settings

`.factory/skills/qa/config.yaml` is re-read on every QA run. `.factory/skills/qa/.install-progress.yaml` records installation progress, not runtime settings.

| Field | Current value |
| --- | --- |
| `project`, `platform` | `Ikigai`, `github` |
| `default_target` | `local` |
| `imagemagick`, `video_evidence` | Both `false` |
| `droid_control.plugin`, `droid_control.compose` | `droid-control@factory-plugins`, `false` |
| `environments.local.url` | `http://localhost:5173`; no restrictions |
| `environments.preview.url` | `http://localhost:4173`; no restrictions; local built page, not hosted preview |
| `environments.production.url` | `https://franklinp44.github.io/ikigai/`; read-only, never PR/CI or a fallback for startup failures |
| `auth.method`, `auth.provider` | Both `none` |
| `personas` | One `visitor`, anonymous, `credentials_source: none`, `cannot_do: []`; focus on page load, hover, pinning, pills, keyboard, console errors, built page |
| `apps.web.path_patterns` | `index.html`, `src/**`, `vite.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json` |
| `apps.web.exclude_patterns` | `src/**/*.test.ts` |
| `apps.web.skill`, `apps.web.test_tool` | `qa-web`, `agent-browser` |
| `apps.web.build_command` | `npm run build` |
| `feature_flags` | `provider: none`, empty dashboard URL; overrides not applicable |
| `integrations` | Empty mapping |
| `cleanup` | `auto_cleanup: false`, `strategy: none`; no app data to remove, stop servers started by the run |
| `failure_learning` | `suggest_in_report` |

There is no `apps.web.dev_command` or `apps.web.port`. `.factory/skills/qa-web/SKILL.md` defines startup with `npm run dev -- --strictPort`, and built preview with `npm run build` then `npm run preview -- --strictPort`. Generic wiki screenshot discovery requires a dev command and capture tool, so this app entry alone is not eligible. The absent fields do not prevent QA, whose web skill supplies the lifecycle.

`.factory/settings.json` defines `extraKnownMarketplaces.factory-plugins.source` with `source: github` and `repo: Factory-AI/factory-plugins`; `enabledPlugins` maps `droid-control@factory-plugins` to `true`. Capture and Verify run for functional QA. `.github/workflows/qa.yml` and `scripts/run-qa.sh` require video and Compose to remain false in CI; enabling either is a configuration error, not a request to provision a renderer. See [Functional QA](../features/functional-qa.md).

## `.gitignore`

| Pattern | Why |
| --- | --- |
| `node_modules/` | Installed packages |
| `dist/`, `*.tsbuildinfo` | Vite and TypeScript output |
| `coverage/`, `reports/` | Coverage and Vitest JSON/JUnit reports |
| `playwright-report/`, `test-results/` | Playwright reports, failure artifacts, and traces |
| `qa-results/` | Functional QA reports, snapshots, screenshots, and optional recordings |
| `build/` | Local output of a Confluence dry run (`build/confluence/`) |
| `.env`, `.env.*`, `!.env.example` | Ignores local environment files while retaining the committed template |
| `__pycache__/`, `*.py[cod]`, `.venv/`, `venv/` | Python caches and virtual environments |
| `*.log`, `npm-debug.log*` | Logs |
| `.idea/`, `.vscode/`, `*.swp`, `*.swo`, `*~`, `.DS_Store`, `Thumbs.db`, `desktop.ini` | Editor and operating-system files |

Ignore rules prevent ordinary accidental additions, not secret exposure from already tracked or force-added files.

## Tool-only environment variables

No npm command needs an `.env` file. `.env.example` is a template, not an automatic dotenv loader for `.github/scripts/publish_confluence.py`; its local instructions explicitly export the values into the shell. Empty optional values fall back in the Python script.

| Variable | Default / requirement | Actions source |
| --- | --- | --- |
| `CONFLUENCE_URL` | Required to talk to Confluence; site URL | Repository variable |
| `CONFLUENCE_SPACE_KEY` | Required to talk to Confluence | Repository variable |
| `CONFLUENCE_EMAIL` | Required to talk to Confluence | Repository secret |
| `CONFLUENCE_API_TOKEN` | Required to talk to Confluence | Repository secret |
| `CONFLUENCE_ROOT_TITLE` | `Ikigai wiki` | Optional repository variable |
| `CONFLUENCE_PARENT_ID` | Space homepage | Optional repository variable |
| `WIKI_DIR` | `droid-wiki` | Workflow job sets `droid-wiki` |
| `MMDC` | `mmdc` | Optional command override |

`.github/scripts/publish_confluence.py` defaults preview output to `build/confluence/`. `--dry-run` converts pages and renders diagrams without Confluence writes; if all four required values exist it also makes read-only authentication/space/root-page checks, otherwise it skips those checks. Without that flag, all four values are required for publication. The workflow's `DRY_RUN` controls whether it passes the flag; the script itself does not read `DRY_RUN`.

Actions supplies `GITHUB_ACTIONS` for test reporters and publisher annotation formatting, and `GITHUB_STEP_SUMMARY` for appended test-duration/publishing summaries. The publisher uses `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY`, and `GITHUB_SHA` for source links, preferring the wiki metadata's source commit; locally it falls back to the origin remote/current commit. None is browser runtime configuration. Never put credentials in a `VITE_` variable: Vite exposes those to client code in the public bundle.

### QA workflow environment

`.github/workflows/qa.yml` passes `FACTORY_API_KEY` from repository secrets to the browser-provisioning and agent steps. The agent also receives `CI: true`, `BASE_REF` (PR base or default branch), and normalized false `VIDEO_EVIDENCE`/`COMPOSE` outputs. The secret authenticates Factory tooling, not the app; fork PRs do not receive it. No npm command gains an environment requirement from QA.

`scripts/provision-qa-browser.sh` exports these paths through `GITHUB_ENV`; `scripts/run-qa.sh` validates them before starting the model:

| Variable | Meaning |
| --- | --- |
| `QA_AGENT_BROWSER` | Absolute executable path for agent-browser 0.37.1 |
| `QA_BROWSER_CONFIG` | Absolute path to the empty isolated JSON config under `RUNNER_TEMP` |
| `QA_BROWSER_EXECUTABLE_PATH` | Absolute executable path for the sole managed Chrome cache entry |
| `AGENT_BROWSER_CONFIG`, `AGENT_BROWSER_EXECUTABLE_PATH` | Restored from the two provisioned paths after inherited `AGENT_BROWSER_*` overrides are cleared |
| `AGENT_BROWSER_SESSION` | Owned `qa-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}` session for the model run; provisioning uses a separate `qa-bootstrap-...` session |

The scripts require runner-provided `RUNNER_TEMP`, run IDs/attempts, and `GITHUB_ENV`; the model runner also uses `GITHUB_WORKSPACE` and `BASE_REF`. These are CI script inputs, not local app settings. Every CI browser command must use the absolute provisioned driver and preserve the managed executable/config/session. Do not discover user profiles, attach through CDP, select system Chrome, or upgrade tools during the model run.

The skill documents optional `QA_EVIDENCE_TOKEN` and `REPO_ID` for inline attachments, but neither is currently wired into the Run QA environment. CI evidence stays in text, screenshots, and workflow artifacts; video is prohibited. The report/comment steps use workflow-provided run/artifact URLs and `github.token` for PR comments, not app authentication.

The gate step passes `QA_OUTCOME` to `scripts/check-qa-report.mjs`; the final propagation step also reads `GATE_OUTCOME`. The gate requires the exact main six-column results table and rejects FAIL, BLOCKED, malformed reports, or any unsuccessful process. Only the documented single no-app-diff INCONCLUSIVE row is accepted, without a browser-validation claim. See [Testing](../how-to-contribute/testing.md#reports-and-limits).

## Workflow settings

| Workflow | Setting | Value |
| --- | --- | --- |
| `.github/workflows/deploy-pages.yml` | Triggers | `push` to `main`, `pull_request`, `workflow_dispatch` |
| | Permissions | `contents: read`, `pages: write`, `id-token: write` |
| | Concurrency | Group `pages-${{ github.ref }}`, cancel in progress |
| | Node | 22, with npm cache |
| | Environment | `github-pages` (deploy job, skipped on PRs) |
| `.github/workflows/publish-wiki-to-confluence.yml` | Triggers | `push` to `main` and `pull_request` when `droid-wiki/**`, `.github/scripts/**`, or the workflow file change; `workflow_dispatch` with a `dry_run` boolean input |
| | Job env | `DRY_RUN` (true on PRs or when the input is set), `WIKI_DIR: droid-wiki` |
| | Repository variables | `CONFLUENCE_URL`, `CONFLUENCE_SPACE_KEY` (required); `CONFLUENCE_ROOT_TITLE`, `CONFLUENCE_PARENT_ID` (optional) |
| | Repository secrets | `CONFLUENCE_EMAIL`, `CONFLUENCE_API_TOKEN` |
| | Concurrency | One `confluence-publish` queue for real publishes; per-branch group for PR dry runs; never cancels in progress |
| | Runtimes | Python 3.12 (pip cache), Node 20 for `@mermaid-js/mermaid-cli@11` |
| | Timeout | 20 minutes |

`.github/scripts/puppeteer-config.json` passes `--no-sandbox` to the headless Chrome that mermaid-cli uses to render diagrams.

Additional automation settings:

| Workflow | Settings |
| --- | --- |
| `.github/workflows/e2e.yml` | PRs except changes only under `droid-wiki/**`, plus manual dispatch; `contents: read`, no secrets; workflow/PR-or-ref concurrency with cancellation |
| `.github/workflows/e2e.yml` | Ubuntu, Node 22 with npm cache, `npm ci`, Chromium installation with `--with-deps`, `npm run test:e2e`; job timeout 15 minutes |
| `.github/workflows/e2e.yml` | Failure-only `playwright-report` artifact contains `playwright-report/` and `test-results/`, retained 14 days; no deployment or dependency from Pages |
| `.github/workflows/droid-wiki-refresh.yml` | Pushes to `main` except wiki-only changes; `WIKI_BRANCH: factory/droid-wiki`; repository-wide `droid-wiki-refresh` concurrency without cancellation; 30-minute generation timeout |
| `.github/workflows/droid-wiki-refresh.yml` | Generation has `contents: read` and step-scoped `FACTORY_API_KEY` secret; separate publish job has `contents: write` and `pull-requests: write`. Factory-only upload, disabled video skill and post-generation video guard; one-day artifact handoff |
| `.github/workflows/droid-review.yml` | Non-draft PR with `droid-review` label; only that label triggers a labeled event. Code and shallow security review via `Factory-AI/droid-action@main`, with `FACTORY_API_KEY` secret and `allowed_bots: factory-droid` |
| `.github/workflows/droid.yml` | Event-body/title `@droid` gate; `FACTORY_API_KEY` secret; repository contents read, issue/PR comments write |
| `.github/workflows/qa.yml` | PR `labeled`, `synchronize`, `reopened`, `ready_for_review` events, ignoring wiki-only changes; non-draft plus `qa` label, only `qa` label additions, no Dependabot actor; manual dispatch |
| `.github/workflows/qa.yml` | Job permissions `contents: read`, `pull-requests: write`; Node 24 for QA tooling only, full history; workflow/PR-or-ref concurrency with cancellation at job level |
| `.github/workflows/qa.yml` | Job timeout 25 minutes, agent timeout 20 minutes; required `FACTORY_API_KEY`; `qa-results` artifact retained 14 days; optional/informational, no deployment |
| `.github/workflows/qa.yml` | Explicit project plugin setup, pinned agent-browser 0.37.1 and managed Chrome; video/Compose forbidden; report gate and evidence publication before final failure propagation |

The rolling wiki PR uses the built-in GitHub token, so other workflows do not automatically run on it. Review the diff before merging. See [Wiki refresh](../features/wiki-refresh.md) for its lifecycle and [Dependencies](dependencies.md) for action versions and Dependabot policy.

## TypeScript constants

| Constant | File | Value | Purpose |
| --- | --- | --- | --- |
| `R` | `src/geometry.ts` | `200` | Radius of every circle, in SVG user units |
| `CENTERS` | `src/geometry.ts` | `L: [400, 270]`, `G: [270, 400]`, `N: [530, 400]`, `P: [400, 530]` | Circle centers |
| `ORDER` | `src/data.ts` | `["L", "G", "N", "P"]` | Canonical letter order for [zone keys](../primitives/zone-keys.md) |
| `NS` | `src/main.ts` | `"http://www.w3.org/2000/svg"` | SVG namespace for `createElementNS` |
| `FULL` | `src/main.ts` | `maskUnits: "userSpaceOnUse"`, `x: 0`, `y: 0`, `width: 800`, `height: 800` | Shared mask bounds |

## Tunable values in code

| Value | Location | Effect |
| --- | --- | --- |
| `rgba(255,255,255,.5)` | Overlay loop in `src/main.ts` | Highlight strength for most zones |
| `rgba(255,255,255,.35)` | Overlay loop in `src/main.ts` | Highlight strength for the gold center |
| `140` (ms) | `setZone()` in `src/main.ts` | Delay before new panel content renders |
| `"LGNP"` | `pinned` initial value and final `setZone("LGNP", true)` call in `src/main.ts` | Default zone on load |

## SVG settings in `index.html`

| Setting | Value |
| --- | --- |
| `viewBox` | `40 40 720 720` |
| `#gold` gradient | Center (400, 400), radius 100, stops `#FFF8E3` → `#F8D78F` → `#EDB65A` |

## CSS custom properties

Defined on `:root` in `src/styles.css`. Full descriptions are in [Visual design](../systems/visual-design.md).

```css
--bg: #FBF7F0;
--ink: #2A2521;
--muted: #7A7068;
--line: #E8DFD3;
--love: #F2A29B;
--good: #F5C877;
--needs: #BBA8F0;
--paid: #8CD6C3;
--serif: "Fraunces", Georgia, "Times New Roman", serif;
--sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
```

## Breakpoints

| Max width | File | Change |
| --- | --- | --- |
| 900 px | `src/styles.css` | Single-column layout |
| 600 px | `src/styles.css` | Smaller padding, larger SVG labels |
