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
npm run preview   # serve the built dist/ at http://localhost:4173
npm run check:agents-md  # fail if AGENTS.md no longer matches the code
```

The built page must be served over HTTP (for example with `npm run preview` or any static file host); opening `dist/index.html` directly from disk is not supported.

## Deployment

Pushes to `main` are built and deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`. Pull requests run the same AGENTS.md check, lint, format check and build without deploying.

## Pre-commit hook

`npm install` sets up a [Husky](https://typicode.github.io/husky/) pre-commit hook. It runs [lint-staged](https://github.com/lint-staged/lint-staged), which lints (with autofix) and formats the staged files, then type-checks the project with `tsc --noEmit` and runs the AGENTS.md check. The commit is blocked if any step fails.

## Layout

- `index.html`: page markup and the SVG diagram
- `src/main.ts`: builds the region masks and handles hover, click and the Explore pills
- `src/data.ts`: circle, region and example content
- `src/geometry.ts`: circle positions and hit-testing
- `src/styles.css`: styles
- `vite.config.ts`: Vite settings (relative asset paths for GitHub Pages)
- `.oxlintrc.json`: Oxlint rules, including naming rules (Oxlint is used instead of typescript-eslint, which does not support TypeScript 7)
- `.oxfmtrc.json`: Oxfmt formatter settings
- `.husky/pre-commit`: pre-commit hook; the staged-file commands are under `lint-staged` in `package.json`
- `AGENTS.md`: instructions and naming conventions for contributors and coding agents
- `scripts/check-agents-md.mjs`: fails when `AGENTS.md` cites commands, paths or names that no longer exist
- `droid-wiki/`: generated codebase wiki, published to Confluence by `.github/workflows/publish-wiki-to-confluence.yml`
