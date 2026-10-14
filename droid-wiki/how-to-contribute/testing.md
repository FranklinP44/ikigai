# Testing

Vitest checks pure logic, markup consistency, and the QA report gate. Playwright runs a fixed Chromium suite against the built page; optional functional QA and manual checks cover broader interactions and visual behavior.

Active contributors: FranklinP44

## Purpose

Use this page to choose tests and interpret reports. Run `npm run test` once or `npm run test:watch` while editing. The complete contribution gate is `npm run check:agents-md`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, then `npm run build`. See [Development workflow](development-workflow.md).

## Unit tests

Vitest is configured in `vitest.config.ts`, which extends `vite.config.ts`. Tests run in Node with no DOM, so they cover the pure modules and read markup as text.

| File | What it checks |
| --- | --- |
| `src/data.test.ts` | `ZONE_KEYS` order and uniqueness, `isZoneKey()`, that `ZONES`, `EXAMPLES` and `CIRCLE` have exactly the right keys, three examples per zone, eyebrows that match the number of circles, and examples free of markup (they are rendered with `innerHTML`) |
| `src/geometry.test.ts` | `zoneAt()` at known points (labels, dots, edges, outside), and a scan of every integer point that confirms the circles only form known zones and reach all 13 |
| `src/index-html.test.ts` | that the circles and outlines in `index.html` match `CENTERS` and `R`, that the dots and pair labels sit in the right zones, that each pill has a valid `data-zone` and matching title, and that every `byId()` id in `src/main.ts` exists in `index.html` |
| `scripts/check-qa-report.test.ts` | Main-table parsing, accepted Result markers, FAIL/BLOCKED rejection, malformed and fragmented reports, exact no-app-diff handling, process failures, missing files, and CLI exit status |

Conventions, enforced by `vitest.config.ts` and the `vitest` lint rules in `.oxlintrc.json`:

- Unit test files sit next to the module they cover and end in `.test.ts`. Other names, such as `.spec.ts` under `src/`, fail lint. The separate Playwright suite uses `e2e/diagram.spec.ts`; the Vitest lint override covers `src/` tests and `scripts/**/*.test.ts`, not `e2e/`.
- Vitest collects `src/**/*.test.ts` and `scripts/**/*.test.ts`. Import `describe`, `it`, and `expect` explicitly; globals are off. Follow `AGENTS.md`: one `describe` per exported name, sentence-like behavior titles, and `it.each` for tables.
- Tests use the Node environment, threaded workers, isolation, parallel files, and restored mocks. Each file has a fresh module graph; file and test order is shuffled. Rerun with `npx vitest run --sequence.seed=<seed>` (printed at run start) to reproduce an order-dependent failure.
- Never import `src/main.ts` as executable code: it queries the DOM on load. Read it or `index.html` as raw text, following `src/index-html.test.ts`.
- `.only` and `.skip` fail lint.

## Coverage and durations

`npm run test:coverage` runs the suite with V8 coverage over `src/data.ts` and `src/geometry.ts` and fails if statements, branches, functions or lines fall below 100%. `src/main.ts` is excluded because it touches the DOM as it loads. Add tests for new pure-module code; do not lower thresholds, widen exclusions, or skip failing tests. Text coverage prints to the console; HTML and a JSON summary are written under `coverage/`. Coverage is reported on test failure too.

The QA gate regressions run in that same suite and in the pre-commit hook, but `scripts/check-qa-report.mjs` is outside `vitest.config.ts`'s `src/**/*.ts` coverage include. Its CLI tests use isolated temporary report files and child Node processes; they do not launch a browser or validate app behavior.

Every Vitest run also writes `reports/test-results.json`. GitHub Actions adds failure annotations and `reports/junit.xml`. `npm run test:durations` reads the JSON and prints total time, file durations, and the ten slowest tests. Tests over 1 second or a suite over 10 seconds generate warnings rather than failures; Vitest itself highlights tests slower than 1 second.

CI adds the duration table to its job summary and uploads `coverage/` and `reports/` as `test-reports` between coverage and the production build. Both reporting steps use a not-cancelled condition, so they can run after a preceding failure. The geometry grid scan visits every integer point in the circles' bounding square; keep new tests fast, and explain any intentionally slow test. See [Debugging](debugging.md) for missing reports or coverage failures.

## Automated check: type checking

`npm run build` runs `tsc --noEmit && vite build`. The type check uses the strict settings in `tsconfig.json` (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) over everything in `src/`, including the tests.

What the type check catches:

- A zone key missing from `ZONES` or `EXAMPLES`, because both are typed `Record<ZoneKey, ...>` in `src/data.ts`.
- A misspelled zone key such as `"LGX"` anywhere a `ZoneKey` is expected.
- Wrong element types passed to `byId()` or `el()` in `src/main.ts`.

What neither the type check nor the unit tests catch:

- Anything visual or interactive, such as hover, click and the swap animation.
- Styling and responsive layout.

## Playwright end-to-end tests

