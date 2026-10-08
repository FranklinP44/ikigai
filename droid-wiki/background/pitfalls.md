# Pitfalls

Places where a reasonable-looking change can break something.

## Circle geometry lives in two places

The visible circles are declared in `index.html` (four `<circle>` elements in `.circles` and four more in `.outlines`, each with `cx`, `cy`, `r`). The geometry used for masks and hit testing is declared separately in `src/geometry.ts` as `CENTERS` and `R`. Label positions and the four white dots in `index.html` are also hand-placed for this geometry.

If you move or resize a circle in one file but not the other, the highlight and the hover target will no longer line up with what is drawn. The type checker cannot catch this. Change all of them together.

## `innerHTML` in `render()`

`render()` in `src/main.ts` builds chips and example list items with template strings and `innerHTML`. The comment above it says this is deliberate: the content is static and trusted, and markup strings keep the DOM identical to the original page. That holds because every string comes from constants in `src/data.ts`. If content ever comes from a URL parameter, a CMS, or user input, this becomes an XSS risk. Switch to `textContent` or DOM creation first. The eyebrow, title, and description already use `textContent`.

## `ZONE_KEYS` is not checked for completeness

`ZONES` and `EXAMPLES` in `src/data.ts` are typed `Record<ZoneKey, ...>`, so leaving out a zone's content is now a compile error (in the old `script.js` it was a runtime `TypeError`). `ZONE_KEYS` is different: it is typed `readonly ZoneKey[]`, so the compiler accepts it with an entry missing. A key missing from `ZONE_KEYS` gets no overlay in `src/main.ts`, and `isZoneKey()` rejects it, so `zoneAt()` returns `null` there and hovering that region shows the pinned zone instead. When you add or rename a zone, update the `ZoneKey` union, `ZONE_KEYS`, `ZONES`, and `EXAMPLES` together.

## Swap timing is coupled across files

`setZone()` in `src/main.ts` waits 140 ms before rendering new content. The fade it waits on is the 0.18 s transition on `.card .content` in `src/styles.css`. If the CSS transition gets much shorter, new content can appear before the fade-out finishes. If it gets much longer, the content swaps while the old text is still visible. Adjust them together.

## The SVG viewBox is offset

The `viewBox` is `40 40 720 720`, not `0 0 800 800`. Masks still use `0,0` to `800,800` (`FULL` in `src/main.ts`), which is intentionally larger than the visible area. Use `toSvg()` to convert pointer coordinates; don't compute them from the element's bounding box by hand.

## Keyboard users can't reach every zone

Only the five `.pill` buttons are focusable. The four single-circle zones and four three-circle zones are reachable by pointer only. Adding keyboard access would mean making regions focusable or adding more buttons.

## Element IDs are required at startup

`src/main.ts` looks up `#ikigai`, `#defs`, `#zones`, `#centerFill`, `#content`, `#eyebrow`, `#title`, `#desc`, `#chips`, and `#examples` with `byId()` as soon as the module runs. If any is missing or is the wrong element type, `byId()` throws `Missing #<id>` and nothing renders. Renaming an ID in `index.html` means updating `src/main.ts` too. The script tag must keep `type="module"`: Vite only processes module scripts, and module scripts are deferred, which is why the lookups find the elements.

## Absolute `/src/` paths in `index.html` are dev-time only

`index.html` references `/src/styles.css` and `/src/main.ts`. These work under `npm run dev` because Vite serves the source tree and compiles TypeScript on the fly. They are not valid in production: `npm run build` rewrites them to relative, hashed files such as `./assets/index-<hash>.js`. Do not serve the repo root as a static site, and do not point other tools at the source `index.html` expecting it to run in a browser.

## `dist/index.html` cannot be opened from disk

The built page loads a module script, and browsers block module scripts on `file://` URLs. The README says the build "must be served over HTTP". Use `npm run preview` (http://localhost:4173) or any static file server to check a build.

## The Pages subpath needs `base: './'`

The site is served from `https://franklinp44.github.io/ikigai/`, not from the domain root. `vite.config.ts` sets `base: './'` so built asset URLs are relative. Removing it, or setting it to `/`, makes the built page request `/assets/...` at the domain root, which returns 404 on Pages while still working locally under `npm run preview`.

## Pages source must be "GitHub Actions"

`.github/workflows/deploy-pages.yml` deploys the `dist/` artifact with `actions/deploy-pages`. That only works when the repository's Pages source is set to "GitHub Actions" in Settings > Pages. If it is switched back to "Deploy from a branch", Pages would serve the unbuilt `index.html` from `main`, which loads `/src/main.ts` and fails. See [Deployment](../deployment.md).

## Type errors block deployment

`npm run build` runs `tsc --noEmit` before `vite build`, and the workflow runs it on every push and pull request. With `noUnusedLocals` and `noUnusedParameters` on, an unused import or variable fails the build, and on `main` that means no deploy. `npm run dev` does not type-check, so run `npm run build` locally before pushing.

## Related pages

- [Debugging](../how-to-contribute/debugging.md) has symptoms and fixes for most of these.
- [Cleanup opportunities](../cleanup-opportunities.md) lists small refactors that would remove some of them.
- [Deployment](../deployment.md) covers the build and Pages workflow.
