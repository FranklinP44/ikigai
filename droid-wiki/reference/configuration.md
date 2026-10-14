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
| `scripts.check:agents-md` | `node scripts/check-agents-md.mjs` | Checks documented scripts, source paths and identifiers |
| `scripts.prepare` | `husky` | Installs the Git hook during npm installation |
| `devDependencies` | Eight development packages | No runtime `dependencies`; exact ranges and locks in [Dependencies](dependencies.md) |
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

## Tests, linting, formatting, and hooks

| File | Configuration |
| --- | --- |
| `vitest.config.ts` | Merges `vite.config.ts`; collects `src/**/*.test.ts` in Node, with no enabled globals. Uses threaded workers, isolated module graphs, parallel files, shuffled file/test order, and restored mocks |
| `vitest.config.ts` | Slow-test threshold 1000 ms. Default + JSON reporters locally; also GitHub annotations and JUnit on Actions. Outputs `reports/test-results.json` and `reports/junit.xml` |
| `vitest.config.ts` | V8 coverage includes source TypeScript but excludes `src/main.ts` and tests. Statements, branches, functions and lines each require 100%; text, HTML and JSON summary reports go to `coverage/`, including on failure |
| `.oxlintrc.json` | ESLint, TypeScript, Unicorn, Oxc and import plugins; browser/ES2022 environment. Correctness/suspicious categories are errors, performance warnings fail `npm run lint` through `--deny-warnings` |
| `.oxlintrc.json` | Enforces type imports, no explicit `any` or non-null assertions, import checks, kebab-case filenames and identifier capitalization. Config/scripts overrides use Node; scripts permit console output; test overrides enable Vitest rules, including no focused/disabled tests and consistent filenames |
| `.oxlintrc.json` | Ignores `dist/`, `coverage/`, `reports/`, `droid-wiki/`, and `.github/` |
| `.oxfmtrc.json` | Print width 100, avoids arrow parentheses where possible. Ignores `dist/`, `coverage/`, `reports/`, `droid-wiki/`, and `package-lock.json` |
| `package.json` | `lint-staged` runs Oxlint with fixes and denied warnings, then Oxfmt, on staged TS/JS variants. Staged JSON/JSONC/CSS/HTML/Markdown/YAML uses Oxfmt |
| `.husky/pre-commit` | Runs `lint-staged`, `tsc --noEmit`, the AGENTS checker, then `vitest run`, using `npx --no-install` for package binaries |

The hook is not the full completion gate: before finishing, run `npm run check:agents-md`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, and `npm run build`. See [Testing](../how-to-contribute/testing.md) for isolation, shuffle-seed reproduction, and separate functional browser coverage.

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

`.factory/settings.json` defines `extraKnownMarketplaces.factory-plugins.source` with `source: github` and `repo: Factory-AI/factory-plugins`; `enabledPlugins` maps `droid-control@factory-plugins` to `true`. Capture and Verify run for functional QA; Compose loads only with both video and Compose enabled. See [Functional QA](../features/functional-qa.md).

## `.gitignore`

| Pattern | Why |
| --- | --- |
| `node_modules/` | Installed packages |
| `dist/`, `*.tsbuildinfo` | Vite and TypeScript output |
| `coverage/`, `reports/` | Coverage and Vitest JSON/JUnit reports |
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

`.github/workflows/qa.yml` passes `FACTORY_API_KEY` from repository secrets only to the agent step, along with `CI: true`, `BASE_REF` (PR base or default branch), and normalized `VIDEO_EVIDENCE`/`COMPOSE` outputs read from the YAML config. The secret is for the CI agent, not the app; fork PRs do not receive it. No npm command gains an environment requirement from QA.

The skill documents optional `QA_EVIDENCE_TOKEN` and `REPO_ID` for inline attachments, but neither is currently wired into the Run QA environment. Without an upload token, evidence stays in text and workflow artifacts. Enabling video does not itself supply credentials. The report/comment steps use workflow-provided run/artifact URLs and `github.token` for PR comments, not app authentication.

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
| `.github/workflows/droid-wiki-refresh.yml` | Pushes to `main` except wiki-only changes; `WIKI_BRANCH: factory/droid-wiki`; repository-wide `droid-wiki-refresh` concurrency without cancellation; 30-minute generation timeout |
| `.github/workflows/droid-wiki-refresh.yml` | Generation has `contents: read` and step-scoped `FACTORY_API_KEY` secret; separate publish job has `contents: write` and `pull-requests: write`. Factory-only upload, disabled video skill and post-generation video guard; one-day artifact handoff |
| `.github/workflows/droid-review.yml` | Non-draft PR with `droid-review` label; only that label triggers a labeled event. Code and shallow security review via `Factory-AI/droid-action@main`, with `FACTORY_API_KEY` secret and `allowed_bots: factory-droid` |
| `.github/workflows/droid.yml` | Event-body/title `@droid` gate; `FACTORY_API_KEY` secret; repository contents read, issue/PR comments write |
| `.github/workflows/qa.yml` | PR `labeled`, `synchronize`, `reopened`, `ready_for_review` events, ignoring wiki-only changes; non-draft plus `qa` label, only `qa` label additions, no Dependabot actor; manual dispatch |
| `.github/workflows/qa.yml` | Job permissions `contents: read`, `pull-requests: write`; Node 22, full history; workflow/PR-or-ref concurrency with cancellation at job level |
| `.github/workflows/qa.yml` | Job timeout 25 minutes, agent timeout 20 minutes; required `FACTORY_API_KEY`; `qa-results` artifact retained 14 days; optional/informational, no deployment |

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
