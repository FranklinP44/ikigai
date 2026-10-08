# Getting started

The app is a TypeScript project built with Vite. You need Node.js and npm to run it locally; the only dependencies are the dev tools TypeScript and Vite.

## Prerequisites

- Node.js 20.19+ or 22.12+, and npm. These are the versions listed in `README.md` (CI uses Node 22).
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

`package.json` sets `allowScripts: { fsevents: false }`, which blocks the install script of the optional `fsevents` package on macOS. The package ships a prebuilt binary, so nothing breaks.

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

`dist/` is ignored by Git. Do not open `index.html` or `dist/index.html` directly from disk with `file://`. The root `index.html` points at `/src/main.ts`, which only Vite can serve, and the built page loads a module script, which browsers block over `file://`. Use `npm run dev` or `npm run preview`, or any static file server pointed at `dist/`.

## Verify it works

1. The four circles pop in with a short staggered animation, then the labels fade in.
2. The panel on the right shows "Ikigai" with all four circle chips highlighted.
3. Moving the pointer over the diagram highlights the region under it and updates the panel.
4. Clicking a region pins it, so moving the pointer off the diagram returns to that region instead of Ikigai.

## Build and test

There is no automated test suite. Type checking (`tsc --noEmit`, the first half of `npm run build`) is the only automated check, and CI runs it on every pull request. Behavior is checked by hand in the browser. See [Testing](../how-to-contribute/testing.md) for a manual checklist, [Development workflow](../how-to-contribute/development-workflow.md) for the edit-reload loop, and [Deployment](../deployment.md) for how `main` is published to GitHub Pages.
