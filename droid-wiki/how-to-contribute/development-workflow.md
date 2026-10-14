# Development workflow

Edit with Vite, verify pure logic with Vitest, then run all five repository checks before requesting review.

Active contributors: FranklinP44

## Purpose

This is the local edit-to-PR loop. See [How to contribute](index.md) for issue forms, ownership, and the PR checklist.

## Set up and edit

Use Node.js 20.19+ or 22.12+ and npm. The app and npm commands need no environment variables.

```sh
npm install
git switch -c fix/zone-copy
npm run dev
```

Installation runs the Husky setup through the npm prepare lifecycle. CI uses `npm ci` with `package-lock.json`. The dev server is http://localhost:5173 and reloads on saves.

| Change | Source |
| --- | --- |
| Circle names, zone copy, examples | `src/data.ts` |
| Circle centers, radius, hit testing | `src/geometry.ts` |
| Masks, overlays, event handling, panel | `src/main.ts` |
| Layout, colors, transitions | `src/styles.css` |
| Labels, pills, base SVG | `index.html` |

Use `npm run test:watch` while editing pure logic. Keep DevTools open when checking the page. Geometry is also encoded in `index.html`; update both representations together. See [Pitfalls](../background/pitfalls.md).

## Validate

```sh
npm run check:agents-md
npm run lint
npm run format:check
npm run test:coverage
npm run build
npm run preview
```

The build type-checks with `tsc --noEmit` before Vite writes `dist/`. Preview serves the production bundle at http://localhost:4173; opening `dist/index.html` from disk is unsupported. Run the [manual browser checklist](testing.md#manual-checklist), including narrow layouts and touch behavior when relevant.

Use `npm run lint:fix` and `npm run format` to repair lint/format findings, then inspect the diff and rerun checks. TypeScript rejects unused locals and parameters. Update `AGENTS.md` when a cited command, path, or name changes rather than weakening its checker.

## Commit and review

Stage the intended files and commit with a conventional prefix. `.husky/pre-commit` runs, in order:

1. `lint-staged`: staged JavaScript/TypeScript receives Oxlint autofixes and Oxfmt; configured JSON, CSS, HTML, Markdown, and YAML patterns receive Oxfmt, subject to its ignore rules.
2. `tsc --noEmit` over the project.
3. `scripts/check-agents-md.mjs`.
4. `vitest run`, without coverage.

Inspect automatic edits and fix failures rather than bypassing the hook. The hook is not a replacement for the full five checks: it does not run coverage or a Vite production build.

Open a PR to `main` using `.github/pull_request_template.md`. Owner review comes from `.github/CODEOWNERS`. Add `droid-review` for optional Droid code and security review on a non-draft PR; without that label, auto review is skipped.

For optional browser QA, add `qa` to a non-draft PR. `.github/workflows/qa.yml` reruns when new commits arrive while the label remains, and updates a single report comment. It runs only the relevant flows selected by `.factory/skills/qa/SKILL.md`, not all browser flows or the static checks. Locally, ask Droid to run the `qa` skill against http://localhost:5173; it includes uncommitted changes when selecting flows. Never use the production site to verify branch code. See [Functional QA](../features/functional-qa.md).

Normal PR CI runs the same five gates, with duration reporting and report upload between coverage and build. After merging, Pages deploys. The rolling `factory/droid-wiki` PR is created with the built-in GitHub token, so it does not automatically run CI or the Confluence dry run; review and validate its diff explicitly. See [Wiki refresh](../features/wiki-refresh.md) and [Deployment](../deployment.md).

## Key source files

- `README.md`, `AGENTS.md`: supported environment and contribution rules.
- `package.json`, `.husky/pre-commit`: scripts and staged-file checks.
- `.github/pull_request_template.md`, `.github/workflows/droid-review.yml`: review process.
- `.github/workflows/deploy-pages.yml`: CI gates and deployment.
- `.github/workflows/qa.yml`, `.factory/skills/qa/SKILL.md`: optional diff-targeted browser verification.
