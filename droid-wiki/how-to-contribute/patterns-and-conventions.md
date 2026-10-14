# Patterns and conventions

The codebase is small, written in strict TypeScript, and has no runtime dependencies. These are the patterns it follows so new changes stay consistent.

## No runtime framework

Everything is hand-written HTML, CSS, and browser TypeScript. `package.json` lists development tools for type checking, bundling, tests, coverage, lint, formatting, and Git hooks, but no runtime dependencies. `src/main.ts` is loaded as an ES module (`<script type="module">`) from `index.html`, so it runs after the document is parsed and can query DOM elements at the top level without waiting for `DOMContentLoaded`.

`AGENTS.md` records the contributor rules, and `scripts/check-agents-md.mjs` checks its commands, paths, and code names. Update the instructions when a change makes a documented reference obsolete; do not weaken the checker.

## Naming and formatting

Follow the naming table in `AGENTS.md`: camelCase variables and functions, PascalCase types, SCREAMING_SNAKE_CASE constant settings, lowercase kebab-case filenames and CSS names, and camelCase HTML IDs. Zone letters stay in `L-G-N-P` order.

`.oxlintrc.json` enforces filename and identifier rules, type-only imports, and test rules. Warnings fail `npm run lint`. `.oxfmtrc.json` sets a 100-column print width and omits arrow-function parentheses where possible. `.husky/pre-commit` applies lint-staged's autofixes and formatting to staged files; it does not replace the full five-check validation in `AGENTS.md`.

## Module boundaries

The code is split by responsibility:

| Module | Contains | Imports |
| --- | --- | --- |
| `src/data.ts` | Types (`CircleKey`, `ZoneKey`, `Circle`, `Zone`), content (`CIRCLE`, `ZONES`, `EXAMPLES`), key lists (`ORDER`, `ZONE_KEYS`), and `isZoneKey()` | Nothing |
| `src/geometry.ts` | `R`, `CENTERS`, and the pure `zoneAt(x, y)` hit test | `src/data.ts` |
| `src/main.ts` | DOM lookups, SVG mask building, state, rendering, and event wiring | `src/data.ts`, `src/geometry.ts` |

`src/data.ts` and `src/geometry.ts` do not touch the DOM. New content belongs in `src/data.ts`, not in the rendering functions. Within `src/main.ts`, the layout runs top to bottom: DOM lookups, the `el()` helper, mask and region building, `toSvg()` and `zoneForEvent()`, state and `render()`/`setZone()`, event wiring, then the initial `setZone("LGNP", true)`.

## Strict TypeScript

`tsconfig.json` turns on `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`. The compiler only type-checks (`noEmit`); Vite does the transpiling. Code should compile cleanly under `npm run build`, since CI runs the same command on every pull request.

- **Union types for keys.** Circle and zone keys are string literal unions (`CircleKey`, `ZoneKey`), not plain `string`. Data is stored in `Record<ZoneKey, ...>` and `Record<CircleKey, ...>`, so a missing or misspelled region is a compile error.
- **Type guards at the boundary.** Strings that come from outside the type system, such as a pill's `data-zone` attribute or the key built in `zoneAt()`, go through `isZoneKey()` before use. Do not cast with `as ZoneKey` to skip the check.
- **Typed DOM lookups.** `byId(id, Type)` in `src/main.ts` calls `getElementById`, checks the result with `instanceof`, and throws `Missing #id` if the element is absent or the wrong type. Use it for new element lookups instead of `getElementById` with a non-null assertion.
- **Typed SVG factory.** `el(tag, attrs, parent)` in `src/main.ts` wraps `document.createElementNS`, sets attributes from an object, optionally appends to a parent, and returns the matching type from `SVGElementTagNameMap`. Use it for any new SVG nodes.
- **`readonly` for constant lists.** `ORDER`, `ZONE_KEYS`, `CENTERS` entries, and `EXAMPLES` values are typed `readonly`.

## Type-only imports

`tsconfig.json` sets `verbatimModuleSyntax` and `isolatedModules`. Imports that are only used as types must be marked with `type`, either inline or as a whole statement:

```ts
import { ORDER, isZoneKey, type CircleKey, type ZoneKey } from "./data";
```

With `verbatimModuleSyntax`, TypeScript requires the marker for type-only imports. Otherwise an emitted named import could reference an export that does not exist at runtime.

## Zone keys everywhere

Every data record, every `data-zone` attribute, and every generated SVG group is keyed by the same letter string in `L-G-N-P` order. Code that builds keys (like `zoneAt()` in `src/geometry.ts`) iterates `ORDER` so the order is always right. See [Zone keys](../primitives/zone-keys.md).

## State changes go through `setZone()`

`setZone(key, instant)` in `src/main.ts` is the single place that changes `current`, toggles `.active` on overlays and pills, and triggers the panel swap. Event handlers only decide which key to pass. It returns early if the key has not changed, which keeps `pointermove` cheap.

## Styling conventions

