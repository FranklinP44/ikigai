<!-- Title: use a conventional prefix, for example "fix: clarify the Vocation description" or "ci: cache the build". -->

## Summary

<!-- What does this change do, and why? Link the issue it resolves, for example "Closes #12". -->

## Type of change

- [ ] Bug fix
- [ ] New feature or behavior change
- [ ] Content change (zone or example copy in `src/data.ts`)
- [ ] Styling or layout
- [ ] Accessibility
- [ ] Tooling, CI, or dependencies
- [ ] Documentation only

## What changed

<!-- List the files or areas touched and anything a reviewer should look at first. -->

## How it was tested

The same five checks run in CI. Tick the ones you ran locally:

- [ ] `npm run check:agents-md`
- [ ] `npm run lint`
- [ ] `npm run format:check`
- [ ] `npm run test:coverage`
- [ ] `npm run build`

Manual checks (for changes to the page):

- [ ] Checked the page with `npm run dev` or `npm run preview`, with no console errors
- [ ] Hovered and clicked the affected regions on desktop
- [ ] Tapped the affected regions at a narrow (mobile) width
- [ ] Used the Explore pills and keyboard focus where relevant

<!-- Describe anything else you tested, or explain why a check was skipped. -->

## Screenshots

<!-- For visual changes, add before and after screenshots. Delete this section otherwise. -->

## Review

<!-- To request a Droid code and security review, add the droid-review label to this pull request. Reviews do not run without it. -->

## Checklist

- [ ] Circle geometry changes are made in both `index.html` and `src/geometry.ts`
- [ ] New code in `src/data.ts` or `src/geometry.ts` has tests, and coverage stays at 100%
- [ ] `AGENTS.md` is updated if a command, path, or name it cites was added, renamed, or removed
- [ ] `droid-wiki/` is updated if behavior it describes changed
- [ ] No user input reaches `innerHTML`, and no secrets or `.env` files are committed
