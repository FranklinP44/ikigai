# Pitfalls

Places where a reasonable-looking change can break something.

## Circle geometry lives in two places

The visible circles are declared in `index.html` (four `<circle>` elements in `.circles` and four more in `.outlines`, each with `cx`, `cy`, `r`). The geometry used for masks and hit testing is declared separately in `script.js` as `C` and `R`. Label positions and the four white dots in `index.html` are also hand-placed for this geometry.

If you move or resize a circle in one file but not the other, the highlight and the hover target will no longer line up with what is drawn. Change all of them together.

## `innerHTML` in `render()`

`render()` in `script.js` builds chips and example list items with template strings and `innerHTML`. That is safe today because every string comes from constants in the same file. If content ever comes from a URL parameter, a CMS, or user input, this becomes an XSS risk. Switch to `textContent` or DOM creation first. The eyebrow, title, and description already use `textContent`.

## Every zone needs examples

`render()` calls `EXAMPLES[key].map(...)` without a guard. A new entry in `ZONES` without a matching `EXAMPLES` entry throws a `TypeError` the first time that zone is shown.

## Swap timing is coupled across files

`setZone()` waits 140 ms before rendering new content. The fade it waits on is the 0.18 s transition on `.card .content` in `styles.css`. If the CSS transition gets much shorter, new content can appear before the fade-out finishes. If it gets much longer, the content swaps while the old text is still visible. Adjust them together.

## The SVG viewBox is offset

The `viewBox` is `40 40 720 720`, not `0 0 800 800`. Masks still use `0,0` to `800,800` (`FULL` in `script.js`), which is intentionally larger than the visible area. Use `toSvg()` to convert pointer coordinates; don't compute them from the element's bounding box by hand.

## Keyboard users can't reach every zone

Only the five `.pill` buttons are focusable. The four single-circle zones and four three-circle zones are reachable by pointer only. Adding keyboard access would mean making regions focusable or adding more buttons.

## Script placement

`script.js` runs at the end of `<body>` and immediately queries `#ikigai`, `#defs`, `#zones`, and `#content`. Moving the `<script>` tag into `<head>` without `defer` will make those lookups return `null`.

## Related pages

- [Debugging](../how-to-contribute/debugging.md) has symptoms and fixes for most of these.
- [Cleanup opportunities](../cleanup-opportunities.md) lists small refactors that would remove some of them.
