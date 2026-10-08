# Ikigai overview

Ikigai is a single-page, interactive explainer for the four-circle Ikigai model. It draws four overlapping circles in SVG and lets visitors hover, tap, or click any of the 13 overlap regions to read what that combination means, with real-world examples. The app is written in strict TypeScript, bundled by Vite, and deployed to GitHub Pages at https://franklinp44.github.io/ikigai/.

## What it does

- Renders the four circles ("What you love", "What you're good at", "What the world needs", "What you can be paid for") as an SVG diagram in `index.html`.
- Highlights the region under the pointer and shows its title, description, circle membership, and three examples in a side panel.
- Lets the visitor pin a region by clicking it, or jump to the five named regions (Ikigai, Passion, Mission, Profession, Vocation) with buttons below the panel.
- Adds a short historical note: the four-circle model is a Western adaptation, relabeled as "ikigai" by Marc Winn in 2014 from Andrés Zuzunaga's purpose Venn diagram.

## Who it is for

Anyone curious about the Ikigai framework. There is no login, backend, or data collection. The built page is a static site that runs entirely in the browser.

## Tech stack

| Layer | Technology | File |
| --- | --- | --- |
| Markup and diagram | HTML5 with inline SVG | `index.html` |
| Behavior | Strict TypeScript ES modules, no framework | `src/main.ts`, `src/data.ts`, `src/geometry.ts` |
| Styling | Plain CSS with custom properties | `src/styles.css` |
| Build | Vite, with `tsc --noEmit` type checking | `vite.config.ts`, `tsconfig.json`, `package.json` |
| Hosting | GitHub Pages, deployed by GitHub Actions | `.github/workflows/deploy-pages.yml` |
| Fonts | Google Fonts (Fraunces, Inter, Noto Serif JP) | `index.html` |

TypeScript and Vite are the only dependencies, and both are dev dependencies. Nothing from npm ships to the browser beyond the compiled app code.

## Quick links

- [Architecture](architecture.md): how the modules fit together and how a pointer event becomes an updated panel.
- [Getting started](getting-started.md): install, run the dev server, and build.
- [Glossary](glossary.md): circle letters, zones, pinning, and other terms used in the code.
- [Deployment](../deployment.md): how pushes to `main` reach GitHub Pages, and how this wiki is published to Confluence.
- [Zone exploration](../features/zone-exploration.md): the main user-facing interaction.
- [Region rendering](../systems/region-rendering.md): how the SVG masks carve out each overlap region.
- [Zone keys](../primitives/zone-keys.md): the letter keys (`L`, `LG`, `LGNP`, ...) that tie everything together.
