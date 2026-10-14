# Ikigai

An interactive four-circle Ikigai diagram. Hover or tap any region to read about it.

Built with TypeScript and [Vite](https://vite.dev/).

## Requirements

Node.js 20.19+ or 22.12+, and npm.

## Commands

```sh
npm install       # install dependencies
npm run dev       # start the dev server at http://localhost:5173
npm run build     # type-check, then build static files into dist/
npm run lint      # lint with Oxlint (warnings fail the run)
npm run lint:fix  # apply Oxlint autofixes
npm run format    # format files in place with Oxfmt
npm run format:check  # fail if any file is not formatted
npm run test      # run the Vitest unit tests once
npm run test:watch  # rerun the unit tests on every change
npm run test:coverage  # run the unit tests with coverage (fails below 100% for data.ts and geometry.ts)
npm run test:durations  # summarize how long the last test run took, slowest tests first
npm run preview   # serve the built dist/ at http://localhost:4173
npm run check:agents-md  # fail if AGENTS.md no longer matches the code
```

The built page must be served over HTTP (for example with `npm run preview` or any static file host); opening `dist/index.html` directly from disk is not supported.

## Environment variables

The app needs none. Every command above works without a `.env` file, and the page reads no environment variables at runtime.

The only script that reads environment variables is `.github/scripts/publish_confluence.py`, which publishes `droid-wiki/` to Confluence. `.env.example` lists each variable with its default and where CI gets it from. To run the script locally, copy the template to `.env` (it is gitignored), fill it in, and load it into your shell:

```sh
cp .env.example .env
set -a; . ./.env; set +a
python .github/scripts/publish_confluence.py --dry-run
```

| Variable                | Required            | Purpose                                                         |
| ----------------------- | ------------------- | --------------------------------------------------------------- |
| `CONFLUENCE_URL`        | To publish          | Confluence Cloud site URL, such as `https://acme.atlassian.net` |
| `CONFLUENCE_SPACE_KEY`  | To publish          | Key of the target space                                         |
| `CONFLUENCE_EMAIL`      | To publish          | Atlassian account email for the API token                       |
| `CONFLUENCE_API_TOKEN`  | To publish          | Atlassian API token (secret)                                    |
| `CONFLUENCE_ROOT_TITLE` | No (`Ikigai wiki`)  | Title of the root page that holds the wiki                      |
| `CONFLUENCE_PARENT_ID`  | No (space homepage) | Page to create the root page under                              |
| `WIKI_DIR`              | No (`droid-wiki`)   | Wiki folder to publish                                          |
| `MMDC`                  | No (`mmdc`)         | mermaid-cli command used to render diagrams                     |

`--dry-run` works without the four Confluence variables; it then only converts pages and renders diagrams into `build/confluence/`. GitHub Actions also sets `GITHUB_ACTIONS`, `GITHUB_STEP_SUMMARY`, `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY`, and `GITHUB_SHA`; leave them unset locally.

## Deployment

Pushes to `main` are built and deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`. Pull requests run the same AGENTS.md check, lint, format check, unit tests with coverage, and build without deploying. Each run also writes a test duration summary to the job summary and uploads the coverage and test reports as the `test-reports` artifact.

## Pre-commit hook

`npm install` sets up a [Husky](https://typicode.github.io/husky/) pre-commit hook. It runs [lint-staged](https://github.com/lint-staged/lint-staged), which lints (with autofix) and formats the staged files, then type-checks the project with `tsc --noEmit`, runs the AGENTS.md check and runs the unit tests. The commit is blocked if any step fails.

## Layout

- `index.html`: page markup and the SVG diagram
- `src/main.ts`: builds the region masks and handles hover, click and the Explore pills
- `src/data.ts`: circle, region and example content
- `src/geometry.ts`: circle positions and hit-testing
- `src/styles.css`: styles
- `src/*.test.ts`: Vitest unit tests for the data, the geometry, and the markup in `index.html`
- `vite.config.ts`: Vite settings (relative asset paths for GitHub Pages)
- `vitest.config.ts`: Vitest settings (which files are tests, isolated workers, shuffled order, reporters, coverage thresholds)
- `scripts/report-test-durations.mjs`: summarizes test durations from the last Vitest run and warns about slow tests
- `.oxlintrc.json`: Oxlint rules, including naming rules (Oxlint is used instead of typescript-eslint, which does not support TypeScript 7)
- `.oxfmtrc.json`: Oxfmt formatter settings
- `.husky/pre-commit`: pre-commit hook; the staged-file commands are under `lint-staged` in `package.json`
- `.github/CODEOWNERS`: owners who are requested for review on pull requests
- `.github/dependabot.yml`: weekly Dependabot pull requests for npm packages and GitHub Actions, and monthly ones for the Confluence script's Python packages
- `.github/pull_request_template.md` and `.github/ISSUE_TEMPLATE/`: pull request template and issue forms (bug, feature, accessibility)
- `AGENTS.md`: instructions and naming conventions for contributors and coding agents
- `.env.example`: template for the environment variables used by the Confluence publish script (the app needs none)
- `scripts/check-agents-md.mjs`: fails when `AGENTS.md` cites commands, paths or names that no longer exist
- `droid-wiki/`: generated codebase wiki, refreshed on every push to `main` by `.github/workflows/droid-wiki-refresh.yml` (through a rolling pull request from the `factory/droid-wiki` branch, without the video overview) and published to Confluence by `.github/workflows/publish-wiki-to-confluence.yml`
