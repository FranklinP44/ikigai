# Dependencies

The app has no package dependencies. It relies on one external resource and a handful of browser features.

## External resources

| Resource | Loaded from | Used for | If unavailable |
| --- | --- | --- | --- |
| Fraunces (serif) | `fonts.googleapis.com` via `<link>` in `index.html` | Title, panel headings, pair labels, center label | Falls back to Georgia, then Times New Roman |
| Inter (sans) | Same stylesheet | Body text, circle labels, chips, pills | Falls back to `system-ui` and platform sans fonts |
| Noto Serif JP | Same stylesheet | 生き甲斐 above the title and in the center | Falls back to the default serif with Japanese glyphs |

`index.html` also adds `preconnect` hints for `fonts.googleapis.com` and `fonts.gstatic.com` to speed up font loading.

## Browser features

| Feature | Used in | Notes |
| --- | --- | --- |
| SVG `<mask>` with `userSpaceOnUse` | `script.js` | Core of [Region rendering](../systems/region-rendering.md) |
| `getScreenCTM()` and `createSVGPoint()` | `toSvg()` in `script.js` | Pointer to SVG coordinate conversion |
| Pointer events | `script.js` | One code path for mouse, pen, and touch |
| `mix-blend-mode: multiply` | `styles.css` | Overlap colors |
| `backdrop-filter: blur()` | `styles.css` | Frosted panel; degrades to a translucent card where unsupported |
| CSS custom properties | `styles.css`, `index.html`, `script.js` | Theming |
| `transform-box: fill-box` | `styles.css` | Circles scale from their own centers |

All of these are supported in current Chrome, Edge, Firefox, and Safari.

## Dev dependencies

None. See [Tooling](../how-to-contribute/tooling.md) for optional tools you can run with `npx`.
