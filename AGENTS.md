# AGENTS.md

Instructions for coding agents and contributors working in this repository.

## Project

A single-page, interactive four-circle Ikigai diagram. Plain HTML, CSS, and browser TypeScript with no runtime dependencies, bundled by Vite and deployed to GitHub Pages. See `README.md` for the file layout and `droid-wiki/` for deeper architecture notes.

## Setup and commands

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install           # install dependencies and the Husky pre-commit hook
npm run dev           # dev server at http://localhost:5173
npm run build         # type-check (tsc --noEmit), then build into dist/
npm run lint          # Oxlint; warnings fail the run
npm run lint:fix      # apply Oxlint autofixes
npm run format        # format files in place with Oxfmt
npm run format:check  # fail if any file is not formatted
npm run preview       # serve dist/ at http://localhost:4173
npm run check:agents-md  # fail if this file no longer matches the code
```

There is no automated test suite. Before finishing a change, run `npm run check:agents-md`, `npm run lint`, `npm run format:check`, and `npm run build`. CI (`.github/workflows/deploy-pages.yml`) runs the same four checks on every pull request.

## Keeping this file current

`scripts/check-agents-md.mjs` validates this file against the repository. It fails when:

- an `npm run` command here is missing from `package.json`, or a `package.json` script or CI `npm run` step is not documented here;
- a file path cited in inline code does not exist;
- an identifier, CSS name, attribute, or lint rule cited in inline code no longer appears in `src/`, `index.html`, or the config files.

When you rename, add, or remove something this file mentions, update this file in the same change. Do not weaken the checker to make it pass.

## Pre-commit hook

`.husky/pre-commit` runs `lint-staged` (Oxlint with autofix, then Oxfmt, on staged files; configured under `lint-staged` in `package.json`), then `tsc --noEmit`, then the AGENTS.md check. Fix the reported problems instead of bypassing the hook with `--no-verify`.

## Naming conventions

Oxlint enforces the mechanical parts of these rules (`unicorn/filename-case`, `id-match`, and `new-cap` in `.oxlintrc.json`). Follow the rest by matching the existing code.

| Kind                                    | Convention                                                        | Examples                                         |
| --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| Source and config files                 | kebab-case, lowercase                                             | `geometry.ts`, `vite.config.ts`                  |
| Functions and local variables           | camelCase, verb-first for functions                               | `zoneAt`, `setZone`, `zoneForEvent`, `swapTimer` |
| Type guards                             | `is` + type name                                                  | `isZoneKey`                                      |
| Module-level constant data and settings | SCREAMING_SNAKE_CASE                                              | `ORDER`, `ZONE_KEYS`, `CENTERS`, `R`             |
| DOM element references                  | camelCase; suffix `El` when the name would otherwise be ambiguous | `svg`, `zonesLayer`, `titleEl`, `chipsEl`        |
| Types, interfaces, and classes          | PascalCase; key unions end in `Key`                               | `ZoneKey`, `CircleKey`, `Zone`, `Attrs`          |
| Generic type parameters                 | single uppercase letter                                           | `T`, `K`                                         |
| Object keys for zones and circles       | the zone key letters in `L-G-N-P` order                           | `L`, `LG`, `LGNP`                                |
| HTML `id` attributes                    | camelCase                                                         | `centerFill`, `examples`                         |
| CSS classes and custom properties       | kebab-case                                                        | `.label-center-jp`, `--love`                     |
| `data-*` attributes                     | kebab-case name; zone keys as values                              | `data-zone="LG"`                                 |

Do not use snake_case identifiers, leading or trailing underscores, or `$` in names.

## Code conventions

- Keep content in `src/data.ts` and pure geometry in `src/geometry.ts`; only `src/main.ts` touches the DOM.
- Use the `ZoneKey` and `CircleKey` unions instead of `string`, and validate external strings with `isZoneKey()` instead of casting.
- Mark type-only imports with `type` (`verbatimModuleSyntax` is on).
- Look up elements with `byId(id, Type)` and create SVG nodes with `el(tag, attrs, parent)`.
- Change the selected zone only through `setZone()`.
- Never pass user input to `innerHTML`; it is used only for static content from `src/data.ts`.

More detail: `droid-wiki/how-to-contribute/patterns-and-conventions.md`.
