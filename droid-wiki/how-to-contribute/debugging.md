# Debugging

Use browser DevTools for runtime behavior and the local validation commands and Actions reports for contributor-tooling failures.

Active contributors: FranklinP44

## Purpose

This runbook separates browser issues from lint, instructions, test, and deployment failures. See [Testing](testing.md) for expected behavior and [Deployment](../deployment.md) for workflow details.

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

## Local check failures

| Failure | Next step |
| --- | --- |
| Oxlint errors or warnings | Run `npm run lint:fix`, inspect changes, and rerun `npm run lint`. Warnings also fail the check; remove temporary logging and debugger statements. |
| Formatting check | Run `npm run format`, inspect changes, then `npm run format:check`. `.oxfmtrc.json` excludes generated output and `droid-wiki/`. |
| Instructions out of date | Read the command/path/name diagnostic from `scripts/check-agents-md.mjs`. Update `AGENTS.md` with the matching source change rather than weakening the checker. |
| Pre-commit blocked | Check the first failing stage: lint-staged autofix/format, type check, instructions check, or tests. Inspect staged edits before retrying; do not bypass the hook. |
| Order-dependent test | Reproduce with `npx vitest run --sequence.seed=<seed>` from the failed run. Keep isolated files independent of shared state and ordering. |
| DOM-related test import error | Do not import `src/main.ts` into Node tests. Use raw text as in `src/index-html.test.ts`. |
| Coverage below 100% | Inspect `coverage/` and add missing cases in adjacent tests for `src/data.ts` or `src/geometry.ts`; keep thresholds and exclusions intact. |
| No duration report | Run `npm run test` or `npm run test:coverage` first to create `reports/test-results.json`, then `npm run test:durations`. |

Timing warnings flag tests over 1 second or a suite over 10 seconds, but do not fail CI. The geometry grid scan is intentionally broader than a few example points; compare the slowest-test table before assuming a regression.

## CI and deploy failures

Open the failed run under the Actions tab at https://github.com/FranklinP44/ikigai/actions, or from the terminal:

```bash
gh run list -R FranklinP44/ikigai --limit 10
gh run view <run-id> -R FranklinP44/ikigai --log-failed
```

- In **Build and deploy to GitHub Pages**, find the first failing gate: instructions, lint, format, coverage, or build. Reproduce that command locally. CI uses Node 22 and `npm ci`.
- Inspect the job's test-duration summary and download `test-reports` for JSON/JUnit and HTML coverage. Duration reporting and artifact upload run when not cancelled, including after earlier failures, but an early failure may leave no reports.
- A failure in the `deploy` job usually points to the Pages setup (the Pages source must be "GitHub Actions"). See [Deployment](../deployment.md).
- **Publish wiki to Confluence** fails early with "Missing Confluence configuration" when a required variable or secret is unset on a real publish, and uploads whatever it converted as a `confluence-preview` artifact, even when a step fails.
- A wiki-refresh video guard failure means `droid-wiki/video` exists despite disabled video generation. A rolling-PR push failure is reported as a warning: generation and Factory upload may already have succeeded. Check Actions permission to create PRs and branch rules; see [Wiki refresh](../features/wiki-refresh.md).
- The generated rolling wiki PR does not run CI or Confluence dry runs automatically because it uses the built-in GitHub token. A lack of checks is not evidence that validation passed.

## Logging

The app writes nothing to the console. Add temporary `console.log` calls in the `pointermove` handler in `src/main.ts` to trace coordinates and keys, and remove them before committing.

## Functional QA failures

`.factory/skills/qa-web/SKILL.md` records browser-testing failure modes. Servers start with `--strictPort`; a conflict on 5173 or 4173 in CI is BLOCKED, not a reason to test production. Stop Vite children as well as their npm wrappers. Wait until `#content` loses `swap` before reading new panel text, and wait about two seconds for circle labels before a load screenshot.

Hover is coordinate-based. Move the real pointer to a point transformed through the SVG screen matrix; dispatching synthetic events on a zone group does not test the intended interaction. Moving outside the circles but still inside the SVG is not `pointerleave`. Use a visible heading or the panel title to leave the diagram.

The workflow in `.github/workflows/qa.yml` checks for `FACTORY_API_KEY` before running Droid. Fork PRs do not receive repository secrets. Inspect the `qa-results` artifact and `qa-output.txt` when no report is produced; successful runs write `qa-results/report.md` and update the PR comment. A failed agent step, a missing report, or a table row marked FAIL makes the job fail. BLOCKED and INCONCLUSIVE rows alone do not, so read the report rather than relying only on the job status.

With the defaults in `.factory/skills/qa/config.yaml`, video and Compose are off. Screenshots remain downloadable artifacts; text snapshots are the inline evidence. Google Fonts network failures and the browser's unsolicited favicon 404 are known environment noise, unlike errors in the page's own code. See [Functional QA](../features/functional-qa.md).

## Key source files

`src/main.ts`, `src/geometry.ts`, `vite.config.ts`, `vitest.config.ts`, `.husky/pre-commit`, `scripts/check-agents-md.mjs`, `scripts/report-test-durations.mjs`, and `.github/workflows/deploy-pages.yml`.

Browser QA: `.factory/skills/qa/SKILL.md`, `.factory/skills/qa-web/SKILL.md`, `.factory/skills/qa/config.yaml`, and `.github/workflows/qa.yml`.
