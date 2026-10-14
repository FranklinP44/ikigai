# AGENTS.md

Instructions for coding agents and contributors working in this repository.

## Project

A single-page, interactive four-circle Ikigai diagram. Plain HTML, CSS, and browser TypeScript with no runtime dependencies, bundled by Vite and deployed to GitHub Pages. See `README.md` for the file layout and `droid-wiki/` for deeper architecture notes.

## Setup and commands

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install           # install dependencies and the Husky pre-commit hook
npm run dev           # dev server at http://localhost:5173
npm run build         # type-check (tsc --noEmit), then build into dist/
npm run lint          # Oxlint; warnings fail the run
npm run lint:fix      # apply Oxlint autofixes
npm run format        # format files in place with Oxfmt
npm run format:check  # fail if any file is not formatted
npm run test          # run the Vitest unit tests once
npm run test:watch    # rerun the unit tests on every change
npm run test:coverage # run the unit tests once with coverage; fails below the thresholds
npm run test:durations   # summarize how long the last test run took, slowest tests first
npm run test:e2e      # build, serve on 4173, and run the Playwright end-to-end tests in Chromium
npm run preview       # serve dist/ at http://localhost:4173
npm run check:agents-md  # fail if this file no longer matches the code
```

Before finishing a change, run `npm run check:agents-md`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, and `npm run build`. CI (`.github/workflows/deploy-pages.yml`) runs the same five checks on every pull request, and also runs `npm run test:durations` and uploads the test and coverage reports as a build artifact between the coverage and build steps.

## Environment variables

The app and every `npm run` command above need no environment variables and no `.env` file. The only consumer is `.github/scripts/publish_confluence.py` (Confluence wiki publishing), whose variables are listed with defaults in `.env.example` and in the README. Copy the template to `.env` to run that script locally; `.env` files are gitignored, so never commit real credentials, and do not add variables with Vite's client prefix unless the page truly needs them, because Vite inlines those into the public bundle.

## Tests

Unit tests use [Vitest](https://vitest.dev/), configured in `vitest.config.ts`. `npm run test` runs them once; `npm run test:watch` reruns them on change.

- **Naming and location.** Put a test next to the module it covers, named after it with a .test.ts suffix: `src/geometry.test.ts` covers `src/geometry.ts`. Tests that check `index.html` live in `src/index-html.test.ts`. Vitest only collects .test.ts files under `src/`, and the lint rule `vitest/consistent-test-filename` rejects other names such as .spec.ts.
- **Structure.** One `describe` block per exported name, with `it` titles that read as sentences about behavior. Import `describe`, `it`, and `expect` from `vitest`; globals are off. Use `it.each` for tables of cases.
- **What to test.** Tests run in Node with no DOM. Test `src/data.ts` and `src/geometry.ts` directly. Never import `src/main.ts`, because it queries the DOM when it loads; read it or `index.html` as text with a `?raw` import instead, as `src/index-html.test.ts` does.
- **Isolation.** Each test file runs in its own worker thread with a fresh module graph (`pool` set to `threads`, `isolate` on), and `shuffle` randomizes file and test order on every run. Tests must not depend on order or on state left by another test. Vitest prints the seed at the start of a run; rerun with `npx vitest run --sequence.seed=<seed>` to reproduce an order-dependent failure.
- **Coverage.** `npm run test:coverage` measures coverage of `src/data.ts` and `src/geometry.ts` and fails if statements, branches, functions, or lines drop below the `thresholds` in `vitest.config.ts` (100% each). `src/main.ts` is excluded because it cannot run without a DOM. When you add code to the pure modules, add tests for it; do not lower the thresholds or widen the coverage `exclude` list to get a green run.
- **Duration.** Tests slower than `slowTestThreshold` (1 second) are highlighted in the output. Every run writes a JSON report that `npm run test:durations` (`scripts/report-test-durations.mjs`) turns into a table of file and test durations; it warns about any test over 1 second or a suite over 10 seconds. In CI the table goes to the job summary. Keep new tests fast; if one must be slow, say why in the test.
- **Keeping tests current.** When you change zone content, circle geometry, or the SVG markup, run the tests and update the expectations that intentionally changed. Do not delete or skip a failing test to get a green run; `vitest/no-disabled-tests` and `vitest/no-focused-tests` fail lint on skipped and focused tests.

## End-to-end tests

[Playwright](https://playwright.dev/) drives the built page in Chromium. `playwright.config.ts` starts `npm run build` and `vite preview` on port 4173 (or reuses a server already there outside CI), and the tests live in `e2e/diagram.spec.ts`: page load, the Explore pills, hover, and keyboard selection.

- Install the browser once with `npx playwright install chromium`, then run `npm run test:e2e`.
- Hover is computed from pointer coordinates, so tests convert an SVG point to screen coordinates and move the real mouse there; hovering a `g.zone` element by selector does nothing.
- `.github/workflows/e2e.yml` runs the suite on every pull request and uploads `playwright-report/` and `test-results/` when it fails.
- The pre-commit hook does not run these tests, because they need a browser and a build. Run them before pushing changes to the page.

## Keeping this file current

`scripts/check-agents-md.mjs` validates this file against the repository. It fails when:

- an `npm run` command here is missing from `package.json`, or a `package.json` script or CI `npm run` step is not documented here;
- a file path cited in inline code does not exist;
- an identifier, CSS name, attribute, or lint rule cited in inline code no longer appears in `src/`, `index.html`, or the config files.

When you rename, add, or remove something this file mentions, update this file in the same change. Do not weaken the checker to make it pass.

## Pre-commit hook

`.husky/pre-commit` runs `lint-staged` (Oxlint with autofix, then Oxfmt, on staged files; configured under `lint-staged` in `package.json`), then `tsc --noEmit`, then the AGENTS.md check, then the unit tests (`vitest run`, under a second). Fix the reported problems instead of bypassing the hook with `--no-verify`.

## Issues and pull requests

- **Ownership.** `.github/CODEOWNERS` makes @FranklinP44 the owner of every path; GitHub requests a review from the owner automatically on pull requests. Add a more specific line below the catch-all when a path gets a different owner.
- **Pull requests.** GitHub fills the description from `.github/pull_request_template.md`. Keep its sections: a summary that links the issue, the type of change, the five checks above ticked as run, manual browser checks for page changes, and the checklist. Use a conventional prefix such as `fix:` or `docs:` in the title. To request a Droid code and security review, add the droid-review label; reviews do not run without it.
- **Dependency updates.** Dependabot (`.github/dependabot.yml`) opens pull requests every week for npm packages and GitHub Actions, and every month for the pip packages in `.github/scripts/requirements.txt`, and waits 7 days after a release (14 for npm majors) before proposing it. Minor and patch bumps of dev dependencies arrive grouped in one pull request, major bumps arrive one per package, Actions updates arrive in one pull request, and `vitest` and `@vitest/coverage-v8` always move together. Majors of `vitest`, `@vitest/coverage-v8`, and `lint-staged` are ignored because their current majors require Node 22, below which this repository still supports Node 20.19; upgrade those by hand only together with the Node floor. Before merging any other major bump, review its changelog and check that `npm view <package>@<version> engines.node` still allows Node 20.19, because CI builds on Node 22 and would not catch it. Merge only when the CI checks pass. Do not hand-edit versions in `package-lock.json`; update dependencies with `npm install` so the lockfile stays consistent.
- **Issues.** Open issues with the forms in `.github/ISSUE_TEMPLATE/` (bug report, feature request, accessibility issue); each one applies its matching label (bug, enhancement, or accessibility) and asks for steps to reproduce or acceptance criteria.

## QA testing

Droid QA skills live in `.factory/skills/`: `.factory/skills/qa/SKILL.md` picks flows from the diff, `.factory/skills/qa-web/SKILL.md` describes the page's flows and how to judge them, and `.factory/skills/qa/config.yaml` holds the environments and evidence settings. `.factory/settings.json` enables the droid-control plugin that drives the browser.

- **On a pull request.** Add the qa label to a non-draft pull request to run `.github/workflows/qa.yml`. It starts the dev server from the branch, tests http://localhost:5173, and posts the report as one PR comment that later runs update. New commits re-run it while the label is present. It needs the FACTORY_API_KEY repository secret and is not a required check.
- **Locally.** Run Droid in this repository and ask it to run the qa skill against http://localhost:5173. The skill starts and stops the dev server itself.
- **Never test production.** The GitHub Pages site serves main, so it says nothing about a branch.

## Generated wiki

`droid-wiki/` is generated by Factory's wiki skill and refreshed by `.github/workflows/droid-wiki-refresh.yml` on every push to main, except pushes that only change `droid-wiki/`. Each run updates the pages whose code changed, uploads the wiki to Factory, and opens or updates one rolling pull request from the factory/droid-wiki branch titled "docs: refresh wiki". The video overview is turned off, and the run fails if one is generated.

- That pull request is opened with the built-in GitHub token, so no CI checks run on it. Review the diff yourself before merging; merging publishes the changed pages to Confluence.
- A refresh can rewrite pages edited by hand. Make lasting wiki edits in the rolling pull request, or expect the next refresh to revise them.
- This file links to `droid-wiki/how-to-contribute/patterns-and-conventions.md`. If a refresh renames or removes that page, update the link; `npm run check:agents-md` fails on a missing path.

## Naming conventions

Oxlint enforces the mechanical parts of these rules (`unicorn/filename-case`, `id-match`, and `new-cap` in `.oxlintrc.json`). Follow the rest by matching the existing code.

| Kind                                    | Convention                                                        | Examples                                         |
| --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| Source and config files                 | kebab-case, lowercase                                             | `geometry.ts`, `vite.config.ts`                  |
| Functions and local variables           | camelCase, verb-first for functions                               | `zoneAt`, `setZone`, `zoneForEvent`, `swapTimer` |
| Type guards                             | `is` + type name                                                  | `isZoneKey`                                      |
| Module-level constant data and settings | SCREAMING_SNAKE_CASE                                              | `ORDER`, `ZONE_KEYS`, `CENTERS`, `R`             |
| DOM element references                  | camelCase; suffix `El` when the name would otherwise be ambiguous | `svg`, `zonesLayer`, `titleEl`, `chipsEl`        |
| Types, interfaces, and classes          | PascalCase; key unions end in `Key`                               | `ZoneKey`, `CircleKey`, `Zone`, `Attrs`          |
| Generic type parameters                 | single uppercase letter                                           | `T`, `K`                                         |
| Object keys for zones and circles       | the zone key letters in `L-G-N-P` order                           | `L`, `LG`, `LGNP`                                |
| HTML `id` attributes                    | camelCase                                                         | `centerFill`, `examples`                         |
| CSS classes and custom properties       | kebab-case                                                        | `.label-center-jp`, `--love`                     |
| `data-*` attributes                     | kebab-case name; zone keys as values                              | `data-zone="LG"`                                 |

Do not use snake_case identifiers, leading or trailing underscores, or `$` in names.

## Code conventions

- Keep content in `src/data.ts` and pure geometry in `src/geometry.ts`; only `src/main.ts` touches the DOM.
- Use the `ZoneKey` and `CircleKey` unions instead of `string`, and validate external strings with `isZoneKey()` instead of casting.
- Mark type-only imports with `type` (`verbatimModuleSyntax` is on).
- Look up elements with `byId(id, Type)` and create SVG nodes with `el(tag, attrs, parent)`.
- Change the selected zone only through `setZone()`.
- Never pass user input to `innerHTML`; it is used only for static content from `src/data.ts`.

More detail: `droid-wiki/how-to-contribute/patterns-and-conventions.md`.
