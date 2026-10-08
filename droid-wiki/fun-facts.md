# Fun facts

A few things worth knowing about this small codebase.

## The name is three characters

生き甲斐 appears twice on the page: above the title (`.kanji` in `index.html`) and under "IKIGAI" in the center of the diagram. The characters roughly mean "life" (生き, iki) and "worth" or "value" (甲斐, gai).

## The diagram isn't originally Japanese

The footnote in `index.html` is upfront about it. The four-circle chart is a Western adaptation: Marc Winn relabeled Andrés Zuzunaga's purpose Venn diagram as "ikigai" in 2014. The app teaches the popular model and corrects the record in the same view.

## Two overlaps that never get a name

Four circles could form 15 combinations, but the app defines only 13 zones. The top and bottom circles do overlap, and so do the left and right ones, yet neither pair ever forms a region of its own, because every point they share is also inside a neighboring circle. The `ZoneKey` type in `src/data.ts` simply leaves `LP` and `GN` out. The details are in [Zone keys](primitives/zone-keys.md).

## The publishing script outweighs the app

`.github/scripts/publish_confluence.py`, which copies this wiki to Confluence, is 535 lines. The entire app (`index.html` plus everything in `src/`) is 465. Two `devDependencies` (`typescript` and `vite`) also pull 61 packages into `package-lock.json`, 46 of them platform-specific binaries. Nothing from npm ships to the browser.

## 39 tiny stories

Each of the 13 zones has exactly three examples in `src/data.ts`, so there are 39 short descriptions of people. They range from "A home baker whose bread friends rave about" (Passion) to "A talented developer shipping yet another ad-tech feature" (Satisfaction, but uselessness).
