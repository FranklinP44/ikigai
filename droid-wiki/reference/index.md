# Reference

Lookup tables for the settings, data shapes, and dependencies the app uses.

- [Configuration](configuration.md): npm scripts, TypeScript/Vite settings, fixed browser-runner settings in `playwright.config.ts`, Vitest/Oxlint/Oxfmt and hooks, QA targets, provisioned browser paths and evidence constraints, tool-only environment variables, ignores, workflow settings, and runtime design constants.
- [Data models](data-models.md): the types and constants in `src/data.ts` (`CircleKey`, `ZoneKey`, `Circle`, `Zone`, `CIRCLE`, `ZONES`, `EXAMPLES`, `ORDER`, `ZONE_KEYS`) and the geometry in `src/geometry.ts`.
- [Dependencies](dependencies.md): all nine npm dev dependencies and their lockfile versions, including `@playwright/test`, pinned agent-browser and managed Chrome for QA, external resources, GitHub Actions, Python packages, browser features, and Dependabot policy from `.github/dependabot.yml`.

For how the build and automation fit together, see [Deployment](../deployment.md), [Wiki refresh](../features/wiki-refresh.md), and [Functional QA](../features/functional-qa.md). [Trust boundaries](../security.md) distinguishes public browser assets from privileged tooling.
