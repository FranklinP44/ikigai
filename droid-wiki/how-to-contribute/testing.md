# Testing

Vitest checks pure logic and markup consistency; manual browser checks cover interactions and visual behavior.

Active contributors: FranklinP44

## Purpose

Use this page to choose tests and interpret reports. Run `npm run test` once or `npm run test:watch` while editing. The complete contribution gate is `npm run check:agents-md`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, then `npm run build`. See [Development workflow](development-workflow.md).

## Unit tests

Vitest is configured in `vitest.config.ts`, which extends `vite.config.ts`. Tests run in Node with no DOM, so they cover the pure modules and read markup as text.

| File | What it checks |
| --- | --- |
| `src/data.test.ts` | `ZONE_KEYS` order and uniqueness, `isZoneKey()`, that `ZONES`, `EXAMPLES` and `CIRCLE` have exactly the right keys, three examples per zone, eyebrows that match the number of circles, and examples free of markup (they are rendered with `innerHTML`) |
| `src/geometry.test.ts` | `zoneAt()` at known points (labels, dots, edges, outside), and a scan of every integer point that confirms the circles only form known zones and reach all 13 |
| `src/index-html.test.ts` | that the circles and outlines in `index.html` match `CENTERS` and `R`, that the dots and pair labels sit in the right zones, that each pill has a valid `data-zone` and matching title, and that every `byId()` id in `src/main.ts` exists in `index.html` |

Conventions, enforced by `vitest.config.ts` and the `vitest` lint rules in `.oxlintrc.json`:

- Test files sit next to the module they cover and end in `.test.ts`. Other names, such as `.spec.ts`, fail lint.
- Vitest collects only `src/**/*.test.ts`. Import `describe`, `it`, and `expect` explicitly; globals are off. Follow `AGENTS.md`: one `describe` per exported name, sentence-like behavior titles, and `it.each` for tables.
- Tests use the Node environment, threaded workers, isolation, parallel files, and restored mocks. Each file has a fresh module graph; file and test order is shuffled. Rerun with `npx vitest run --sequence.seed=<seed>` (printed at run start) to reproduce an order-dependent failure.
- Never import `src/main.ts` as executable code: it queries the DOM on load. Read it or `index.html` as raw text, following `src/index-html.test.ts`.
- `.only` and `.skip` fail lint.

## Coverage and durations

`npm run test:coverage` runs the suite with V8 coverage over `src/data.ts` and `src/geometry.ts` and fails if statements, branches, functions or lines fall below 100%. `src/main.ts` is excluded because it touches the DOM as it loads. Add tests for new pure-module code; do not lower thresholds, widen exclusions, or skip failing tests. Text coverage prints to the console; HTML and a JSON summary are written under `coverage/`. Coverage is reported on test failure too.

Every test run also writes `reports/test-results.json`. GitHub Actions adds failure annotations and `reports/junit.xml`. `npm run test:durations` reads the JSON and prints total time, file durations, and the ten slowest tests. Tests over 1 second or a suite over 10 seconds generate warnings rather than failures; Vitest itself highlights tests slower than 1 second.

CI adds the duration table to its job summary and uploads `coverage/` and `reports/` as `test-reports` between coverage and the production build. Both reporting steps use a not-cancelled condition, so they can run after a preceding failure. The geometry grid scan visits every integer point in the circles' bounding square; keep new tests fast, and explain any intentionally slow test. See [Debugging](debugging.md) for missing reports or coverage failures.

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
- [ ] Relevant Explore pills can be focused and activated from the keyboard; check visible focus.
- [ ] Check at least one Chromium browser and one of Firefox or Safari for page changes.

### After deploy

- [ ] https://franklinp44.github.io/ikigai/ loads with styles and scripts (no 404s for files under `assets/` in the Network tab).

## Browser tests

Interaction is still checked by hand; no browser test runner is installed. The 100% threshold describes the pure modules, not browser or accessibility coverage. See [Cleanup opportunities](../cleanup-opportunities.md).

## Key source files

`src/data.test.ts`, `src/geometry.test.ts`, `src/index-html.test.ts`, `vitest.config.ts`, `.oxlintrc.json`, `scripts/report-test-durations.mjs`, and `.github/workflows/deploy-pages.yml`.
