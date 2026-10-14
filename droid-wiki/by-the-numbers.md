# By the numbers

Collected on 2026-10-14 from commit `ee0906ddca3a9a53907c9c26c1670001ebc7dfe1` on `main`. For the story behind the changes, see [Lore](lore.md).

## Size

Counts enumerate `git ls-tree -r --name-only` at the snapshot and read each blob with `git show <commit>:<path>`, excluding `droid-wiki/` and `package-lock.json`. No generated outputs are tracked. Working-tree edits, concurrent wiki updates and untracked output do not enter the measurements. **Lines are physical lines, including blank lines and comments**, counted with Python `bytes.splitlines()`, not statements or nonblank code. Bytes are uncompressed file bytes. App-only means `index.html`, `src/data.ts`, `src/geometry.ts`, `src/main.ts`, and `src/styles.css`; adjacent tests do not ship.

| Metric | Value |
| --- | --- |
| Scoped files | 43 |
| Source files | 8: 5 app, 3 automation |
| Test files | 3 |
| Config/support files | 26 (includes workflows, issue forms, hook, manifests, ignore/env files and QA YAML/settings) |
| Documentation files | 3: `AGENTS.md`, `README.md`, `.github/pull_request_template.md` |
| QA skill instruction/template files | 3: `.factory/skills/qa/SKILL.md`, `.factory/skills/qa-web/SKILL.md`, `.factory/skills/qa/REPORT-TEMPLATE.md` |
| Total physical lines | 3,831 |
| Total bytes | 165,197 |
| App-only source | 5 files, 805 lines, 21,977 bytes |
| Automation source | 3 files, 761 lines, 34,124 bytes (`.github/scripts/publish_confluence.py` and `scripts/*.mjs`) |
| Tests | 273 lines, 10,352 bytes; 93 expanded cases across 3 test files |
| Config/support | 1,336 lines, 46,778 bytes |
| Documentation | 251 lines, 20,582 bytes |
| QA skill instructions/templates | 405 lines, 31,384 bytes; developer automation instructions, not shipped app source |
| Runtime dependencies | 0 npm packages, 1 external font stylesheet |
| Dev dependencies | 8 direct in `package.json`; 179 non-root package entries in `package-lock.json` |

The roles above are mutually exclusive. Config/support includes the tracked `.factory/skills/qa/.install-progress.yaml`; skill Markdown is counted separately from general documentation. The lockfile entry count is separate from the size scope and includes platform-specific/optional packages, not just packages installed on one machine. Test counts include expanded `it.each` cases; coverage thresholds are 100% for the two pure runtime modules, not the DOM controller. See [Testing](how-to-contribute/testing.md) and [Functional QA](features/functional-qa.md).

```mermaid
xychart-beta horizontal
    title "Physical lines by language (scoped files)"
    x-axis [YAML, TypeScript, Markdown, Python, CSS, JavaScript, JSON, Other, HTML]
    y-axis "Physical lines" 0 --> 1100
    bar [1013, 672, 656, 535, 349, 226, 152, 115, 113]
```

| Language | Files | Physical lines |
| --- | --- | --- |
| YAML | 13 | 1,013 |
| TypeScript | 8 | 672 |
| Markdown | 6 | 656 |
| Python | 1 | 535 |
| CSS | 1 | 349 |
| JavaScript (`.mjs`) | 2 | 226 |
| JSON | 6 | 152 |
| Other | 5 | 115 |
| HTML | 1 | 113 |
| **Total** | **43** | **3,831** |

Languages are classified by extension (`.yml` and `.yaml` together). “Other” comprises `.env.example`, `.github/CODEOWNERS`, `.github/scripts/requirements.txt`, `.gitignore`, and `.husky/pre-commit`. TypeScript includes 343 app lines, 273 test lines and 56 build/test-config lines.

