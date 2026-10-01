# Ikigai

An interactive four-circle Ikigai diagram. Hover or tap any region to read about it.

Built with TypeScript and [Vite](https://vite.dev/).

## Requirements

Node.js 20.19+ or 22.12+, and npm.

## Commands

```sh
npm install       # install dependencies
npm run dev       # start the dev server at http://localhost:5173
npm run build     # type-check, then build static files into dist/
npm run preview   # serve the built dist/ at http://localhost:4173
```

The built page must be served over HTTP (for example with `npm run preview` or any static file host); opening `dist/index.html` directly from disk is not supported.

## Layout

- `index.html`: page markup and the SVG diagram
- `src/main.ts`: builds the region masks and handles hover, click and the Explore pills
- `src/data.ts`: circle, region and example content
- `src/geometry.ts`: circle positions and hit-testing
- `src/styles.css`: styles
