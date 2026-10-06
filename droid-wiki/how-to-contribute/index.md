# How to contribute

The project is a solo static site with no issue tracker conventions, CI, or automated tests yet. Contributing means editing the three source files, checking the result in a browser, and opening a pull request against `main`.

## Picking up work

- Check open issues and pull requests on GitHub at https://github.com/FranklinP44/ikigai.
- Small content fixes (copy in `ZONES` or `EXAMPLES` in `script.js`) are the easiest place to start.
- For larger changes, such as new interactions or layout changes, open an issue first to agree on the approach.

## Pull request process

1. Branch from `main`.
2. Make the change and run through the manual checklist in [Testing](testing.md).
3. Open a PR with a short description and, for visual changes, a screenshot or screen recording.
4. Merge once reviewed.

The single existing commit uses a [Conventional Commits](https://www.conventionalcommits.org/) prefix (`feat:`). Following that style keeps history readable.

## Definition of done

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
