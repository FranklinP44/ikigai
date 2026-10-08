# Glossary

Terms used in the code and in this wiki. Code identifiers point to the file where they are defined.

| Term | Meaning |
| --- | --- |
| Ikigai (生き甲斐) | Japanese for "a reason for being". In this app, the four-way overlap at the center of the diagram. |
| Circle | One of the four sets in the model. Each has a one-letter code, typed as `CircleKey` in `src/data.ts`. |
| `L` | "What you love". Top circle, centered at (400, 270). |
| `G` | "What you're good at". Left circle, centered at (270, 400). |
| `N` | "What the world needs". Right circle, centered at (530, 400). |
| `P` | "What you can be paid for". Bottom circle, centered at (400, 530). |
| `R`, `CENTERS` | Circle radius (200) and circle centers, exported from `src/geometry.ts`. |
| Zone | One of the 13 distinct regions formed by the circles. Content is in the `ZONES` record in `src/data.ts`. |
| Zone key | The string of circle letters a zone sits inside, always in `L-G-N-P` order, for example `LG` or `LGNP`. Typed as the `ZoneKey` union in `src/data.ts`. See [Zone keys](../primitives/zone-keys.md). |
| `ORDER` | The array `["L", "G", "N", "P"]` in `src/data.ts`. Fixes the letter order for zone keys and iteration. |
| `ZONE_KEYS` | All 13 zone keys in `src/data.ts`, in the order the overlays are created. |
| `isZoneKey()` | Type guard in `src/data.ts` that checks a string against `ZONE_KEYS` and narrows it to `ZoneKey`. Used by `zoneAt()` and the pill click handlers. |
| Passion | `LG`: love + good at. |
| Mission | `LN`: love + world needs. |
| Profession | `GP`: good at + paid for. |
| Vocation | `NP`: world needs + paid for. |
| Three-circle overlap | Zones `LGN`, `LNP`, `GNP`, `LGP`. Each is marked by a white dot in the diagram. |
| Region | A masked SVG group for one zone, built by `region()` in `src/main.ts`. |
| Overlay | The translucent white region in `#zones` that shows on the active zone. |
| Center fill | The gold-gradient region drawn into `#centerFill` for `LGNP`. |
| Detail panel | The card beside the diagram that shows the current zone's content. |
| Eyebrow | The small uppercase label above the panel title, such as "Two circles overlap". |
| Chip | One of four pills in the panel showing which circles the current zone belongs to. Chips for circles outside the zone get the `off` class. |
| Pill | An Explore button below the panel (`.pill` in `index.html`). Each has a `data-zone` attribute. |
| Active zone | The zone currently shown. Stored in the `current` variable in `src/main.ts`. |
| Pinned zone | The zone the panel returns to when the pointer leaves the diagram. Stored in `pinned` in `src/main.ts`, defaults to `LGNP`, and changes on click or pill press. |
| Swap | The short fade-out and fade-in of the panel when the zone changes, driven by the `.swap` class and a 140 ms timer (`swapTimer`). |
| Inclusion mask (`in-L`, ...) | An SVG mask that is white inside one circle. Used to intersect circles. |
| Exclusion mask (`out-0`, ...) | An SVG mask that is black inside every circle not in a zone. Used to cut those circles away. |
| User space | SVG coordinate system defined by `viewBox="40 40 720 720"`. `toSvg()` in `src/main.ts` converts pointer positions into it. |
| `byId()` | Typed DOM lookup in `src/main.ts`. Returns the element as the requested class or throws `Missing #id`. |
| Vite | The dev server and bundler. `npm run dev` serves the source; `npm run build` bundles it into `dist/`. |
| `dist/` | Vite's build output (ignored by Git). This folder is what GitHub Pages serves. |
| Base path | Vite's `base` option. Set to `'./'` in `vite.config.ts` so built asset URLs are relative and work under `/ikigai/`. |
| Pages artifact | The `dist/` folder uploaded by `actions/upload-pages-artifact` in `.github/workflows/deploy-pages.yml` and then published by `actions/deploy-pages`. See [Deployment](../deployment.md). |
| Dry run | The pull request mode of the Confluence publishing workflow, which renders the wiki without publishing it. See [Deployment](../deployment.md). |
