# Testing

There are no automated tests and no test framework in the repository. The only automated check is the TypeScript type check, which runs as part of `npm run build`. Behavior is tested manually in a browser.

## Automated check: type checking

`npm run build` runs `tsc --noEmit && vite build`. The type check uses the strict settings in `tsconfig.json` (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) over everything in `src/`.

The `build` job in `.github/workflows/deploy-pages.yml` runs `npm ci` and `npm run build` on every pull request, so a type error blocks a green PR. See [Deployment](../deployment.md).

What the type check catches:

- A zone key missing from `ZONES` or `EXAMPLES`, because both are typed `Record<ZoneKey, ...>` in `src/data.ts`.
- A misspelled zone key such as `"LGX"` anywhere a `ZoneKey` is expected.
- Wrong element types passed to `byId()` or `el()` in `src/main.ts`.

What it does not catch:

- Whether each zone has exactly three examples. `EXAMPLES` is typed `readonly string[]`, so any length passes.
- Geometry mismatches between `index.html` and `src/geometry.ts`.
- Missing element IDs in `index.html`. Those only fail at runtime, when `byId()` throws `Missing #id`.
- Anything visual or interactive.

## Manual checklist

Run this after any change. It takes about two minutes. Use `npm run dev`, or `npm run preview` to check the production bundle.

### Load

- [ ] The page loads with no errors in the DevTools console.
- [ ] The circles pop in one after another, then labels and outlines fade in.
- [ ] The panel shows "Ikigai" with all four chips on.

### Diagram interaction

- [ ] Hovering each of the four single-circle areas shows that circle's name and the eyebrow "One circle".
- [ ] Hovering each named pair (Passion, Mission, Profession, Vocation) highlights the region and updates the panel.
- [ ] Hovering near each white dot shows a three-circle zone.
- [ ] The cursor becomes a pointer over the circles and returns to normal outside them.
- [ ] Moving outside the circles returns the panel to the pinned zone.
- [ ] Clicking a zone pins it. Leaving the diagram then shows that zone instead of Ikigai.

### Explore buttons

- [ ] Each of the five pills switches the zone and shows the active (dark) style.
- [ ] The pill for the pinned zone stays active; hovering a different zone deactivates it until the pointer leaves.

### Responsive

- [ ] At widths below 900 px, the panel stacks under the diagram.
- [ ] At widths below 600 px, the SVG labels are still readable.
- [ ] On a touch device or touch emulation, tapping a zone pins it.

### After deploy

- [ ] https://franklinp44.github.io/ikigai/ loads with styles and scripts (no 404s for files under `assets/` in the Network tab).

## Quick data check

The old console snippet no longer works. `ZONES` and `EXAMPLES` are now module exports in `src/data.ts`, so they are not globals in the browser console. The type check already guarantees every zone key has an entry in both. To confirm each zone has three examples, read `EXAMPLES` in `src/data.ts`, or add a temporary line at the end of `src/main.ts` while running `npm run dev`:

```ts
console.log(ZONE_KEYS.every(k => EXAMPLES[k].length === 3));
```

It should log `true`. `src/main.ts` already imports `ZONE_KEYS` and `EXAMPLES` from `./data`. Remove the line before committing.

## If you add automated tests

A browser test runner such as Playwright would fit best, since most behavior depends on SVG geometry and pointer events. Since the migration, `zoneAt()` in `src/geometry.ts` and the data in `src/data.ts` are separate modules with no DOM access, so they could be unit tested with a runner such as Vitest without further refactoring. Neither runner is installed today. See [Cleanup opportunities](../cleanup-opportunities.md).
