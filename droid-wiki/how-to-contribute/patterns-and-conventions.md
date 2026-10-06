# Patterns and conventions

The codebase is small and deliberately dependency-free. These are the patterns it follows so new changes stay consistent.

## No framework, no build

Everything is hand-written HTML, CSS, and browser JavaScript. `script.js` is a classic script (not an ES module) loaded at the end of `<body>` in `index.html`, so it can query DOM elements at the top level without waiting for `DOMContentLoaded`. Keep it that way unless there is a strong reason to add tooling.

## Data first, logic second

`script.js` is laid out top to bottom as:

1. Geometry constants: `NS`, `R`, `ORDER`, `C`.
2. Content: `CIRCLE`, `ZONES`, `EXAMPLES`.
3. DOM lookups.
4. Helpers: `el()`, `region()`, `zoneAt()`, `toSvg()`.
5. State and rendering: `current`, `pinned`, `render()`, `setZone()`.
6. Event wiring, then the initial `setZone("LGNP", true)`.

New content belongs in the data objects, not in the rendering functions.

## Zone keys everywhere

Every data object, every `data-zone` attribute, and every generated SVG group is keyed by the same letter string in `L-G-N-P` order. Code that builds keys (like `zoneAt()`) iterates `ORDER` so the order is always right. See [Zone keys](../primitives/zone-keys.md).

## Small DOM helper

SVG elements must be created with `document.createElementNS`. The `el(tag, attrs, parent)` helper in `script.js` wraps that, sets attributes from an object, and optionally appends to a parent. Use it for any new SVG nodes.

## State changes go through `setZone()`

`setZone(key, instant)` is the single place that changes `current`, toggles `.active` on overlays and pills, and triggers the panel swap. Event handlers only decide which key to pass. It returns early if the key has not changed, which keeps `pointermove` cheap.

## Styling conventions

- Colors, fonts, and the circle palette are CSS custom properties on `:root` in `styles.css`. SVG fills in `index.html` and chip colors in `script.js` reference them with `var(--love)` and so on, rather than hard-coding hex values.
- State is expressed with classes (`.active`, `.swap`, `.hovering`, `.off`), not inline styles. The one exception is the chip color dot, which sets `background` inline from `CIRCLE[k].color`.
- Animations use CSS keyframes (`pop`, `fade`) and transitions. JavaScript only toggles classes.

## Error handling

There is effectively none, by design. All data is static and trusted, so lookups such as `ZONES[key]` are guaranteed to succeed for any key `zoneAt()` returns. `zoneAt()` returns `null` for points outside every circle, and callers fall back to the pinned zone.

## Text and copy

- Curly apostrophes (`’`) are used in display strings, both in `script.js` and in the SVG labels in `index.html`.
- Each zone has exactly three examples. The panel layout in `styles.css` (`.card` has `min-height: 580px`) is sized for that.

## Comments

Comments are rare and explain why, not what. Examples in `script.js`: the note that zone keys are in `L-G-N-P` order, and the note that masks are used instead of clip-paths to keep edges anti-aliased. In `styles.css`, the phone breakpoint explains that SVG text scales down with the diagram.

## Related pages

- [Visual design](../systems/visual-design.md) for the CSS token and animation details.
- [Design decisions](../background/design-decisions.md) for the reasoning behind these patterns.
