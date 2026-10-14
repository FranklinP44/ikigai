# Tooling

TypeScript and Vite build the dependency-free browser app; Oxlint, Oxfmt, Vitest, and Git hooks validate contributions. Optional Droid functional QA exercises browser behavior separately.

Active contributors: FranklinP44

## Purpose

Use this reference for local commands and repository automation. Exact dependency versions belong in [Dependencies](../reference/dependencies.md), and workflow execution details in [Deployment](../deployment.md).

## Local tools

| Tool | Role |
| --- | --- |
| npm | Uses committed `package-lock.json`; CI installs with `npm ci`. `package.json` has eight dev dependencies and no runtime dependencies. |
| TypeScript | Strict checking with no emitted JavaScript; Vite transpiles. `tsconfig.json` also rejects unused locals and parameters. |
| Vite | Dev server, production bundle, and preview; `vite.config.ts` uses relative asset URLs. |
| Oxlint | `.oxlintrc.json` enables correctness, suspicious-code, performance, naming, import, TypeScript, and test rules. Warnings fail `npm run lint`. Used instead of typescript-eslint because this project uses TypeScript 7. |
| Oxfmt | `.oxfmtrc.json` sets a 100-column print width and omits arrow parentheses when possible. Generated output, the lockfile, and `droid-wiki/` are ignored. |
| Vitest and V8 coverage | Node-based tests, isolated threads, shuffled order, reports, and 100% pure-module coverage. See [Testing](testing.md). |
| Husky and lint-staged | Installation configures `.husky/pre-commit`; staged code is linted/autofixed and formatted before project type checking, the instructions check, and unit tests. See [Development workflow](development-workflow.md). |

Oxlint ignores `dist/`, `coverage/`, `reports/`, `droid-wiki/`, and `.github/`. Its Node script override permits console output in `scripts/`; app console warnings still fail lint.

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
| `npm run check:agents-md` | Check contributor instructions against the repository |

Before finishing, run `check:agents-md`, `lint`, `format:check`, `test:coverage`, and `build` through npm, in that order.

## Instruction and report scripts

`scripts/check-agents-md.mjs` checks `AGENTS.md` bidirectionally against non-lifecycle npm scripts and CI npm commands. It also validates inline paths and cited identifiers, CSS names, attributes, and lint rules against source/configuration. Keep the instructions current; do not weaken the checker.

`scripts/report-test-durations.mjs` reads `reports/test-results.json`, prints suite/file durations and the ten slowest tests, and appends the table to the Actions job summary when configured. Tests over 1 second or a suite over 10 seconds produce warnings, not failing gates.

## Functional QA tooling

`.factory/skills/qa/SKILL.md` is the diff-aware orchestrator; `.factory/skills/qa-web/SKILL.md` is the browser-flow menu. `.factory/skills/qa/config.yaml` supplies environment URLs, app matching/exclusions, the anonymous visitor, and evidence settings. It declares `test_tool: agent-browser` and `build_command: "npm run build"` but no `dev_command` or `port`; server commands live in the web skill. Generic wiki screenshot discovery therefore cannot discover a capture-ready app from those fields.

`.factory/settings.json` registers the `factory-plugins` marketplace from `Factory-AI/factory-plugins` and enables `droid-control@factory-plugins`. Droid installs the plugin at project scope on startup; the QA pre-flight checks activation with `droid plugin list --scope project`. Its browser-use route drives agent-browser with Capture and Verify; Compose is loaded only when both `video_evidence` and `droid_control.compose` are true. These are external agent tools, not app dependencies or npm scripts.

`.github/workflows/qa.yml` installs Node 22, npm packages, and Factory Droid, then invokes the skills. It is an optional, informational workflow gated by the `qa` PR label, or manual dispatch. `FACTORY_API_KEY` is required in CI; no app credentials or `.env` are needed. Local runs use localhost:5173 and built-page preview uses localhost:4173. Never use production as a branch-testing fallback.

Current evidence settings are `imagemagick: false`, `video_evidence: false`, `droid_control.compose: false`, and `failure_learning: suggest_in_report`. The workflow reads flags with runner-provided `yq`. It conditionally installs ImageMagick, ffmpeg for video or Compose, and clang/libclang/libx264 development packages for Compose. No such optional packages are requested by the current false defaults. Compose renderer setup belongs to the plugin, not npm installation for the app.

Reports use text snapshots plus downloadable screenshots/logs under gitignored `qa-results/`; the workflow updates one PR comment. Optional attachment upload requires `QA_EVIDENCE_TOKEN` and agent-step environment wiring, absent by default. See [Functional QA](../features/functional-qa.md), [Testing](testing.md), and [Configuration](../reference/configuration.md) before changing flows or evidence behavior.

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

`package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `.oxlintrc.json`, `.oxfmtrc.json`, `.husky/pre-commit`, `scripts/check-agents-md.mjs`, `scripts/report-test-durations.mjs`, `.github/dependabot.yml`, `.factory/settings.json`, `.factory/skills/qa/config.yaml`, and `.github/workflows/qa.yml`.
