# Dependencies

The app declares no npm runtime dependencies. Eight dev dependencies support building, testing and contributor checks; Google Fonts and browser features support the page. GitHub Actions and Python packages belong to repository automation, not the deployed app. See [Configuration](configuration.md) for their settings.

## npm dev dependencies

Declared in `package.json` and resolved in `package-lock.json` (lockfile version 3). These are repository lockfile values, not claims about the latest available releases.

| Package | Range | Locked | Used for |
| --- | --- | --- | --- |
| `@vitest/coverage-v8` | `^4.1.11` | 4.1.11 | V8 coverage provider for Vitest |
| `husky` | `^9.1.7` | 9.1.7 | Git hook installation through `prepare` |
| `lint-staged` | `^16.4.0` | 16.4.0 | Staged-file lint/format commands |
| `oxfmt` | `^0.72.0` | 0.72.0 | Formatting and format checks |
| `oxlint` | `^1.87.0` | 1.87.0 | Linting and autofixes |
| `typescript` | `^7.0.2` | 7.0.2 | `tsc --noEmit` type check in `npm run build` |
| `vite` | `^8.3.3` | 8.3.3 | Dev server, production bundle, preview server |
| `vitest` | `^4.1.11` | 4.1.11 | Unit tests, JSON/JUnit results and watch mode |

Vite and its Rolldown bundler declare Node `^20.19.0 || >=22.12.0` in `package-lock.json`, matching `README.md`. `package.json` has no project `engines` field. Pages CI uses Node 22, while the Confluence diagram-rendering workflow uses Node 20. Platform-specific optional binaries are represented in the lockfile; npm selects those for the host. `package.json` blocks the optional macOS `fsevents` install script via `allowScripts`.

## Dependabot policy

`.github/dependabot.yml` configures:

| Ecosystem | Schedule | Release cooldown | Grouping |
| --- | --- | --- | --- |
| npm at repository root | Weekly, Monday | 7 days by default; 14 days for majors | Vitest and `@vitest/*` together; other development minor/patch updates together; other majors individually |
| GitHub Actions at repository root | Weekly, Monday | 7 days | All tag-based action updates, including majors, together |
| pip in `.github/scripts/` | Monthly | 7 days | All Confluence publishing packages together |

npm has an open-PR limit of five. Automated major updates are ignored for `vitest`, `@vitest/*` and `lint-staged`: `AGENTS.md` and `.github/dependabot.yml` reserve these for a manual Node-floor upgrade because their next majors require Node 22. Vitest and its coverage provider must stay aligned. Before other npm major upgrades, review the changelog and check `npm view <package>@<version> engines.node` against Node 20.19; green Node 22 CI does not establish Node 20 compatibility.

`Factory-AI/droid-action@main` tracks a branch rather than a version tag and is not advanced by Dependabot's tag updates. A cooldown/grouping policy is not evidence that dependencies are current or safe. Update npm dependencies through npm rather than editing `package-lock.json` by hand, and require the checks described in [Tooling](../how-to-contribute/tooling.md).

## External resources

| Resource | Loaded from | Used for | If unavailable |
| --- | --- | --- | --- |
| Fraunces (serif) | `fonts.googleapis.com` via `<link>` in `index.html` | Title, panel headings, pair labels, center label | Falls back to Georgia, then Times New Roman |
| Inter (sans) | Same stylesheet | Body text, circle labels, chips, pills | Falls back to `system-ui` and platform sans fonts |
| Noto Serif JP | Same stylesheet | 生き甲斐 above the title and in the center | Falls back to the default serif with Japanese glyphs |

`index.html` also adds `preconnect` hints for `fonts.googleapis.com` and `fonts.gstatic.com` to speed up font loading. Vite leaves these external URLs as they are in the build.

## GitHub Actions

| Action | Version | Workflow |
| --- | --- | --- |
| `actions/checkout` | `v7` | All five files in `.github/workflows/` |
| `actions/setup-node` | `v7` | `.github/workflows/deploy-pages.yml` (Node 22), `.github/workflows/publish-wiki-to-confluence.yml` (Node 20) |
| `actions/upload-pages-artifact` | `v5` | `.github/workflows/deploy-pages.yml` |
| `actions/deploy-pages` | `v5` | `.github/workflows/deploy-pages.yml` |
| `actions/setup-python` | `v7` | `.github/workflows/publish-wiki-to-confluence.yml` (Python 3.12) |
| `actions/upload-artifact` | `v7` | `.github/workflows/deploy-pages.yml`, `.github/workflows/publish-wiki-to-confluence.yml`, `.github/workflows/droid-wiki-refresh.yml` |
| `actions/download-artifact` | `v8` | `.github/workflows/droid-wiki-refresh.yml` |
| `peter-evans/create-pull-request` | `5f6978faf089d4d20b00c7766989d076bb2fc7f1` (v8.1.1) | `.github/workflows/droid-wiki-refresh.yml` |
| `Factory-AI/droid-action` | `main` | `.github/workflows/droid.yml`, `.github/workflows/droid-review.yml` |

The Confluence workflow also installs `@mermaid-js/mermaid-cli@11` globally; this is a floating major, not an exact npm lockfile pin. `.github/scripts/puppeteer-config.json` supplies Chrome's `--no-sandbox` flag for rendering. `.github/workflows/droid-wiki-refresh.yml` installs the Factory Droid CLI from `https://app.factory.ai/cli`, not a pinned npm package. These tools have no role in browser runtime. See [Deployment](../deployment.md) and [Wiki refresh](../features/wiki-refresh.md).

## Python packages

Pinned in `.github/scripts/requirements.txt` and used only by `.github/scripts/publish_confluence.py` in CI:

| Package | Version | Used for |
| --- | --- | --- |
| `markdown` | 3.11 | Markdown to HTML conversion |
| `requests` | 2.34.2 | Confluence REST API calls |

## Browser features

| Feature | Used in | Notes |
| --- | --- | --- |
| ES modules (`<script type="module">`) | `index.html` | Why `dist/index.html` must be served over HTTP rather than opened from disk |
| SVG `<mask>` with `userSpaceOnUse` | `src/main.ts` | Core of [Region rendering](../systems/region-rendering.md) |
| `getScreenCTM()` and `DOMPoint.matrixTransform()` | `toSvg()` in `src/main.ts` | Pointer to SVG coordinate conversion |
| Pointer events | `src/main.ts` | One code path for mouse, pen, and touch |
| `mix-blend-mode: multiply` | `src/styles.css` | Overlap colors |
| `backdrop-filter: blur()` | `src/styles.css` | Frosted panel; degrades to a translucent card where unsupported |
| CSS custom properties | `src/styles.css`, `index.html`, `src/data.ts` | Theming |
| `transform-box: fill-box` | `src/styles.css` | Circles scale from their own centers |

## Dev tooling

Oxlint and Oxfmt check source style, Husky and lint-staged check staged changes, and Vitest tests pure modules plus source-text markup invariants. That does not exercise the DOM controller in a browser. See [Tooling](../how-to-contribute/tooling.md), [Testing](../how-to-contribute/testing.md), and [Trust boundaries](../security.md) for scope and limits.