- Colors, fonts, and the circle palette are CSS custom properties on `:root` in `src/styles.css`. SVG fills in `index.html` and chip colors in `src/data.ts` (`CIRCLE[k].color`) reference them with `var(--love)` and so on, rather than hard-coding hex values.
- State is expressed with classes (`.active`, `.swap`, `.hovering`, `.off`), not inline styles. The one exception is the chip color dot, which sets `background` inline from `CIRCLE[k].color`.
- Animations use CSS keyframes (`pop`, `fade`) and transitions. TypeScript only toggles classes.
- Keyboard focus uses `.pill:focus-visible` in `src/styles.css`, separate from the selected `.active` class. Keep its 2 px ink outline offset by 3 px so the ring remains visible against the light page background even when the pill has a dark fill.

## Error handling

There is very little, by design. All data is static and trusted, and the `Record<ZoneKey, ...>` types guarantee that lookups such as `ZONES[key]` succeed for any `ZoneKey`. `zoneAt()` returns `null` for points outside every circle, and callers fall back to the pinned zone. The one hard failure is `byId()`, which throws at startup if `index.html` is missing an element the script needs.

`render()` writes chips and examples with `innerHTML`. That is acceptable only because the strings come from `src/data.ts`; never feed user input into it.

## Text and copy

- Curly apostrophes (`’`) are used in display strings, both in `src/data.ts` and in the SVG labels in `index.html`.
- Each zone has exactly three examples. The panel layout in `src/styles.css` (`.card` has `min-height: 580px`) is sized for that.

## Comments

Comments are rare and explain why, not what. Examples: in `src/data.ts`, the notes that zone keys list circles in `L-G-N-P` order and that `ZONE_KEYS` is the overlay creation order; in `src/main.ts`, the note that masks are used instead of clip-paths to keep edges anti-aliased, and the note that `innerHTML` is safe because the content is static and trusted; in `vite.config.ts`, why `base` is relative. In `src/styles.css`, the phone breakpoint explains that SVG text scales down with the diagram.

## Tests

Place `.test.ts` files next to the covered module, with imported Vitest functions rather than globals. `AGENTS.md` calls for one `describe` block per exported name and sentence-style `it` titles; `.oxlintrc.json` rejects skipped and focused tests.

`vitest.config.ts` uses isolated workers and randomized order. Test the pure modules directly, but read `src/main.ts` and `index.html` through `?raw` imports because the controller touches the DOM at import time. New pure-module branches need tests to preserve the existing 100% thresholds. See [Testing](testing.md) for commands and coverage scope.

`vitest.config.ts` collects `.test.ts` files under `src/` and `scripts/`. QA report-gate tests in `scripts/check-qa-report.test.ts` import the pure evaluator in `scripts/check-qa-report.mjs` and test its CLI status with temporary report files. These regressions run with ordinary unit checks and the pre-commit hook, but are outside the app-module coverage scope.

Browser tests live separately in `e2e/diagram.spec.ts` and import `test` and `expect` from Playwright. The Vitest filename rule in `.oxlintrc.json` applies under `src/` and to `.test.ts` files under `scripts/`; it does not reject the browser suite's `.spec.ts` name. `playwright.config.ts` selects Chromium and the local production build.

Hover assertions need pointer coordinates, not a selector-only hover over `g.zone`. The `moveToSvgPoint()` helper in `e2e/diagram.spec.ts` scrolls the SVG into view, maps a probe through `getScreenCTM()`, and moves the real mouse. Keep coordinate probes consistent with `src/geometry.ts`. Playwright's retrying assertions wait for the panel update rather than calling `setZone()` directly.

## Functional QA

`.factory/skills/qa/SKILL.md` keeps browser QA separate from automated code checks. It maps changed files to apps using `.factory/skills/qa/config.yaml`, excludes unit tests, and selects only relevant flows plus adjacent interactions. Documentation-only, CI-only, and test-only changes receive exactly one documented INCONCLUSIVE row without app flows. QA-tooling-only changes need separately authorized targeted browser QA before anyone claims app validation.

The web flows in `.factory/skills/qa-web/SKILL.md` use real pointer movements, clicks, and keys through droid-control, not JavaScript calls to application handlers. Read-only DOM queries can inspect state. Expectations come from the branch's `src/data.ts`; evidence waits for the panel swap to finish. Stop servers started by the run, including Vite child processes. Production is never a fallback for branch testing. See [Functional QA](../features/functional-qa.md).

In CI, `scripts/run-qa.sh` requires the absolute driver, config, and managed Chrome paths exported by `scripts/provision-qa-browser.sh`. Keep its owned browser session; do not attach to another browser, discover user configuration, or install replacement tools during QA. `scripts/check-qa-report.mjs` reads Result cells from the main contiguous six-column table, not legends or Notes. FAIL and BLOCKED fail the job; CI video and Compose must remain disabled.

## Related pages

- [Visual design](../systems/visual-design.md) for the CSS token and animation details.
- [Design decisions](../background/design-decisions.md) for the reasoning behind these patterns.
- [Tooling](tooling.md) for the build, lint, format, test, and hook setup.
