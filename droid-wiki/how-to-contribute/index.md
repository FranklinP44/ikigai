# How to contribute

Contributions use issue forms, a reviewed pull request, five repository checks, and browser verification for page changes.

Active contributors: FranklinP44

## Purpose

Start here to pick up work and understand the definition of done. Follow [Development workflow](development-workflow.md) for the editing loop and [Testing](testing.md) for verification.

## Picking up work

- Check existing issues and pull requests at https://github.com/FranklinP44/ikigai before starting.
- Use the forms in `.github/ISSUE_TEMPLATE/`: bug reports apply `bug`, feature requests apply `enhancement`, and accessibility reports apply `accessibility`. Blank issues are disabled.
- Include reproduction steps and environment details for bugs and accessibility barriers; describe the problem, proposal, and observable acceptance criteria for features.
- Copy changes in `src/data.ts` are a small starting point. Discuss larger interaction or layout changes in an issue first.

## Pull requests

1. Branch from `main`, make the change, and update adjacent tests and documentation.
2. Run the five checks below and the relevant browser checklist.
3. Use a conventional title such as `fix: clarify the Vocation description` or `docs: explain test reports`.
4. Keep the sections in `.github/pull_request_template.md`: summary with an issue link, type of change, changed areas, testing, review, and checklist. Include before/after screenshots for visual changes.
5. `.github/CODEOWNERS` assigns every path to @FranklinP44 and requests owner review. A more specific ownership rule belongs below the catch-all because the last matching rule wins.
6. To request Droid code and shallow security review, add `droid-review` to a non-draft PR. It does not run automatically on every PR; subsequent commits rerun review while the label remains. See [Tooling](tooling.md).
7. To request functional browser QA, add `qa` to a non-draft PR. `.github/workflows/qa.yml` tests the branch on local servers and updates one report comment. It needs the `FACTORY_API_KEY` repository secret and is not a required check. Docs-only and test-only changes do not run app flows. See [Functional QA](../features/functional-qa.md).

The QA report gate in `scripts/check-qa-report.mjs` fails on FAIL, BLOCKED, malformed reports, or unsuccessful processes. A tooling-only diff can receive the exact accepted INCONCLUSIVE row without testing the app. Do not count browser installation as application validation; request a separately authorized targeted QA run when validating QA tooling.

Normal PRs run the Pages validation workflow without deploying. `.github/workflows/e2e.yml` separately runs the fixed Playwright browser suite, except for wiki-only changes; it needs no label or Factory secret. Wiki-related PRs also run Confluence conversion in dry-run mode. The generated rolling wiki PR is an exception: its built-in GitHub token does not trigger these workflows, so review and validate it explicitly before merging. See [Wiki refresh](../features/wiki-refresh.md).

## Definition of done

Run from the repository root:

```sh
npm run check:agents-md
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

- Keep 100% coverage for the pure modules; do not weaken thresholds or skip failing tests.
- Before pushing page changes, install Chromium once with `npx playwright install chromium` and run `npm run test:e2e`, as directed by `AGENTS.md`. This is separate from the five checks and does not replace the [manual checklist](testing.md#manual-checklist).
- For page changes, check desktop hover/click, narrow-width tapping, Explore pills, relevant keyboard focus, and console errors. Verify all 13 zones and the layouts below 900 px and 600 px.
- Change circle geometry in both `index.html` and `src/geometry.ts`.
- Keep `AGENTS.md` aligned with cited commands, paths, and names; update `droid-wiki/` when documented behavior changes.
- Keep user input out of `innerHTML`; never commit secrets or `.env` files.
- Merge after review and passing applicable checks. A push to `main` builds and deploys the site; wiki publication is independent. See [Deployment](../deployment.md).

## Key source files

- `AGENTS.md`: contribution rules and required validation.
- `.github/ISSUE_TEMPLATE/`: structured intake forms.
- `.github/pull_request_template.md`: testing and review checklist.
- `.github/CODEOWNERS`: repository ownership.
- `.github/workflows/droid-review.yml`: label-gated review.
- `.github/workflows/qa.yml`, `.factory/skills/qa/config.yaml`: optional browser QA and target settings.
- `playwright.config.ts`, `e2e/diagram.spec.ts`, `.github/workflows/e2e.yml`: fixed browser suite and CI execution.

## In this section

- [Development workflow](development-workflow.md)
- [Testing](testing.md)
- [Debugging](debugging.md)
- [Patterns and conventions](patterns-and-conventions.md)
- [Tooling](tooling.md)
