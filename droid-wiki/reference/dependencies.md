# Dependencies

The app has no runtime package dependencies: nothing from npm ships to the browser. Building it needs two npm dev dependencies. The page relies on one external font stylesheet and a handful of browser features, and the CI workflows use a few GitHub Actions and Python packages.

## npm dev dependencies

Declared in `package.json` and locked in `package-lock.json` (lockfile version 3, 61 packages).

| Package | Range | Locked | Used for |
| --- | --- | --- | --- |
| `typescript` | `^7.0.2` | 7.0.2 | `tsc --noEmit` type check in `npm run build` |
| `vite` | `^8.3.2` | 8.3.2 | Dev server, production bundle, preview server |

### Notable transitive packages

| Package | Locked | Pulled in by | Role |
| --- | --- | --- | --- |
| `rolldown` | 1.2.12 | `vite` | Bundler for `vite build` |
| `@oxc-project/types`, `@rolldown/pluginutils` | 0.152.0, 1.0.1 | `rolldown` | Rolldown internals |
| `lightningcss` | 1.33.0 | `vite` | CSS transforms and minification |
| `postcss` | 8.5.28 | `vite` | CSS processing (with `nanoid`, `picocolors`, `source-map-js`) |
| `tinyglobby`, `fdir`, `picomatch` | 0.2.17, 6.5.0, 4.0.7 | `vite` | File globbing |
| `detect-libc` | 2.1.2 | `lightningcss` | Picks the right Linux binary |
| `fsevents` | 2.3.3 | `vite` (optional, macOS only) | File watching. Its install script is blocked by `allowScripts` in `package.json` |

Most of the lockfile is platform-specific binaries, of which npm installs only the one matching your machine: 20 `@typescript/typescript-*` packages (7.0.2), 15 `@rolldown/binding-*` packages (1.2.12), and 11 `lightningcss-*` packages (1.33.0). `esbuild` is not installed; Vite 8 lists it only as an optional peer dependency.

Vite 8.3.2 and rolldown declare Node `^20.19.0 || >=22.12.0`, which is where the Node requirement in `README.md` comes from.

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
| `actions/checkout` | `v4` | Both |
| `actions/setup-node` | `v4` | Both (Node 22 for Pages, Node 20 for Confluence) |
| `actions/upload-pages-artifact` | `v3` | `.github/workflows/deploy-pages.yml` |
| `actions/deploy-pages` | `v4` | `.github/workflows/deploy-pages.yml` |
| `actions/setup-python` | `v5` | `.github/workflows/publish-wiki-to-confluence.yml` |
| `actions/upload-artifact` | `v4` | `.github/workflows/publish-wiki-to-confluence.yml` |

The Confluence workflow also runs `npm install -g @mermaid-js/mermaid-cli@11` to render Mermaid diagrams. See [Deployment](../deployment.md).

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

All of these are supported in current Chrome, Edge, Firefox, and Safari.

## Dev tooling

TypeScript and Vite are the only dev tools. There is no linter, formatter, or test runner. See [Tooling](../how-to-contribute/tooling.md).