`package.json` defines `npm run test:e2e` as `playwright test`. Install its browser once, then run from the repository root:

```sh
npx playwright install chromium
npm run test:e2e
```

On Linux systems missing browser libraries, use `npx playwright install --with-deps chromium`, as `.github/workflows/e2e.yml` does. `AGENTS.md` asks contributors to run E2E before pushing page changes; the pre-commit hook does not run it.

`playwright.config.ts` collects `e2e/`, runs fully parallel tests in one Chromium project using the Desktop Chrome preset, and sets `baseURL` to http://localhost:4173. Its web server command is `npm run build && npm run preview -- --port 4173 --strictPort`, with a 120-second startup timeout, not a per-test timeout. Outside CI, an existing server may be reused and that command skipped. Stop stale previews first to avoid testing another build. CI never reuses a server.

`e2e/diagram.spec.ts` opens `/` before each of eight expanded cases:

| Cases | Assertions |
| --- | --- |
| Initial load | Page title, visible diagram, 13 zone groups, Ikigai panel title, all chips on, active Ikigai pill |
| Five Explore pills | Ikigai (`LGNP`), Passion (`LG`), Mission (`LN`), Profession (`GP`), and Vocation (`NP`); panel title, active pill key, active overlay key |
| Passion hover and leave | SVG point `(282, 287)` shows Passion, the hovering class, and two off chips; moving to the page heading restores Ikigai and clears hovering |
| Tab and Enter | Tab focuses Ikigai then Passion; Enter shows Passion and activates its pill |

The `moveToSvgPoint()` helper in `e2e/diagram.spec.ts` scrolls the diagram into view, transforms a `DOMPoint` through `getScreenCTM()`, and moves the real mouse. Hovering a zone group by selector does not exercise the coordinate-based hit test.

Locally the runner uses the list reporter, no retries, and no automatic HTML report. In CI it forbids `.only`, retries once, and enables GitHub annotations plus an HTML report that never auto-opens (`playwright.config.ts`). Traces are recorded on the first retry; a default local run has no retry to trace. For local HTML output, explicitly select it with `npm run test:e2e -- --reporter=html`.

