# Visual design

Active contributors: Franklin Pfaller

## Purpose

All styling lives in `src/styles.css`. It defines the palette and fonts as CSS custom properties, animates the diagram in on load, styles the detail panel, and adapts the layout for tablets and phones. `index.html` links it with `<link rel="stylesheet" href="/src/styles.css">`. The Vite dev server serves that path directly, and `npm run build` bundles it into a hashed file under `dist/assets/` and rewrites the link to a relative URL (see [Deployment](../deployment.md)).

## Directory layout

```text
ikigai/
├── index.html       # Google Fonts <link>, stylesheet link, SVG fills that reference var(--love) etc.
└── src/
    └── styles.css   # tokens, layout grid, diagram, panel, media queries
```

## Key abstractions

| Name | File | Description |
| --- | --- | --- |
| `:root` custom properties | `src/styles.css` | Background, ink, muted, line colors, four circle colors, serif and sans font stacks |
| `.wrap` | `src/styles.css` | Two-column grid (diagram 1.3fr, panel 0.7fr, min 300 px), max width 1180 px |
| `@keyframes pop` | `src/styles.css` | Circle entrance: fade and scale from 0.82 to 1 |
| `@keyframes fade` | `src/styles.css` | Opacity fade for the center fill, overlays, outlines, and labels |
| `.circle` | `src/styles.css` | `mix-blend-mode: multiply` and `fill-opacity: 0.82` so overlaps darken like ink |
| `.card` | `src/styles.css` | Frosted panel: translucent white, `backdrop-filter: blur(8px)`, 22 px radius |

## How it works

### Tokens

| Token | Value | Used for |
| --- | --- | --- |
| `--bg` | `#FBF7F0` | Page background (inside a radial gradient on `body`) |
| `--ink` | `#2A2521` | Body text, labels, active pill |
| `--muted` | `#7A7068` | Kanji, subtitle, eyebrows, note |
| `--line` | `#E8DFD3` | Card, chip, and pill borders |
| `--love` | `#F2A29B` | Circle L |
| `--good` | `#F5C877` | Circle G |
| `--needs` | `#BBA8F0` | Circle N |
| `--paid` | `#8CD6C3` | Circle P |
| `--serif` | Fraunces, Georgia, Times New Roman | Headings, pair labels |
| `--sans` | Inter, system-ui, ... | Body text, circle labels |

Japanese text (`.kanji`, `.label-center-jp`) uses Noto Serif JP directly. All three web fonts load from Google Fonts via a `<link>` in `index.html`; Vite leaves that external URL unchanged.

### Entrance sequence

```mermaid
graph LR
    T0["0 s: circle 1 pops"] --> T1["0.08 s: circle 2"] --> T2["0.16 s: circle 3"] --> T3["0.24 s: circle 4"] --> T4["0.55 s: fills, outlines, labels fade in over 0.8 s"]
```

The circles use `transform-box: fill-box` and `transform-origin: center` so each scales from its own center instead of the SVG origin. The `.circles` group has `isolation: isolate` so the multiply blend only mixes the circles with each other, plus a soft `drop-shadow`.

### Responsive layout

| Breakpoint | Change |
| --- | --- |
| > 900 px | Two columns, card `min-height: 580px` |
| ≤ 900 px | Single column, diagram above panel, no card minimum height |
| ≤ 600 px | Tighter padding, and larger SVG label font sizes |

The phone breakpoint enlarges SVG text because the SVG scales down with the viewport, which would otherwise make labels too small to read. The comment above the media query in `src/styles.css` notes this.

## Integration points

- SVG circle fills in `index.html` and chip dots built by `render()` in `src/main.ts` reference the circle tokens (via `CIRCLE[k].color` in `src/data.ts`, for example `var(--love)`), so changing a token recolors the diagram and the chips together.
- State classes toggled by `src/main.ts` (`.active`, `.swap`, `.hovering`, `.off`) are defined here. See [Zone exploration](../features/zone-exploration.md) and [Detail panel](../features/detail-panel.md).
- The stylesheet is plain CSS. There is no preprocessor or PostCSS config in the repo; Vite only bundles and fingerprints it.

## Entry points for modification

To retheme, change the `:root` tokens in `src/styles.css`. To adjust motion, edit the `pop`/`fade` keyframes and their delays. If you change the `.card .content` transition duration, keep the 140 ms timeout in `setZone()` in `src/main.ts` slightly shorter so new content appears while the panel is faded out.

## Key source files

| File | Purpose |
| --- | --- |
| `src/styles.css` | All tokens, layout, animation, and responsive rules |
| `index.html` | Font loading, the stylesheet link, and token references in SVG fills |
| `src/data.ts` | Circle colors in `CIRCLE`, expressed as CSS variables |
| `src/main.ts` | Inline chip colors from `CIRCLE[k].color` |
