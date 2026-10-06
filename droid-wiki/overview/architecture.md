# Architecture

Ikigai is three static files loaded by the browser. `index.html` holds the page layout and the base SVG, `styles.css` handles the look and animations, and `script.js` builds the overlap regions at load time and wires up the interaction.

## Components

```mermaid
graph TD
    HTML[index.html<br/>layout + base SVG]
    HTML -->|loads| CSS[styles.css<br/>tokens, animation, layout]
    HTML -->|loads| JS[script.js<br/>data, masks, events]
    HTML -->|loads| Fonts[Google Fonts CDN]
    JS -->|builds masks and zone overlays| SVG[svg#ikigai]
    JS -->|writes zone content| Panel[Detail panel]
    CSS -->|styles state classes| SVG
    CSS -->|styles state classes| Panel
```

There is no build step, bundler, server code, or package manager. The browser loads `index.html`, which pulls in `styles.css` from its `<head>` and runs `script.js` at the end of `<body>`, after the DOM it needs already exists.

## Language breakdown

```mermaid
xychart-beta horizontal
    title "Lines of code by file"
    x-axis ["script.js (JS)", "styles.css (CSS)", "index.html (HTML)"]
    y-axis "Lines" 0 --> 160
    bar [150, 144, 110]
```

See [By the numbers](../by-the-numbers.md) for the full snapshot.

## SVG layer stack

The diagram in `index.html` is a stack of SVG groups. Later groups paint on top of earlier ones.

| Order | Group | Filled by | Purpose |
| --- | --- | --- | --- |
| 1 | `<g class="circles">` | `index.html` | Four colored circles, blended with `mix-blend-mode: multiply` so overlaps darken naturally |
| 2 | `<g id="centerFill">` | `script.js` | Gold radial gradient painted only inside the four-way overlap |
| 3 | `<g id="zones">` | `script.js` | One translucent white overlay per region, hidden until it becomes active |
| 4 | `<g class="outlines">` | `index.html` | White circle outlines drawn over the fills |
| 5 | `<g class="labels">` | `index.html` | Circle names, pair names, center label, and the four white dots; `pointer-events: none` |

The masks that shape layers 2 and 3 are explained in [Region rendering](../systems/region-rendering.md).

## Request lifecycle: pointer to panel

There are no network requests after load. The interesting flow is how a pointer event updates the page.

```mermaid
sequenceDiagram
    participant U as Visitor
    participant S as svg#ikigai
    participant Z as zoneAt()
    participant SZ as setZone()
    participant R as render()
    participant P as Detail panel

    U->>S: pointermove (clientX, clientY)
    S->>S: toSvg() converts to SVG coordinates
    S->>Z: zoneAt(x, y)
    Z-->>S: zone key such as "LG", or null
    S->>SZ: setZone(key or pinned)
    SZ->>SZ: toggle .active on zone overlay and pill
    SZ->>P: add .swap (fade out)
    SZ->>R: after 140 ms, render(key)
    R->>P: write eyebrow, title, description, chips, examples
    SZ->>P: remove .swap (fade in)
```

Hit testing is pure math: `zoneAt()` in `script.js` checks the distance from the pointer to each circle center. It does not rely on DOM hit targets, so the overlapping masked groups never compete for events. See [Zone exploration](../features/zone-exploration.md) for the full interaction model.

## Data model at a glance

All content lives in three object literals at the top of `script.js`:

- `CIRCLE`: display name and color variable for each of the four circles.
- `ZONES`: eyebrow, title, and description for each of the 13 regions.
- `EXAMPLES`: three example strings for each region.

Every one of these is keyed by a [zone key](../primitives/zone-keys.md). Field-level details are in [Data models](../reference/data-models.md).

## Key source files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout, base SVG (circles, outlines, labels, gold gradient), detail panel shell, and Explore buttons |
| `script.js` | Zone data, SVG mask generation, hit testing, panel rendering, and event handlers |
| `styles.css` | Design tokens, entrance animations, zone overlay transitions, panel styling, and responsive breakpoints |
