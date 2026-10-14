# Architecture

Ikigai is a small TypeScript app bundled by Vite into static files. `index.html` holds the page layout and the base SVG, `src/styles.css` handles the look and animations, and `src/main.ts` builds the overlap regions at load time and wires up the interaction. `src/main.ts` imports its content from `src/data.ts` and its geometry and hit testing from `src/geometry.ts`.

## Components

```mermaid
graph TD
    HTML[index.html<br/>layout + base SVG]
    HTML -->|link| CSS[src/styles.css<br/>tokens, animation, layout]
    HTML -->|script type=module| MAIN[src/main.ts<br/>masks, state, events]
    HTML -->|loads| Fonts[Google Fonts CDN]
    MAIN -->|imports| DATA[src/data.ts<br/>types + content]
    MAIN -->|imports| GEO[src/geometry.ts<br/>R, CENTERS, zoneAt]
    GEO -->|imports| DATA
    MAIN -->|builds masks and zone overlays| SVG[svg#ikigai]
    MAIN -->|writes zone content| Panel[Detail panel]
    CSS -->|styles state classes| SVG
    CSS -->|styles state classes| Panel
```

`index.html` uses the browser URLs `"/src/styles.css"` and `"/src/main.ts"` to load `src/styles.css` and `src/main.ts`. In development, the Vite dev server compiles the TypeScript on request. `npm run build` first type-checks with `tsc --noEmit`, then `vite build` bundles everything into `dist/` (an `index.html` plus hashed JS and CSS files under `dist/assets/`) with the tags rewritten to point at the bundles. `vite.config.ts` sets `base: './'` so the asset URLs are relative and work under the GitHub Pages subpath `/ikigai/`. There is no server code. See [Deployment](../deployment.md) for how `dist/` is published.

The entry script is an ES module, so the browser defers it until the document is parsed. `src/main.ts` can look up DOM elements at the top level without waiting for `DOMContentLoaded`.

## Source size

Physical lines, including comments and blank lines, collected on 2026-10-14. This chart covers the five application files, not tests or automation scripts.

```mermaid
xychart-beta horizontal
    title "Application lines by file"
    x-axis ["src/main.ts (TS)", "src/data.ts (TS)", "src/geometry.ts (TS)", "src/styles.css (CSS)", "index.html (HTML)"]
    y-axis "Lines" 0 --> 360
    bar [141, 186, 16, 349, 113]
```

See [By the numbers](../by-the-numbers.md) for the full snapshot.

## Build and documentation tooling

`package.json` separates browser code from development tools. Oxlint and Oxfmt check source style; `scripts/check-agents-md.mjs` checks contributor instructions against the repository; `vitest.config.ts` configures Node-based tests for the pure modules, raw markup, and QA report gate in `scripts/check-qa-report.test.ts`. `.github/workflows/deploy-pages.yml` runs those checks before building the site. None of those tools runs in the browser.

Browser checks have two independent paths. `playwright.config.ts` starts the build and a local preview on port 4173, then runs the eight Chromium cases in `e2e/diagram.spec.ts`. `.github/workflows/e2e.yml` runs that fixed suite on pull requests unless all changed paths are under the wiki; it needs no Factory secret. See [Testing](../how-to-contribute/testing.md).

For optional diff-targeted checks, `.github/workflows/qa.yml` invokes the orchestrator in `.factory/skills/qa/SKILL.md`, which maps the diff to the web flows in `.factory/skills/qa-web/SKILL.md`. `.factory/skills/qa/config.yaml` selects the anonymous visitor persona and local targets; `.factory/settings.json` enables the droid-control plugin. Both browser paths test branch code, not the production deployment. See [Functional QA](../features/functional-qa.md).

The QA job alone uses Node 24. `scripts/provision-qa-browser.sh` installs agent-browser 0.37.1 and managed Chrome, checks an isolated `about:blank` session, and exports absolute tool paths. `scripts/run-qa.sh` preserves those paths and owns a separate session for the model run. `scripts/check-qa-report.mjs` validates the main results table before the workflow publishes evidence and propagates process or gate failures. Browser provisioning does not validate the app.

Documentation has a separate lifecycle. `.github/workflows/droid-wiki-refresh.yml` updates Markdown and uploads it to Factory, then opens a rolling pull request. `.github/workflows/publish-wiki-to-confluence.yml` publishes committed wiki changes to Confluence. See [Wiki refresh](../features/wiki-refresh.md) and [Deployment](../deployment.md).

