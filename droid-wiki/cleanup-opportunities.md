# Cleanup opportunities

The codebase is small and clean, with no dead code and no TODO comments. These are small improvements that would make future changes safer.

| Opportunity | Where | Why it helps |
| --- | --- | --- |
| Generate the base circles and outlines from `C` and `R` | `index.html`, `script.js` | Removes the duplicated geometry described in [Pitfalls](background/pitfalls.md) |
| Replace `innerHTML` with DOM building in `render()` | `script.js` | Makes the panel safe if content ever comes from outside the file |
| Guard `EXAMPLES[key]` in `render()` | `script.js` | Avoids a crash if a zone is added without examples |
| Read the swap duration from CSS, or define it once | `script.js`, `styles.css` | Keeps the 140 ms timeout and 0.18 s transition in sync |
| Add keyboard access to all 13 zones | `index.html`, `script.js` | Today only five zones are keyboard reachable |
| Add a basic Playwright smoke test | new | Automates the manual checklist in [Testing](how-to-contribute/testing.md) |

## Not found

- Dead code: none. All six functions in `script.js` are used.
- TODO / FIXME / HACK comments: none.
- Outdated dependencies: none. The only external resource is the Google Fonts stylesheet, which is versionless. See [Dependencies](reference/dependencies.md).