| File | Language | Lines | Bytes |
| --- | --- | --- | --- |
| `.github/scripts/publish_confluence.py` | Python | 535 | 25,330 |
| `src/styles.css` | CSS | 349 | 6,191 |
| `src/main.ts` | TypeScript | 141 | 4,624 |
| `index.html` | HTML | 113 | 4,751 |
| `.github/workflows/publish-wiki-to-confluence.yml` | YAML | 101 | 3,724 |
| `src/data.ts` | TypeScript | 186 | 5,958 |
| `scripts/check-agents-md.mjs` | JavaScript | 148 | 5,673 |
| `.github/workflows/droid-wiki-refresh.yml` | YAML | 140 | 6,274 |
| `.github/workflows/qa.yml` | YAML | 200 | 9,453 |
| `.factory/skills/qa/SKILL.md` | Markdown | 185 | 14,332 |
| `.factory/skills/qa-web/SKILL.md` | Markdown | 198 | 16,644 |
| `.github/workflows/deploy-pages.yml` | YAML | 67 | 1,299 |
| `src/geometry.ts` | TypeScript | 16 | 453 |
| `vite.config.ts` | TypeScript | 7 | 193 |

App source grew from 404 physical lines at the initial commit to 465 after the TypeScript migration, then 800 after formatting and 805 after the Explore-pill focus-ring fix. Since `ceb6e4e`, scoped size increased by 7 files, 774 lines and 46,867 bytes. Functional QA added developer instructions, configuration and a workflow outside the app. Relative to the previous snapshot at `120cd5f`, the only scoped change is 5 added lines and 187 bytes in `src/styles.css` for the keyboard focus outline; file counts, tests, dependencies and content are unchanged.

## Directory averages

Files belong to their immediate parent directory; rows are not recursive. Averages are physical lines per file, rounded to two decimals.

| Directory | Files | Lines | Average lines |
| --- | --- | --- | --- |
| Repository root | 11 | 608 | 55.27 |
| `.factory/` | 1 | 13 | 13.00 |
| `.factory/skills/qa/` | 4 | 347 | 86.75 |
| `.factory/skills/qa-web/` | 1 | 198 | 198.00 |
| `.github/` | 3 | 139 | 46.33 |
| `.github/ISSUE_TEMPLATE/` | 4 | 207 | 51.75 |
| `.github/scripts/` | 3 | 538 | 179.33 |
| `.github/workflows/` | 6 | 586 | 97.67 |
| `.husky/` | 1 | 4 | 4.00 |
| `scripts/` | 2 | 226 | 113.00 |
| `src/` | 7 | 965 | 137.86 |
| **All scoped files** | **43** | **3,831** | **89.09** |

## Content

| Metric | Value |
| --- | --- |
| Circles | 4 |
| Zones (regions) | 13 |
| Example strings | 39 (3 per zone) |
| Explore buttons | 5 |
| Named runtime functions in `src/` | 9 (`byId`, `el`, `region`, `toSvg`, `zoneForEvent`, `render`, `setZone` in `src/main.ts`; `zoneAt` in `src/geometry.ts`; `isZoneKey` in `src/data.ts`) |
| Exported types | 4 (`CircleKey`, `ZoneKey`, `Circle`, `Zone`) |
| SVG masks generated at load | 18 (4 inclusion, 14 exclusion) |
| CSS custom properties | 10 |
| Media query breakpoints | 2 (900 px, 600 px) |

## Activity

