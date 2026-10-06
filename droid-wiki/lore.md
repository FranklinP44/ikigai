# Lore

The repository is young. Its whole recorded history is one commit, so this page is short and will grow as the project does.

## Eras

### The first drop (Sep 2026)

On 25 Sep 2026, the complete app landed in a single commit, "feat: add interactive four-circle Ikigai diagram" (`07f52b9`). It added `index.html`, `script.js`, and `styles.css` together, 404 lines in total. The commit carries a `Co-authored-by: factory-droid[bot]` trailer, so it was built with help from Factory's Droid agent.

There is no earlier prototype in the history. The polish already present in that first commit (staggered entrance animations, anti-aliased mask regions, a phone breakpoint, and an `aria-live` panel) suggests the design was iterated on before it was committed.

## Longest-standing features

Everything dates from Sep 2026. The pieces most likely to survive future changes are the ones the rest of the code depends on:

| Feature | Introduced | Notes |
| --- | --- | --- |
| [Zone keys](primitives/zone-keys.md) | Sep 2026 | Every data object and DOM attribute depends on them |
| [Region rendering](systems/region-rendering.md) with masks | Sep 2026 | The core trick that makes per-region highlighting possible |
| The four-circle content in `ZONES` and `EXAMPLES` | Sep 2026 | All 13 zones written up front |

## Deprecated features

None yet.

## Major rewrites

None yet.

## Growth trajectory

| Date | Files | Lines | Event |
| --- | --- | --- | --- |
| Sep 2026 | 3 | 404 | Initial commit |
| Oct 2026 | 3 (+ wiki) | 404 | This wiki added under `droid-wiki/` |

## Origins of the model itself

The app's own footnote in `index.html` records the backstory of the diagram it draws: Andrés Zuzunaga created a purpose Venn diagram, and in 2014 Marc Winn relabeled it as "ikigai". In Japan, ikigai more broadly means whatever makes life feel worth living. More trivia is in [Fun facts](fun-facts.md).