## SVG layer stack

The diagram in `index.html` is a stack of SVG groups. Later groups paint on top of earlier ones.

| Order | Group | Filled by | Purpose |
| --- | --- | --- | --- |
| 1 | `<g class="circles">` | `index.html` | Four colored circles, blended with `mix-blend-mode: multiply` so overlaps darken naturally |
| 2 | `<g id="centerFill">` | `src/main.ts` | Gold radial gradient painted only inside the four-way overlap |
| 3 | `<g id="zones">` | `src/main.ts` | One translucent white overlay per region, hidden until it becomes active |
| 4 | `<g class="outlines">` | `index.html` | White circle outlines drawn over the fills |
| 5 | `<g class="labels">` | `index.html` | Circle names, pair names, center label, and the four white dots; `pointer-events: none` |

The masks that shape layers 2 and 3 are explained in [Region rendering](../systems/region-rendering.md).

## Request lifecycle: pointer to panel

Pointer interaction makes no network requests in `src/main.ts`. Google Fonts resources are separate browser loads from `index.html`. The interesting app flow is how a pointer event updates the page.

```mermaid
sequenceDiagram
    participant U as Visitor
    participant S as svg#ikigai (src/main.ts)
    participant Z as zoneAt() (src/geometry.ts)
    participant SZ as setZone()
    participant R as render()
    participant P as Detail panel

    U->>S: pointermove (clientX, clientY)
    S->>S: zoneForEvent() calls toSvg() for SVG coordinates
    S->>Z: zoneAt(x, y)
    Z-->>S: ZoneKey such as "LG", or null
    S->>SZ: setZone(key or pinned)
    SZ->>SZ: toggle .active on zone overlay and pill
    SZ->>P: add .swap (fade out)
    SZ->>R: after 140 ms, render(key)
    R->>P: write eyebrow, title, description, chips, examples
    SZ->>P: remove .swap (fade in)
```

Hit testing is pure math: `zoneAt()` in `src/geometry.ts` checks the distance from the point to each circle center and returns a `ZoneKey`, or `null` when the point is outside every circle. It does not rely on DOM hit targets, so the overlapping masked groups never compete for events. See [Zone exploration](../features/zone-exploration.md) for the full interaction model.

## Data model at a glance

All content and its types live in `src/data.ts`:

- `CircleKey` (`"L" | "G" | "N" | "P"`) and `ZoneKey` (a union of the 13 region keys).
- `ORDER`: the four circle keys in `L-G-N-P` order. `ZONE_KEYS`: all 13 zone keys in overlay creation order.
- `CIRCLE: Record<CircleKey, Circle>`: display name and color variable for each circle.
- `ZONES: Record<ZoneKey, Zone>`: eyebrow, title, and description for each region.
- `EXAMPLES: Record<ZoneKey, readonly string[]>`: three example strings for each region.
- `isZoneKey()`: a type guard that narrows a plain string to `ZoneKey`.

Because the records are typed by `ZoneKey`, the compiler rejects a missing or misspelled region. Field-level details are in [Data models](../reference/data-models.md), and the key scheme is in [Zone keys](../primitives/zone-keys.md).

## Key source files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout, base SVG (circles, outlines, labels, gold gradient), detail panel shell, Explore buttons, and the `<script type="module">` entry point |
| `src/main.ts` | Typed DOM lookups, SVG mask generation, panel rendering, state, and event handlers |
| `src/data.ts` | Circle and zone types, zone content, examples, and the `isZoneKey()` guard |
| `src/geometry.ts` | Circle radius `R`, circle `CENTERS`, and the `zoneAt()` hit test |
| `src/styles.css` | Design tokens, entrance animations, zone overlay transitions, panel styling, and responsive breakpoints |
| `vite.config.ts` | Vite settings; `base: './'` for relative asset URLs |
| `tsconfig.json` | Strict TypeScript compiler options for type checking only (`noEmit`) |
| `playwright.config.ts` | Chromium project, local build/preview lifecycle, retries and reporting |
| `e2e/diagram.spec.ts` | Initial state, five Explore buttons, coordinate-based hover and keyboard selection |
| `.github/workflows/e2e.yml` | Runs browser tests on PRs and saves failure reports |
| `.github/workflows/deploy-pages.yml` | Builds on every push and PR, deploys `dist/` to GitHub Pages from `main` |
