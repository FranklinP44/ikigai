# Ikigai overview

Ikigai is a single-page, interactive explainer for the four-circle Ikigai model. It draws four overlapping circles in SVG and lets visitors hover, tap, or click any of the 13 overlap regions to read what that combination means, with real-world examples.

## What it does

- Renders the four circles ("What you love", "What you're good at", "What the world needs", "What you can be paid for") as an SVG diagram in `index.html`.
- Highlights the region under the pointer and shows its title, description, circle membership, and three examples in a side panel.
- Lets the visitor pin a region by clicking it, or jump to the five named regions (Ikigai, Passion, Mission, Profession, Vocation) with buttons below the panel.
- Adds a short historical note: the four-circle model is a Western adaptation, relabeled as "ikigai" by Marc Winn in 2014 from Andrés Zuzunaga's purpose Venn diagram.

## Who it is for

Anyone curious about the Ikigai framework. There is no login, backend, or data collection. The page is a static site that runs entirely in the browser.

## Tech stack

| Layer | Technology | File |
| --- | --- | --- |
| Markup and diagram | HTML5 with inline SVG | `index.html` |
| Behavior | Vanilla JavaScript (no framework, no build step) | `script.js` |
| Styling | Plain CSS with custom properties | `styles.css` |
| Fonts | Google Fonts (Fraunces, Inter, Noto Serif JP) | `index.html` |

## Quick links

- [Architecture](architecture.md): how the three files fit together and how a pointer event becomes an updated panel.
- [Getting started](getting-started.md): open the page locally in under a minute.
- [Glossary](glossary.md): circle letters, zones, pinning, and other terms used in the code.
- [Zone exploration](../features/zone-exploration.md): the main user-facing interaction.
- [Region rendering](../systems/region-rendering.md): how the SVG masks carve out each overlap region.
- [Zone keys](../primitives/zone-keys.md): the four-letter keys (`L`, `LG`, `LGNP`, ...) that tie everything together.
