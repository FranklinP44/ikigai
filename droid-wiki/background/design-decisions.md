# Design decisions

These decisions come from reading the code and its comments. Where the reasoning isn't written down, the explanation is marked as likely.

## SVG masks instead of clip-paths

Stated in `script.js`: "Masks instead of clip-paths so region edges stay anti-aliased." Clip-paths produce hard pixel edges in most browsers. With 13 regions sharing curved borders, aliased edges would show visible seams. Masks blend at the edge, so adjacent highlights meet cleanly. The cost is more DOM (18 masks and nested groups), which is negligible at this size. Details are in [Region rendering](../systems/region-rendering.md).

## Geometric hit testing instead of DOM events

`zoneAt()` computes the zone from the pointer's distance to each circle center rather than listening for events on each region's `<g>`. Masked groups all cover the full 800 × 800 canvas, so DOM hit testing on them would be unreliable: every overlay would claim every point. The math approach is a few lines, exact, and independent of render order.

## One `pointermove` listener on the whole SVG

A single listener on `svg#ikigai` drives hover. It also makes "outside the circles" a natural case (`zoneAt()` returns `null`, so the panel falls back to `pinned`). `setZone()` returns early when nothing changed, so running on every move is cheap.

## Hover previews, click pins

Hover lets visitors scan regions quickly, but on its own it would snap back to Ikigai whenever the pointer left. Pinning on click (and on pill press) lets someone pick a region and then move to the panel to read it. The default pin is `LGNP`, the center.

## Multiply blend for overlaps

The base circles use `mix-blend-mode: multiply` in `styles.css`, so overlap colors come from blending the circle colors rather than from extra shapes. The gold center is the one region painted explicitly, to make Ikigai stand out.

## No framework or build step

The app is three files with zero dependencies. That keeps hosting trivial (any static host or opening the file), and there is nothing to keep up to date. A framework would add more code than the app itself has.

## Content framing

The footnote in `index.html` notes that the four-circle diagram is a modern Western adaptation, not a traditional Japanese concept. It likely exists to present the popular model accurately without overselling it.

## Related pages

- [Pitfalls](pitfalls.md)
- [Patterns and conventions](../how-to-contribute/patterns-and-conventions.md)
