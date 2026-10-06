# Getting started

The project has no dependencies to install and nothing to build. You need a modern browser and, optionally, any static file server.

## Prerequisites

- A current version of Chrome, Edge, Firefox, or Safari. The code uses SVG masks, `mix-blend-mode`, `backdrop-filter`, and pointer events.
- Git, to clone the repository.
- Optional: Python 3 or Node.js, if you prefer serving the files over HTTP instead of opening them from disk.
- An internet connection for the Google Fonts stylesheet. Without it, the page falls back to Georgia and system sans-serif fonts (see `styles.css`).

## Clone

```bash
git clone https://github.com/FranklinP44/ikigai.git
cd ikigai
```

## Run

Option 1, open the file directly:

```bash
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Option 2, serve it locally (closer to how it would be hosted):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

```bash
npx serve .
```

## Verify it works

1. The four circles pop in with a short staggered animation, then the labels fade in.
2. The panel on the right shows "Ikigai" with all four circle chips highlighted.
3. Moving the pointer over the diagram highlights the region under it and updates the panel.
4. Clicking a region pins it, so moving the pointer off the diagram returns to that region instead of Ikigai.

## Build and test

There is no build or automated test suite. Changes are checked by reloading the page in a browser. See [Testing](../how-to-contribute/testing.md) for a manual checklist, and [Development workflow](../how-to-contribute/development-workflow.md) for the edit-reload loop.
