# Glossary

Terms used in the code and in this wiki. Code identifiers point to the file where they are defined.

| Term | Meaning |
| --- | --- |
| Ikigai (生き甲斐) | Japanese for "a reason for being". In this app, the four-way overlap at the center of the diagram. |
| Circle | One of the four sets in the model. Each has a one-letter code. |
| `L` | "What you love". Top circle, centered at (400, 270). |
| `G` | "What you're good at". Left circle, centered at (270, 400). |
| `N` | "What the world needs". Right circle, centered at (530, 400). |
| `P` | "What you can be paid for". Bottom circle, centered at (400, 530). |
| Zone | One of the 13 distinct regions formed by the circles. Defined in the `ZONES` object in `script.js`. |
| Zone key | The string of circle letters a zone sits inside, always in `L-G-N-P` order, for example `LG` or `LGNP`. See [Zone keys](../primitives/zone-keys.md). |
| `ORDER` | The constant `"LGNP"` in `script.js`. Fixes the letter order for zone keys and iteration. |
| Passion | `LG`: love + good at. |
| Mission | `LN`: love + world needs. |
| Profession | `GP`: good at + paid for. |
| Vocation | `NP`: world needs + paid for. |
| Three-circle overlap | Zones `LGN`, `LNP`, `GNP`, `LGP`. Each is marked by a white dot in the diagram. |
| Eyebrow | The small uppercase label above the panel title, such as "Two circles overlap". |
| Chip | One of four pills in the panel showing which circles the current zone belongs to. Chips for circles outside the zone get the `off` class. |
| Pill | An Explore button below the panel (`.pill` in `index.html`). Each has a `data-zone` attribute. |
| Active zone | The zone currently shown. Stored in the `current` variable in `script.js`. |
| Pinned zone | The zone the panel returns to when the pointer leaves the diagram. Stored in `pinned`, defaults to `LGNP`, and changes on click or pill press. |
| Swap | The short fade-out and fade-in of the panel when the zone changes, driven by the `.swap` class. |
| Inclusion mask (`in-L`, ...) | An SVG mask that is white inside one circle. Used to intersect circles. |
| Exclusion mask (`out-0`, ...) | An SVG mask that is black inside every circle not in a zone. Used to cut those circles away. |
| User space | SVG coordinate system defined by `viewBox="40 40 720 720"`. `toSvg()` converts pointer positions into it. |
