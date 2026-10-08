# Design decisions

These decisions come from reading the code, its comments, the README, and commit messages. Where the reasoning isn't written down, the explanation is marked as likely.

## SVG masks instead of clip-paths

Stated in `src/main.ts`: "Masks instead of clip-paths so region edges stay anti-aliased." Clip-paths produce hard pixel edges in most browsers. With 13 regions sharing curved borders, aliased edges would show visible seams. Masks blend at the edge, so adjacent highlights meet cleanly. The cost is more DOM (18 masks and nested groups), which is negligible at this size. Details are in [Region rendering](../systems/region-rendering.md).

## Geometric hit testing instead of DOM events

`zoneAt()` in `src/geometry.ts` computes the zone from the pointer's distance to each circle center rather than listening for events on each region's `<g>`. Masked groups all cover the full 800 × 800 canvas, so DOM hit testing on them would be unreliable: every overlay would claim every point. The math approach is a few lines, exact, and independent of render order. Since the migration it is a pure function with no DOM access, which keeps it separate from the event wiring in `src/main.ts`.

## One `pointermove` listener on the whole SVG

A single listener on `svg#ikigai` in `src/main.ts` drives hover. It also makes "outside the circles" a natural case (`zoneAt()` returns `null`, so the panel falls back to `pinned`). `setZone()` returns early when nothing changed, so running on every move is cheap.

## Hover previews, click pins

Hover lets visitors scan regions quickly, but on its own it would snap back to Ikigai whenever the pointer left. Pinning on click (and on pill press) lets someone pick a region and then move to the panel to read it. The default pin is `LGNP`, the center.

## Multiply blend for overlaps

The base circles use `mix-blend-mode: multiply` in `src/styles.css`, so overlap colors come from blending the circle colors rather than from extra shapes. The gold center is the one region painted explicitly, to make Ikigai stand out.

## No UI framework

The app is still hand-written DOM and SVG code with no runtime dependencies. `package.json` lists only `typescript` and `vite`, both as devDependencies, so the shipped bundle contains only the app's own code. A framework would likely add more code than the app itself has.

## TypeScript + Vite migration (October 2026)

The original version (commit `07f52b9`) was three static files, `index.html`, `script.js`, and `styles.css`, with no build step, served by GitHub Pages from the `main` branch root. Commit `34e4642` ("Port script.js to strict TypeScript modules (data, geometry, main)") replaced that, and PR #2 merged it on 2026-10-08.

- **1:1 port into three modules.** `script.js` was split by concern: content and types in `src/data.ts`, circle geometry and `zoneAt()` in `src/geometry.ts`, and DOM wiring in `src/main.ts`. Behavior was kept the same. The comment above `render()` in `src/main.ts` says markup strings are used so they "keep the DOM identical to the original page", which points to an exact port rather than a rewrite.
- **Strict compiler options.** `tsconfig.json` enables `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `isolatedModules`, and `verbatimModuleSyntax`, with `noEmit` because Vite does the transpiling. The commit message asks for "strict TypeScript" but does not explain why. Likely reason: with no tests or linter, `tsc --noEmit` (run by `npm run build` and in CI on every PR) is the only automated check, so a strict configuration gets the most out of it. Types such as `Record<ZoneKey, ...>` for `ZONES` and `EXAMPLES` now catch a zone missing its content at compile time.
- **devDependency-only toolchain.** Only `typescript` and `vite` are installed, and `package-lock.json` is committed so `npm ci` is reproducible. Commit `1cbff8c` sets `allowScripts: { fsevents: false }` in `package.json` to deny the optional `fsevents` install script, because "prebuilt binary ships with the package".
- **Relative Vite base.** `vite.config.ts` sets `base: './'`. Its comment gives the reason: relative asset URLs "so the build works when served from a subpath, such as GitHub Pages at /ikigai/". The default base `/` would point assets at the domain root.
- **Deploying via GitHub Actions.** Commit `8f8358f` added `.github/workflows/deploy-pages.yml`, which runs `npm ci` and `npm run build` on every push to `main`, pull request, and manual run, then uploads `dist/` and deploys it with `actions/deploy-pages` (not on PRs). Branch-root deployment no longer works because the source `index.html` loads `/src/main.ts`, which browsers cannot run without Vite. The commit message also notes the workflow "builds on every PR", so the type check gates changes before merge. See [Deployment](../deployment.md).

## Content framing

The footnote in `index.html` notes that the four-circle diagram is a modern Western adaptation, not a traditional Japanese concept. It likely exists to present the popular model accurately without overselling it.

## Related pages

- [Pitfalls](pitfalls.md)
- [Patterns and conventions](../how-to-contribute/patterns-and-conventions.md)
- [Deployment](../deployment.md)
