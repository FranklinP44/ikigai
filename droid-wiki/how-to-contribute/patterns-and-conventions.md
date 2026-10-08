# Patterns and conventions

The codebase is small, written in strict TypeScript, and has no runtime dependencies. These are the patterns it follows so new changes stay consistent.

## No framework, minimal tooling

Everything is hand-written HTML, CSS, and browser TypeScript. The only tools are TypeScript (type checking) and Vite (dev server and bundler), both dev dependencies. `src/main.ts` is loaded as an ES module (`<script type="module">`) from `index.html`, so it runs after the document is parsed and can query DOM elements at the top level without waiting for `DOMContentLoaded`. Keep it that way unless there is a strong reason to add tooling.

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

Without the `type` marker, the import would be kept in the emitted JavaScript and fail at runtime, so the compiler reports it as an error.

## Zone keys everywhere

Every data record, every `data-zone` attribute, and every generated SVG group is keyed by the same letter string in `L-G-N-P` order. Code that builds keys (like `zoneAt()` in `src/geometry.ts`) iterates `ORDER` so the order is always right. See [Zone keys](../primitives/zone-keys.md).

## State changes go through `setZone()`

`setZone(key, instant)` in `src/main.ts` is the single place that changes `current`, toggles `.active` on overlays and pills, and triggers the panel swap. Event handlers only decide which key to pass. It returns early if the key has not changed, which keeps `pointermove` cheap.

## Styling conventions

- Colors, fonts, and the circle palette are CSS custom properties on `:root` in `src/styles.css`. SVG fills in `index.html` and chip colors in `src/data.ts` (`CIRCLE[k].color`) reference them with `var(--love)` and so on, rather than hard-coding hex values.
- State is expressed with classes (`.active`, `.swap`, `.hovering`, `.off`), not inline styles. The one exception is the chip color dot, which sets `background` inline from `CIRCLE[k].color`.
- Animations use CSS keyframes (`pop`, `fade`) and transitions. TypeScript only toggles classes.

## Error handling

There is very little, by design. All data is static and trusted, and the `Record<ZoneKey, ...>` types guarantee that lookups such as `ZONES[key]` succeed for any `ZoneKey`. `zoneAt()` returns `null` for points outside every circle, and callers fall back to the pinned zone. The one hard failure is `byId()`, which throws at startup if `index.html` is missing an element the script needs.

`render()` writes chips and examples with `innerHTML`. That is acceptable only because the strings come from `src/data.ts`; never feed user input into it.

## Text and copy

- Curly apostrophes (`’`) are used in display strings, both in `src/data.ts` and in the SVG labels in `index.html`.
- Each zone has exactly three examples. The panel layout in `src/styles.css` (`.card` has `min-height: 580px`) is sized for that.

## Comments

Comments are rare and explain why, not what. Examples: in `src/data.ts`, the notes that zone keys list circles in `L-G-N-P` order and that `ZONE_KEYS` is the overlay creation order; in `src/main.ts`, the note that masks are used instead of clip-paths to keep edges anti-aliased, and the note that `innerHTML` is safe because the content is static and trusted; in `vite.config.ts`, why `base` is relative. In `src/styles.css`, the phone breakpoint explains that SVG text scales down with the diagram.

## Related pages

- [Visual design](../systems/visual-design.md) for the CSS token and animation details.
- [Design decisions](../background/design-decisions.md) for the reasoning behind these patterns.
- [Tooling](tooling.md) for the TypeScript and Vite setup.
