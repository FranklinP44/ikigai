# How to contribute

The project is a solo static site written in TypeScript and built with Vite. There are no issue tracker conventions or automated tests yet. Contributing means editing files under `src/` or `index.html`, checking the result in the Vite dev server, and opening a pull request against `main`. CI type-checks and builds every pull request.

## Picking up work

- Check open issues and pull requests on GitHub at https://github.com/FranklinP44/ikigai.
- Small content fixes (copy in `ZONES` or `EXAMPLES` in `src/data.ts`) are the easiest place to start.
- For larger changes, such as new interactions or layout changes, open an issue first to agree on the approach.

## Pull request process

1. Branch from `main`.
2. Make the change, run `npm run build` locally, and run through the manual checklist in [Testing](testing.md).
3. Open a PR with a short description and, for visual changes, a screenshot or screen recording.
4. Wait for the checks:
   - **Build and deploy to GitHub Pages** (`.github/workflows/deploy-pages.yml`) runs `npm ci` and `npm run build` on every PR. On PRs it only builds; nothing is deployed.
   - **Publish wiki to Confluence** (`.github/workflows/publish-wiki-to-confluence.yml`) runs as a dry run when the PR touches `droid-wiki/**`, `.github/scripts/**`, or the workflow file itself. It converts pages and renders diagrams without writing to Confluence.
5. Merge once reviewed and green. Merging to `main` deploys the site automatically. See [Deployment](../deployment.md).

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) prefixes (`feat:`, `docs:`, `chore:`, `ci:`). Following that style keeps history readable.

## Definition of done

- `npm run build` passes locally and the CI build check is green.
- The page loads with no console errors in at least one Chromium browser and one of Firefox or Safari.
- All 13 zones are still reachable and render their panel content.
- The layout still works at desktop width, below 900 px, and below 600 px.
- If you changed behavior or structure, the matching page in this wiki is updated.

## In this section

- [Development workflow](development-workflow.md)
- [Testing](testing.md)
- [Debugging](debugging.md)
- [Patterns and conventions](patterns-and-conventions.md)
- [Tooling](tooling.md)
