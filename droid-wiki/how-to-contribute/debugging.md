# Debugging

Everything runs in the browser, so DevTools is the only tool you need.

## Useful console snippets

`script.js` declares its state and data at the top level, so you can inspect it from the console.

```js
current          // zone being shown, e.g. "LG"
pinned           // zone to return to, default "LGNP"
zoneAt(400, 400) // "LGNP"
zoneAt(400, 120) // "L"
setZone("GNP")   // force a zone
```

To see every generated overlay:

```js
Object.entries(zoneEls).map(([k, g]) => [k, g.classList.contains("active")])
```

## Common problems

| Symptom | Likely cause | Where to look |
| --- | --- | --- |
| Highlight appears in the wrong place, or hovering selects the wrong zone | Circle centers or radius in `script.js` (`C`, `R`) no longer match the `<circle>` elements in `index.html` | Both files; see [Pitfalls](../background/pitfalls.md) |
| `TypeError: Cannot read properties of undefined (reading 'map')` | A key exists in `ZONES` but not in `EXAMPLES` | `render()` in `script.js` |
| Hovering a region does nothing | `zoneAt()` produced a key missing from `ZONES`, so it returned `null` | `ZONES` in `script.js` |
| Highlight edges look jagged | Masks were swapped for clip-paths | `region()` in `script.js` |
| Panel text flickers when moving quickly | The swap timeout or CSS transition durations were changed out of sync | `setZone()` in `script.js` and `.card .content` in `styles.css` |
| Fonts look like Georgia / system fonts | Google Fonts blocked or offline | `<link>` in `index.html` |
| Nothing is interactive and `svg` is `null` in the console | `script.js` was moved into `<head>` without `defer` | `<script>` tag in `index.html` |

## Inspecting the SVG

In the Elements panel, expand `svg#ikigai`:

- `#defs` holds the `in-*` and `out-*` masks generated at load.
- `#centerFill` holds the gold `LGNP` region.
- `#zones` holds one `g.zone[data-zone]` per zone. Add the `active` class by hand to preview a highlight.

Temporarily setting `.zone { opacity: 1 }` in the Styles pane shows all overlays at once, which makes geometry mistakes obvious.

## Logging

The app writes nothing to the console. Add temporary `console.log` calls in the `pointermove` handler in `script.js` to trace coordinates and keys, and remove them before committing.
