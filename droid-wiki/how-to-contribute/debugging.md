# Debugging

The app runs in the browser, so DevTools is the main tool. Problems also show up in two other places: `npm run build` output (type errors) and the GitHub Actions logs (CI and deploy failures).

## Debugging in the dev server

Run `npm run dev` and open http://localhost:5173. Vite serves `src/main.ts`, `src/data.ts`, and `src/geometry.ts` as separate modules with source maps, so in the Sources panel you can open the TypeScript files, set breakpoints, and step through them by their original line numbers.

The production build from `npm run build` does not emit source maps (`vite.config.ts` only sets `base`), and its code is minified into one file under `dist/assets/`. Reproduce issues in the dev server when you can.

## Inspecting state

Before the migration, state and data were globals you could read from the console. They are now module-scoped in `src/main.ts` (`current`, `pinned`, `swapTimer`, `zoneEls`) and module exports in `src/data.ts` and `src/geometry.ts`, so typing `current` or `zoneAt(400, 400)` in the console raises a `ReferenceError`.

Options:

- Set a breakpoint in the `pointermove` handler or in `setZone()` in `src/main.ts`, then inspect variables in the Scope pane.
- Add a temporary global while debugging, and remove it before committing:

  ```ts
  Object.assign(window, { zoneAt, setZone, zoneEls });
  ```

  Then in the console:

  ```js
  zoneAt(400, 400) // "LGNP"
  zoneAt(400, 120) // "L"
  setZone("GNP")   // force a zone
  Object.entries(zoneEls).map(([k, g]) => [k, g.classList.contains("active")])
  ```

## Common problems

| Symptom | Likely cause | Where to look |
| --- | --- | --- |
| `Error: Missing #<id>` in the console and nothing is interactive | `byId()` in `src/main.ts` could not find that ID in `index.html`, or found an element of a different type than expected | The element IDs in `index.html` and the `byId()` calls at the top of `src/main.ts` |
| `npm run build` fails with `error TS...` before Vite runs | A type error, or an unused local or parameter (`noUnusedLocals`, `noUnusedParameters` in `tsconfig.json`) | The file and line in the `tsc` output |
| Highlight appears in the wrong place, or hovering selects the wrong zone | `CENTERS` or `R` in `src/geometry.ts` no longer match the `<circle>` elements in `index.html` | Both files; see [Pitfalls](../background/pitfalls.md) |
| Hovering a region does nothing | `zoneAt()` built a key that `isZoneKey()` rejects (not in `ZONE_KEYS`), so it returned `null` | `src/geometry.ts`, `ZONE_KEYS` in `src/data.ts` |
| Highlight edges look jagged | Masks were swapped for clip-paths | `region()` in `src/main.ts` |
| Panel text flickers when moving quickly | The 140 ms swap timeout and the CSS transition durations were changed out of sync | `setZone()` in `src/main.ts` and `.card .content` in `src/styles.css` |
| Fonts look like Georgia / system fonts | Google Fonts blocked or offline | `<link>` in `index.html` |
| Deployed site is a blank page or unstyled, with 404s for `assets/*.js` or `*.css` | Asset URLs are absolute (`/assets/...`) and resolve outside `/ikigai/` because `base` in `vite.config.ts` was removed or changed | `vite.config.ts`; see [Deployment](../deployment.md) |
| Opening `dist/index.html` from disk does not work | Module scripts need HTTP, and opening from disk is not supported (`README.md`) | Use `npm run preview` instead |

## Inspecting the SVG

In the Elements panel, expand `svg#ikigai`:

- `#defs` holds the `in-*` and `out-*` masks generated at load.
- `#centerFill` holds the gold `LGNP` region.
- `#zones` holds one `g.zone[data-zone]` per zone. Add the `active` class by hand to preview a highlight.

Temporarily setting `.zone { opacity: 1 }` in the Styles pane shows all overlays at once, which makes geometry mistakes obvious.

## CI and deploy failures

Open the failed run under the Actions tab at https://github.com/FranklinP44/ikigai/actions, or from the terminal:

```bash
gh run list -R FranklinP44/ikigai --limit 10
gh run view <run-id> -R FranklinP44/ikigai --log-failed
```

- A failure in the `build` job of **Build and deploy to GitHub Pages** is usually the same error `npm run build` shows locally. Run it locally first.
- A failure in the `deploy` job usually points to the Pages setup (the Pages source must be "GitHub Actions"). See [Deployment](../deployment.md).
- **Publish wiki to Confluence** fails early with "Missing Confluence configuration" when a required variable or secret is unset on a real publish, and uploads whatever it converted as a `confluence-preview` artifact, even when a step fails.

## Logging

The app writes nothing to the console. Add temporary `console.log` calls in the `pointermove` handler in `src/main.ts` to trace coordinates and keys, and remove them before committing.
