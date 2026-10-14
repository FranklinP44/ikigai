# Cleanup opportunities

These source-backed opportunities remain despite the contributor checks and unit tests. They are possible improvements, not verified vulnerabilities or a dependency-freshness audit. See [Pitfalls](background/pitfalls.md) for the behavior to preserve.

| Opportunity | Where | Why it helps |
| --- | --- | --- |
| Generate the base circles and outlines from `CENTERS` and `R` | `index.html`, `src/geometry.ts` | Removes eight hard-coded circle definitions. `src/index-html.test.ts` already checks that they match the geometry, so this reduces duplication rather than filling an untested invariant |
| Replace `innerHTML` with DOM building before accepting external content | `src/main.ts` | Current chip/example content is deliberately static from `src/data.ts`; `src/data.test.ts` rejects markup in examples. A future external source would need a new rendering boundary, not reliance on this static-data test |
| Read the swap duration from CSS, or define it once | `src/main.ts`, `src/styles.css` | Keeps the 140 ms timeout in `setZone()` and the `.18s` `.card .content` transition in sync |
| Add keyboard access to all 13 zones | `index.html`, `src/main.ts` | Today only the five Explore pills are keyboard reachable |
| Declare the Node version in `package.json` | `package.json` | `README.md` requires Node 20.19+ or 22.12+ (the range Vite and rolldown declare), but there is no `engines` field, so older Node versions fail with less clear errors |
| Use one Node version across workflows | `.github/workflows/publish-wiki-to-confluence.yml`, `.github/workflows/deploy-pages.yml` | The Pages workflow uses Node 22 and the Confluence workflow uses Node 20. Not a bug, just two versions to track |
| Pin `@mermaid-js/mermaid-cli` more tightly | `.github/workflows/publish-wiki-to-confluence.yml` | It is installed as `@mermaid-js/mermaid-cli@11`, so any 11.x release can change diagram rendering between runs. The Python dependencies, by contrast, are pinned exactly |

## Already guarded

- `src/data.ts` types zone content and examples as `Record<ZoneKey, ...>`. `src/data.test.ts` checks key-set equality, 13 unique canonical zone keys, overlay order, content and examples, and absence of example markup.
- `src/geometry.test.ts` checks boundaries, representative regions, and an integer-grid scan that reaches all known zones without unknown combinations.
- `src/index-html.test.ts` checks circle geometry, pair-label and white-dot placement, valid pill content, and the IDs looked up by the controller. These source-text checks do not validate runtime element types or browser behavior.
- `vitest.config.ts` requires 100% statement/branch/function/line coverage of the pure modules, not `src/main.ts`. `tsconfig.json` rejects unused locals/parameters, and lint/format/hook checks now exist.
- `.github/workflows/qa.yml` now runs optional, diff-targeted browser checks through `.factory/skills/qa/SKILL.md` and `.factory/skills/qa-web/SKILL.md`. This addresses the earlier browser-smoke-test gap, but is not a required merge check and does not run every flow on every diff. See [Functional QA](features/functional-qa.md) and [Testing](how-to-contribute/testing.md).

Dependency versions and automated-update policy are recorded in [Dependencies](reference/dependencies.md); no registry freshness check is asserted here.
