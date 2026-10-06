# Configuration

There are no config files or environment variables. Behavior is controlled by constants at the top of `script.js` and custom properties in `styles.css`.

## JavaScript constants

| Constant | Value | Purpose |
| --- | --- | --- |
| `NS` | `"http://www.w3.org/2000/svg"` | SVG namespace for `createElementNS` |
| `R` | `200` | Radius of every circle, in SVG user units |
| `ORDER` | `"LGNP"` | Canonical letter order for [zone keys](../primitives/zone-keys.md) |
| `C` | `L: [400, 270]`, `G: [270, 400]`, `N: [530, 400]`, `P: [400, 530]` | Circle centers |
| `FULL` | `maskUnits: "userSpaceOnUse"`, `x: 0`, `y: 0`, `width: 800`, `height: 800` | Shared mask bounds |

## Tunable values in code

| Value | Location | Effect |
| --- | --- | --- |
| `rgba(255,255,255,.5)` | Overlay loop in `script.js` | Highlight strength for most zones |
| `rgba(255,255,255,.35)` | Overlay loop in `script.js` | Highlight strength for the gold center |
| `140` (ms) | `setZone()` in `script.js` | Delay before new panel content renders |
| `"LGNP"` | `pinned` initial value and final `setZone()` call in `script.js` | Default zone on load |

## SVG settings in `index.html`

| Setting | Value |
| --- | --- |
| `viewBox` | `40 40 720 720` |
| `#gold` gradient | Center (400, 400), radius 100, stops `#FFF8E3` → `#F8D78F` → `#EDB65A` |

## CSS custom properties

Defined on `:root` in `styles.css`. Full descriptions are in [Visual design](../systems/visual-design.md).

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
| 900 px | `styles.css` | Single-column layout |
| 600 px | `styles.css` | Smaller padding, larger SVG labels |
