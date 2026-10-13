# Testing

The repository has a Vitest unit test suite plus a manual browser checklist. Run the tests with `npm run test` (or `npm run test:watch` while editing). CI runs them on every pull request, along with the type check in `npm run build`.

## Unit tests

Vitest is configured in `vitest.config.ts`, which extends `vite.config.ts`. Tests run in Node with no DOM, so they cover the pure modules and read markup as text.

| File | What it checks |
| --- | --- |
| `src/data.test.ts` | `ZONE_KEYS` order and uniqueness, `isZoneKey()`, that `ZONES`, `EXAMPLES` and `CIRCLE` have exactly the right keys, three examples per zone, eyebrows that match the number of circles, and examples free of markup (they are rendered with `innerHTML`) |
| `src/geometry.test.ts` | `zoneAt()` at known points (labels, dots, edges, outside), and a scan of every integer point that confirms the circles only form known zones and reach all 13 |
| `src/index-html.test.ts` | that the circles and outlines in `index.html` match `CENTERS` and `R`, that the dots and pair labels sit in the right zones, that each pill has a valid `data-zone` and matching title, and that every `byId()` id in `src/main.ts` exists in `index.html` |

Conventions, enforced by `vitest.config.ts` and the `vitest` lint rules in `.oxlintrc.json`:

- Test files sit next to the module they cover and end in `.test.ts`. Other names, such as `.spec.ts`, fail lint.
- Each test file runs in its own worker thread with a fresh module graph, and file and test order is shuffled on every run. Rerun with `npx vitest run --sequence.seed=<seed>` (the seed is printed at the start of the run) to reproduce an order-dependent failure.
- `.only` and `.skip` fail lint.

## Coverage and durations

`npm run test:coverage` runs the suite with V8 coverage over `src/data.ts` and `src/geometry.ts` and fails if statements, branches, functions or lines fall below 100%. `src/main.ts` is excluded because it touches the DOM as it loads. The text report prints to the console, and an HTML report is written to `coverage/`.

Every test run also writes a JSON report to `reports/test-results.json` (and, on GitHub Actions, a JUnit report to `reports/junit.xml`). `npm run test:durations` reads it and prints the total run time, the time per file and the ten slowest tests, with a warning for any test over 1 second or a suite over 10 seconds. In CI the same table is added to the job summary, and `coverage/` and `reports/` are uploaded as the `test-reports` artifact so durations can be compared across runs. The full-grid scan in `src/geometry.test.ts` is the slowest test, at about half a second.

## Automated check: type checking

`npm run build` runs `tsc --noEmit && vite build`. The type check uses the strict settings in `tsconfig.json` (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) over everything in `src/`, including the tests.

What the type check catches:

- A zone key missing from `ZONES` or `EXAMPLES`, because both are typed `Record<ZoneKey, ...>` in `src/data.ts`.
- A misspelled zone key such as `"LGX"` anywhere a `ZoneKey` is expected.
- Wrong element types passed to `byId()` or `el()` in `src/main.ts`.

What neither the type check nor the unit tests catch:

- Anything visual or interactive, such as hover, click and the swap animation.
- Styling and responsive layout.

## Manual checklist

Run this after any change to `src/main.ts`, `src/styles.css` or `index.html`. It takes about two minutes. Use `npm run dev`, or `npm run preview` to check the production bundle.

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

## Browser tests

Interaction is still checked by hand. A browser test runner such as Playwright would fit best for that, since it depends on SVG masks and pointer events. It is not installed today. See [Cleanup opportunities](../cleanup-opportunities.md).
