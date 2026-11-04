# Getting started

The app is a TypeScript project built with Vite. You need Node.js and npm to run it locally; `package.json` also installs the lint, format, test, coverage, and Git-hook tools.

## Prerequisites

- Node.js 20.19+ or 22.12+, and npm. These are the versions listed in `README.md`. Build and E2E CI use Node 22; only the optional QA job uses Node 24 in `.github/workflows/qa.yml`.
- Git, to clone the repository.
- A current version of Chrome, Edge, Firefox, or Safari. The code uses ES modules, SVG masks, `mix-blend-mode`, `backdrop-filter`, and pointer events.
- An internet connection for the Google Fonts stylesheet. Without it, the page falls back to Georgia and system sans-serif fonts (see `src/styles.css`).

## Clone and install

```bash
git clone https://github.com/FranklinP44/ikigai.git
cd ikigai
npm ci        # exact versions from package-lock.json (what CI runs)
# or: npm install
```

The `prepare` script in `package.json` installs Husky's pre-commit hook. `.husky/pre-commit` lints and formats staged files, then runs type checking, the contributor-instructions check, and unit tests. No `.env` file is needed for app development. The optional Confluence publisher has separate settings in `.env.example`; see [Configuration](../reference/configuration.md).

## Run

```bash
npm run dev       # Vite dev server at http://localhost:5173
```

The dev server compiles `src/main.ts` on request and reloads the page when you save a file. It does not type-check; run `npm run build` (or `npx tsc --noEmit`) to catch type errors.

## Build and preview

```bash
npm run build     # tsc --noEmit, then vite build into dist/
npm run preview   # serve dist/ at http://localhost:4173
```

`dist/` is ignored by Git. Do not open `index.html` or `dist/index.html` directly from disk with `file://`. The root `index.html` uses the browser URL `"/src/main.ts"`, which requires Vite's TypeScript transformation, and the built page loads a module script, which browsers block over `file://`. Use `npm run dev` or `npm run preview`, or any static file server pointed at `dist/`.

## Verify it works

1. The four circles pop in with a short staggered animation, then the labels fade in.
2. The panel on the right shows "Ikigai" with all four circle chips highlighted.
3. Moving the pointer over the diagram highlights the region under it and updates the panel.
4. Clicking a region pins it, so moving the pointer off the diagram returns to that region instead of Ikigai.

## Build and test

Run all five checks required by `AGENTS.md` before finishing a change:

```bash
npm run check:agents-md
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

For a quick unit-test run, use `npm run test`. Tests cover zone data, hit-testing geometry, raw SVG markup in `index.html`, and QA report validation in `scripts/check-qa-report.test.ts`. `vitest.config.ts` collects tests under both `src/` and `scripts/` and requires 100% coverage for the pure app modules, not the DOM-dependent controller or automation scripts. CI runs the five checks above, writes test durations, and uploads reports before the build.

For the fixed browser suite, install Playwright's Chromium once and run:

```bash
npx playwright install chromium
npm run test:e2e
```

`playwright.config.ts` builds and serves the page at http://localhost:4173, then runs eight tests from `e2e/diagram.spec.ts`: initial load, all five Explore buttons, hover and keyboard selection. Outside CI it may reuse a server already on that port, so make sure that server serves the current build or stop it first. The pre-commit hook does not run browser tests; `AGENTS.md` asks for them before pushing page changes. `.github/workflows/e2e.yml` installs Chromium with its Linux dependencies in CI.

Interactive behavior can also be checked through the QA skills described in `AGENTS.md`. Ask Droid to run the `qa` skill against http://localhost:5173; it selects flows from the diff and starts and stops the local server itself. For a non-draft PR, add the `qa` label to request the optional workflow in `.github/workflows/qa.yml`, which needs the `FACTORY_API_KEY` repository secret. It never substitutes the production site for branch testing.

The QA workflow provisions its own pinned browser driver with `scripts/provision-qa-browser.sh`; it is not a prerequisite for ordinary app development. CI permits text and screenshots only. `scripts/check-qa-report.mjs` rejects FAIL, BLOCKED, malformed reports, and unsuccessful QA processes. A tooling-only diff gets one exact INCONCLUSIVE row without browser validation, not an app-test pass.

See [Testing](../how-to-contribute/testing.md) for a manual checklist, [Functional QA](../features/functional-qa.md) for the browser automation, [Development workflow](../how-to-contribute/development-workflow.md) for the edit-reload loop, and [Deployment](../deployment.md) for how `main` is published to GitHub Pages.
