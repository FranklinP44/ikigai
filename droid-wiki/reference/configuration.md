# Configuration

The app has no environment variables or runtime config. Build behavior is set by `package.json`, `tsconfig.json`, and `vite.config.ts`. App behavior is controlled by constants in `src/geometry.ts` and `src/main.ts` and custom properties in `src/styles.css`. CI settings live in the two workflow files, covered in [Deployment](../deployment.md).

## `package.json`

| Field | Value | Notes |
| --- | --- | --- |
| `private` | `true` | Prevents accidental `npm publish` |
| `type` | `"module"` | `.js` files in the project are treated as ES modules |
| `scripts.dev` | `vite` | Dev server at http://localhost:5173 |
| `scripts.build` | `tsc --noEmit && vite build` | Type-check first, then bundle into `dist/`. A type error stops the build |
| `scripts.preview` | `vite preview` | Serves `dist/` at http://localhost:4173 |
| `devDependencies` | `typescript ^7.0.2`, `vite ^8.3.2` | No runtime `dependencies`. See [Dependencies](dependencies.md) |
| `allowScripts` | `{ "fsevents": false }` | Blocks the install script of the optional macOS `fsevents` package, which ships a prebuilt binary |

There is no `engines` field. `README.md` asks for Node 20.19+ or 22.12+, the range Vite 8 declares.

## `tsconfig.json`

Used only for type checking (`noEmit`). Vite strips types itself when bundling.

| Option | Value | Effect |
| --- | --- | --- |
| `target` | `ES2022` | Language level assumed for checking |
| `module` | `ESNext` | ES module syntax |
| `moduleResolution` | `bundler` | Resolves imports the way Vite does, so `./data` works without an extension |
| `lib` | `ES2022`, `DOM`, `DOM.Iterable` | Browser globals and iterable `NodeList` |
| `types` | `vite/client` | Vite's client types (for example CSS imports and `import.meta.env`) |
| `strict` | `true` | All strict checks, including `strictNullChecks` |
| `noEmit` | `true` | `tsc` writes no files |
| `isolatedModules` | `true` | Each file must be compilable alone, as Vite compiles them |
| `verbatimModuleSyntax` | `true` | Type-only imports must use `type`, as in `import { type ZoneKey }` |
| `noUnusedLocals` | `true` | Unused variables are errors |
| `noUnusedParameters` | `true` | Unused parameters are errors |
| `noFallthroughCasesInSwitch` | `true` | Each `switch` case must end with `break` or `return` |
| `skipLibCheck` | `true` | Skips checking `.d.ts` files in `node_modules` |
| `include` | `["src"]` | Only `src/` is checked. `vite.config.ts` is not |

## `vite.config.ts`

| Option | Value | Effect |
| --- | --- | --- |
| `base` | `'./'` | Built asset URLs are relative, so `dist/` works under the GitHub Pages subpath `/ikigai/` |

Everything else uses Vite defaults: `index.html` at the repo root is the entry, output goes to `dist/`.

## `.gitignore`

| Pattern | Why |
| --- | --- |
| `node_modules` | Installed packages |
| `dist` | Vite build output |
| `build/` | Local output of a Confluence dry run (`build/confluence/`) |

## Workflow settings

| Workflow | Setting | Value |
| --- | --- | --- |
| `.github/workflows/deploy-pages.yml` | Triggers | `push` to `main`, `pull_request`, `workflow_dispatch` |
| | Permissions | `contents: read`, `pages: write`, `id-token: write` |
| | Concurrency | Group `pages-${{ github.ref }}`, cancel in progress |
| | Node | 22, with npm cache |
| | Environment | `github-pages` (deploy job, skipped on PRs) |
| `.github/workflows/publish-wiki-to-confluence.yml` | Triggers | `push` to `main` and `pull_request` when `droid-wiki/**`, `.github/scripts/**`, or the workflow file change; `workflow_dispatch` with a `dry_run` boolean input |
| | Job env | `DRY_RUN` (true on PRs or when the input is set), `WIKI_DIR: droid-wiki` |
| | Repository variables | `CONFLUENCE_URL`, `CONFLUENCE_SPACE_KEY` (required); `CONFLUENCE_ROOT_TITLE`, `CONFLUENCE_PARENT_ID` (optional) |
| | Repository secrets | `CONFLUENCE_EMAIL`, `CONFLUENCE_API_TOKEN` |
| | Concurrency | One `confluence-publish` queue for real publishes; per-branch group for PR dry runs; never cancels in progress |
| | Runtimes | Python 3.12 (pip cache), Node 20 for `@mermaid-js/mermaid-cli@11` |
| | Timeout | 20 minutes |

`.github/scripts/puppeteer-config.json` passes `--no-sandbox` to the headless Chrome that mermaid-cli uses to render diagrams.

## TypeScript constants

| Constant | File | Value | Purpose |
| --- | --- | --- | --- |
| `R` | `src/geometry.ts` | `200` | Radius of every circle, in SVG user units |
| `CENTERS` | `src/geometry.ts` | `L: [400, 270]`, `G: [270, 400]`, `N: [530, 400]`, `P: [400, 530]` | Circle centers |
| `ORDER` | `src/data.ts` | `["L", "G", "N", "P"]` | Canonical letter order for [zone keys](../primitives/zone-keys.md) |
| `NS` | `src/main.ts` | `"http://www.w3.org/2000/svg"` | SVG namespace for `createElementNS` |
| `FULL` | `src/main.ts` | `maskUnits: "userSpaceOnUse"`, `x: 0`, `y: 0`, `width: 800`, `height: 800` | Shared mask bounds |

## Tunable values in code

| Value | Location | Effect |
| --- | --- | --- |
| `rgba(255,255,255,.5)` | Overlay loop in `src/main.ts` | Highlight strength for most zones |
| `rgba(255,255,255,.35)` | Overlay loop in `src/main.ts` | Highlight strength for the gold center |
| `140` (ms) | `setZone()` in `src/main.ts` | Delay before new panel content renders |
| `"LGNP"` | `pinned` initial value and final `setZone("LGNP", true)` call in `src/main.ts` | Default zone on load |

## SVG settings in `index.html`

| Setting | Value |
| --- | --- |
| `viewBox` | `40 40 720 720` |
| `#gold` gradient | Center (400, 400), radius 100, stops `#FFF8E3` → `#F8D78F` → `#EDB65A` |

## CSS custom properties

Defined on `:root` in `src/styles.css`. Full descriptions are in [Visual design](../systems/visual-design.md).

```css
--bg: #FBF7F0;
--ink: #2A2521;
--muted: #7A7068;
--line: #E8DFD3;
--love: #F2A29B;
--good: #F5C877;
--needs: #BBA8F0;
--paid: #8CD6C3;
--serif: "Fraunces", Georgia, "Times New Roman", serif;
--sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
```

## Breakpoints

| Max width | File | Change |
| --- | --- | --- |
| 900 px | `src/styles.css` | Single-column layout |
| 600 px | `src/styles.css` | Smaller padding, larger SVG labels |
