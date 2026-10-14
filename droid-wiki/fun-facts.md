# Fun facts

A few things worth knowing about this small codebase.

## Three kanji and one hiragana

生き甲斐 appears twice on the page: above the title (`.kanji` in `index.html`) and under "IKIGAI" in the center of the diagram. The characters roughly mean "life" (生き, iki) and "worth" or "value" (甲斐, gai).

## The diagram isn't originally Japanese

The footnote in `index.html` is upfront about it. The four-circle chart is a Western adaptation: Marc Winn relabeled Andrés Zuzunaga's purpose Venn diagram as "ikigai" in 2014. The app teaches the popular model and corrects the record in the same view.

## Two overlaps that never get a name

Four circles could form 15 combinations, but the app defines only 13 zones. The top and bottom circles do overlap, and so do the left and right ones, yet neither pair ever forms a region of its own, because every point they share is also inside a neighboring circle. The `ZoneKey` type in `src/data.ts` simply leaves `LP` and `GN` out. The details are in [Zone keys](primitives/zone-keys.md).

## A formatting growth spurt

`.github/scripts/publish_confluence.py`, which copies this wiki to Confluence, is still 535 physical lines. It once outweighed the 465-line TypeScript app; after the 12 Oct 2026 formatting pass, app source occupies 800 lines without new runtime behavior. That means `index.html`, `src/data.ts`, `src/geometry.ts`, `src/main.ts`, and `src/styles.css`, excluding the 273 lines of adjacent tests.

Counts include blanks and comments, not just executable code. Eight direct dev dependencies now correspond to 179 non-root entries in `package-lock.json`, including optional platform variants; there are still no npm runtime dependencies. See [By the numbers](by-the-numbers.md) for the full scope and snapshot.

## 39 tiny stories

Each of the 13 zones has exactly three examples in `src/data.ts`, so there are 39 short descriptions of people. They range from "A home baker whose bread friends rave about" (Passion) to "A talented developer shipping yet another ad-tech feature" (Satisfaction, but uselessness).