`.github/workflows/e2e.yml` runs on PRs except wiki-only changes and on manual dispatch. It installs Chromium with system dependencies and runs the suite without secrets or Factory credits. On failure it uploads `playwright-report/` and `test-results/` as the `playwright-report` artifact for 14 days. See [Debugging](debugging.md#playwright-failures).

These tests do not cover diagram click-to-pin, hover probes for all 13 zones, console-error checks, Space activation, phone layout, or non-Chromium browsers. Counting 13 groups is not testing all 13 interactions. Keep the manual checklist and optional QA below; the 100% Vitest coverage threshold is not browser coverage.

## Manual checklist

Run this after any change to `src/main.ts`, `src/styles.css` or `index.html`. It takes about two minutes. Use `npm run dev`, or `npm run preview` to check the production bundle.

### Load

- [ ] The page loads with no errors in the DevTools console.
- [ ] The circles pop in one after another, then labels and outlines fade in.
- [ ] The panel shows "Ikigai" with all four chips on.

### Diagram interaction

- [ ] Hovering each of the four single-circle areas shows that circle's name and the eyebrow "One circle".
- [ ] Hovering each named pair (Passion, Mission, Profession, Vocation) highlights the region and updates the panel.
- [ ] Hovering near each white dot shows a three-circle zone.
- [ ] The cursor becomes a pointer over the circles and returns to normal outside them.
- [ ] Moving outside the circles returns the panel to the pinned zone.
- [ ] Clicking a zone pins it. Leaving the diagram then shows that zone instead of Ikigai.

### Explore buttons

- [ ] Each of the five pills switches the zone and shows the active (dark) style.
- [ ] The pill for the pinned zone stays active; hovering a different zone deactivates it until the pointer leaves.
- [ ] Tab through the five pills. Focus alone leaves the selected zone unchanged; Enter and Space select and pin the focused zone.
- [ ] The focused pill has a visible ring before and after activation, including the initially active Ikigai pill. `src/styles.css` defines a 2 px ink outline with a 3 px offset on `.pill:focus-visible`; check it against the dark active fill and the light inactive fill.

### Responsive

- [ ] At widths below 900 px, the panel stacks under the diagram.
- [ ] At widths below 600 px, the SVG labels are still readable.
- [ ] On a touch device or touch emulation, tapping a zone pins it.
- [ ] Relevant Explore pills can be focused and activated from the keyboard; check visible focus.
- [ ] Check at least one Chromium browser and one of Firefox or Safari for page changes.

### After deploy

- [ ] https://franklinp44.github.io/ikigai/ loads with styles and scripts (no 404s for files under `assets/` in the Network tab).

## Browser tests

`.factory/skills/qa/SKILL.md` orchestrates optional functional checks through droid-control, whose web route uses agent-browser. Unlike the fixed Playwright suite, this selects flows from the diff and needs the Factory secret in CI. It is not a DOM environment for Vitest. The 100% threshold still describes the pure modules, not browser or accessibility coverage. Keep the manual checklist above for visual judgment and cross-browser checks. See [Functional QA](../features/functional-qa.md) for the full execution model.

### Requesting functional QA

- **Locally:** ask Droid in this repository to run the `qa` skill against http://localhost:5173. It starts and stops a server from the working tree, including any Vite child process it starts.
- **On a PR:** add `qa` to a non-draft PR. `.github/workflows/qa.yml` reruns on new commits while labeled, with eligible reopen/ready-for-review events too. It needs the `FACTORY_API_KEY` repository secret and is optional, not a required merge check.
- **Manually in Actions:** dispatch the QA workflow to compare that ref with the repository default branch.

`.factory/skills/qa/config.yaml` defaults to local Vite at http://localhost:5173; its preview is the locally served build at http://localhost:4173, not a hosted branch deployment. Never test production for a PR or CI run. If the local server fails, report BLOCKED instead of falling back to Pages.

### Flow selection

`.factory/skills/qa-web/SKILL.md` defines a menu, not a mandatory full-suite checklist:

| Flow | What it verifies |
| --- | --- |
| 1 | Page load, initial center content, 13 overlays, active pill |
| 2 | Hovered content, chips, examples, active overlays, outside-circle boundary |
| 3 | Click-to-pin, temporary hover, restore on leave, outside clicks |
| 4 | Five Explore pills and persistent selection |
| 5 | Tab order, visible focus, Enter/Space activation |
| 6 | Console errors, locally built page, relative assets, one hover and pill |
| 7 | Narrow layout and taps when styling/layout changes |

The orchestrator maps the diff to app files, excludes `src/**/*.test.ts`, and runs only relevant and adjacent flows plus change-specific tests. At least half the tests must directly verify the change; include a related negative boundary/error path. A docs-only, CI-only, or test-only diff with no matched app files produces one INCONCLUSIVE row and runs no app pre-flight or flows. Build/package configuration does match the web app; "config-only" does not mean all configuration files are excluded.

`.factory/skills/qa/SKILL.md` requires the exact single no-app-diff row, including its final punctuation and "No browser validation performed." Notes. QA-tooling-only diffs need separately authorized targeted QA before anyone claims app validation. Installing the browser and opening `about:blank` in `scripts/provision-qa-browser.sh` is tool readiness, not an app test.

Use the anonymous `visitor` persona. Interact with real pointer movement, clicks, and keys, not calls to handlers or synthetic JavaScript events. Read expected content from the branch's `src/data.ts`; allow the panel swap to complete before checking it. There are no login or permission tests.

### Reports and limits

The skill uses `.factory/skills/qa/REPORT-TEMPLATE.md` and writes `qa-results/report.md`. Results are PASS, FAIL, BLOCKED, FLAKY, or INCONCLUSIVE; incomplete flows need a reason and remediation, not silent omission. Evidence is primarily text snapshots in one collapsed block. Screenshots and logs are downloadable CI artifacts kept for 14 days, and repeated PR runs update one report comment.

Video and Compose both default to false in `.factory/skills/qa/config.yaml`, and `.github/workflows/qa.yml` and `scripts/run-qa.sh` reject enabling either in CI. Evidence there is text and screenshots only. With `failure_learning: suggest_in_report`, new environment insights are suggestions only, not automatic skill edits.

`scripts/check-qa-report.mjs` requires `## QA Report`, the six template columns, a separator, and at least one complete contiguous result row with unique positive integer IDs. Unknown or mismatched statuses, placeholders, malformed tables, FAIL, BLOCKED, and unsuccessful QA processes fail the gate. Legends, Notes, and evidence are not Result cells. FLAKY alone is accepted; INCONCLUSIVE is accepted only as the exact no-app-diff row. A green job therefore does not prove every flow passed.

The workflow publishes artifacts and the report before its final step propagates process or gate failure. `scripts/run-qa.sh` preserves the provisioned absolute driver/config/browser paths and uses an owned session; CI must not switch drivers, attach to another browser, or record video. See [Configuration](../reference/configuration.md#qa-workflow-environment). QA does not run or report static gates; flow 6 builds only to serve and inspect the bundled page. The five required contribution checks remain unchanged.

## Key source files

`src/data.test.ts`, `src/geometry.test.ts`, `src/index-html.test.ts`, `scripts/check-qa-report.test.ts`, `scripts/check-qa-report.mjs`, `scripts/provision-qa-browser.sh`, `scripts/run-qa.sh`, `vitest.config.ts`, `playwright.config.ts`, `e2e/diagram.spec.ts`, `.github/workflows/e2e.yml`, `.oxlintrc.json`, `scripts/report-test-durations.mjs`, `.github/workflows/deploy-pages.yml`, `.factory/skills/qa/SKILL.md`, `.factory/skills/qa/config.yaml`, `.factory/skills/qa-web/SKILL.md`, and `.github/workflows/qa.yml`.