| Metric | Value |
| --- | --- |
| Commits reachable from the `main` snapshot | 34 (20 non-merges, 14 merges) |
| Pull requests merged | 14 (merge commits; PR numbers #1–#4, #6–#14 and #16) |
| First commit | 2026-09-25 |
| Most recent commit | 2026-10-14 |
| 90-day window | 2026-07-17 through 2026-10-14 inclusive |
| Scoped paths touched in that window | 45 (43 current files and 2 deleted predecessors) |
| 90-day additions / deletions | 4,379 / 548; total churn 4,927 lines |

Activity uses each commit's author-calendar date (its recorded timezone), includes merges, and counts every reachable commit once. Weekly buckets start Monday; September and October are partial months.

| Week starting | Commits |
| --- | --- |
| 2026-09-21 | 1 |
| 2026-09-28 | 2 |
| 2026-10-05 | 9 |
| 2026-10-12 | 22 |
| **Total** | **34** |

| Month | Commits |
| --- | --- |
| 2026-09 | 1 |
| 2026-10 (through 14 Oct) | 33 |

The two 2026-10-01 commits have committer dates of 2026-10-08 after rebasing. Churn uses the same author-date window but **non-merge commits only**, summing `git show --numstat --no-renames` additions and deletions for commits returned by `git rev-list` of the snapshot. This avoids merge double-counting and treats migration moves as deletion/addition; it includes historically tracked root JavaScript/CSS files, but excludes the wiki and lockfile throughout. It is not net growth or a behavioral-change measure. The table lists the ten paths with the largest additions-plus-deletions in that window.

| Path | Additions | Deletions | Touching non-merge commits |
| --- | --- | --- | --- |
| `.github/scripts/publish_confluence.py` | 535 | 0 | 1 |
| `src/styles.css` | 420 | 71 | 3 |
| [script.js](https://github.com/FranklinP44/ikigai/blob/07f52b9/script.js) (removed predecessor) | 150 | 150 | 2 |
| `index.html` | 206 | 93 | 3 |
| [styles.css](https://github.com/FranklinP44/ikigai/blob/07f52b9/styles.css) (removed predecessor) | 144 | 144 | 2 |
| `src/data.ts` | 227 | 41 | 2 |
| `.github/workflows/qa.yml` | 200 | 0 | 1 |
| `.factory/skills/qa-web/SKILL.md` | 198 | 0 | 1 |
| `.factory/skills/qa/SKILL.md` | 185 | 0 | 1 |
| `src/main.ts` | 155 | 14 | 2 |

The short history, initial additions, moves and one-time formatting dominate these figures; they do not establish long-term maintenance hotspots.

## Bot-attributed commits

| Metric | Value |
| --- | --- |
| Non-merge commits with a bot author or co-author | 10 of 20 (50.00%) |
| Factory Droid attribution | 8 of 20 (40.00%) |
| Dependabot attribution | 2 of 20 (10.00%) |
| Bot accounts seen | `factory-droid[bot]`, `dependabot[bot]` |

Scope is all non-merge history reachable from the `main` snapshot. Match `[bot]` in the author identity or `Co-authored-by:` identities, and deduplicate by commit even if both match. No merge commits or individual contributor rankings enter the calculation. **Bot attribution is not an AI percentage**: Dependabot is automation, not evidence of generative-AI authorship. The Factory-marked 40.00% is a lower bound on explicitly attributed AI-assisted commits, not on lines written or effort; other agent/assistant use can leave no trailer.

## Complexity

| Metric | Value |
| --- | --- |
| Average scoped file size | 89.09 physical lines; 3,841.79 bytes (43 files) |
| Average app file size | 161.00 physical lines; 4,395.40 bytes (5 files) |
| Largest file | `.github/scripts/publish_confluence.py` (535 lines, 34 functions) |
| Largest app file | `src/styles.css` (349 lines); largest runtime TypeScript file is `src/data.ts` (186 lines) |
| Longest function | `main()` in `.github/scripts/publish_confluence.py` (96 lines) |
| Deepest runtime import chain | 2 edges, 3 modules: `src/main.ts` → `src/geometry.ts` → `src/data.ts` |
| Runtime exported symbols | 13: 9 values/functions and 4 types/interfaces |

Python function counts use `ast.FunctionDef`/`ast.AsyncFunctionDef`; spans run from the definition through the final AST line, inclusive, including intervening comments and blanks. These are size and dependency-depth measures, not cyclomatic complexity.

Runtime exports are `ORDER`, `ZONE_KEYS`, `isZoneKey`, `CIRCLE`, `ZONES`, `EXAMPLES`, `CircleKey`, `ZoneKey`, `Circle`, and `Zone` from `src/data.ts`; `R`, `CENTERS`, and `zoneAt` from `src/geometry.ts`. `src/main.ts` exports nothing. Build/test configuration exports and test helpers are excluded from runtime complexity; the HTML module entry and CSS link are not extra TypeScript import edges. See [Architecture](overview/architecture.md).

For history behind these numbers, see [Lore](lore.md).
