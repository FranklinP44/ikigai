# Cleanup opportunities

The codebase is small and clean, with no dead code and no TODO comments. The TypeScript migration (PR #2, 8 Oct 2026) resolved one earlier item: `EXAMPLES` is now typed `Record<ZoneKey, readonly string[]>` in `src/data.ts`, so the type checker refuses a zone without examples and `render()` no longer needs a runtime guard. These are the remaining small improvements that would make future changes safer.

| Opportunity | Where | Why it helps |
| --- | --- | --- |
| Generate the base circles and outlines from `CENTERS` and `R` | `index.html`, `src/geometry.ts` | Removes the duplicated geometry described in [Pitfalls](background/pitfalls.md). The eight `<circle>` elements in `index.html` still hard-code the same centers and radius |
| Replace `innerHTML` with DOM building in `render()` | `src/main.ts` | Makes the panel safe if content ever comes from outside `src/data.ts`. A comment in `render()` records that the current choice is deliberate |
| Read the swap duration from CSS, or define it once | `src/main.ts`, `src/styles.css` | Keeps the 140 ms timeout in `setZone()` and the `.18s` `.card .content` transition in sync |
| Add keyboard access to all 13 zones | `index.html`, `src/main.ts` | Today only the five Explore pills are keyboard reachable |
| Add a basic Playwright smoke test | new | Automates the manual checklist in [Testing](how-to-contribute/testing.md). Type checking is the only automated check today |
| Declare the Node version in `package.json` | `package.json` | `README.md` requires Node 20.19+ or 22.12+ (the range Vite and rolldown declare), but there is no `engines` field, so older Node versions fail with less clear errors |
| Use one Node version across workflows | `.github/workflows/publish-wiki-to-confluence.yml`, `.github/workflows/deploy-pages.yml` | The Pages workflow uses Node 22 and the Confluence workflow uses Node 20. Not a bug, just two versions to track |
| Pin `@mermaid-js/mermaid-cli` more tightly | `.github/workflows/publish-wiki-to-confluence.yml` | It is installed as `@mermaid-js/mermaid-cli@11`, so any 11.x release can change diagram rendering between runs. The Python dependencies, by contrast, are pinned exactly |

## Not found

- Dead code: none. All nine functions in `src/` are used, every export from `src/data.ts` and `src/geometry.ts` is imported, and `noUnusedLocals` / `noUnusedParameters` in `tsconfig.json` would flag unused locals.
- TODO / FIXME / HACK comments: none.
- Outdated dependencies (checked 2026-10-08): `typescript` 7.0.2 is the latest release. `vite` is locked at 8.3.2 and 8.3.3 is available, a patch release inside the `^8.3.2` range that `npm update` would pick up. Python's `markdown==3.11` and `requests==2.34.2` are the latest releases. See [Dependencies](reference/dependencies.md).
