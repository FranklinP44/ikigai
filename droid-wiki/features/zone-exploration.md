# Zone exploration

Active contributors: Franklin Pfaller

## Purpose

Zone exploration is the core interaction. As the visitor moves the pointer across the diagram, the region under it lights up and the [Detail panel](detail-panel.md) updates. Clicking a region, or pressing one of the Explore buttons, pins that region so it stays selected after the pointer leaves.

## Directory layout

```text
ikigai/
├── index.html          # svg#ikigai and the five .pill buttons
└── src/
    ├── data.ts         # ZoneKey type, ORDER, ZONE_KEYS, isZoneKey()
    ├── geometry.ts     # R, CENTERS, zoneAt()
    ├── main.ts         # toSvg(), zoneForEvent(), setZone(), event listeners
    └── styles.css      # .zone / .zone.active, .pill.active, svg.hovering
```

## Key abstractions

| Name | File | Description |
| --- | --- | --- |
| `zoneAt(x, y)` | `src/geometry.ts` | Returns the `ZoneKey` for a point in SVG user space, or `null` if the point is outside every circle |
| `toSvg(e)` | `src/main.ts` | Converts a pointer event's `clientX`/`clientY` into SVG user-space coordinates using `getScreenCTM().inverse()`; returns `null` if the SVG has no screen CTM |
| `zoneForEvent(e)` | `src/main.ts` | Combines `toSvg()` and `zoneAt()`; returns the zone under the pointer or `null` |
| `setZone(key, instant)` | `src/main.ts` | Makes `key` the active zone: toggles `.active` on overlays and pills and triggers the panel swap |
| `current` | `src/main.ts` | The zone currently displayed (`ZoneKey \| null`, `null` until the first `setZone()`) |
| `pinned` | `src/main.ts` | The zone to return to when the pointer leaves; starts as `LGNP` |
| `zoneEls` | `src/main.ts` | `Record<ZoneKey, SVGGElement>` from zone key to its generated overlay `<g>` element |
| `isZoneKey()` | `src/data.ts` | Type guard used to validate a pill's `data-zone` before pinning it |
| `.pill[data-zone]` | `index.html` | Explore buttons for `LGNP`, `LG`, `LN`, `GP`, `NP` |

## How it works

### Hit testing

`zoneAt()` in `src/geometry.ts` loops over `ORDER` (`["L", "G", "N", "P"]`, from `src/data.ts`) and appends each circle's letter when the point is within radius `R` (200) of that circle's center in `CENTERS`. The result is already in canonical [zone key](../primitives/zone-keys.md) order because the loop runs in `ORDER`. The function then checks the string with `isZoneKey()`; if it is not one of the 13 keys in `ZONE_KEYS` (only the empty string, for points outside every circle), it returns `null`.

`zoneAt()` is pure math with no DOM access. In `src/main.ts`, `zoneForEvent()` converts the event with `toSvg()` and passes the point to `zoneAt()`.

Because hit testing is computed from geometry, the overlay groups in `#zones` never need to receive pointer events. The labels group also has `pointer-events: none` in `src/styles.css`, so text never blocks hovering.

### Event handling

```mermaid
graph LR
    Load([page load]) --> Pinned
    Pinned -->|hover a zone| Preview
    Preview -->|leave the circles| Pinned
    Preview -->|click pins the zone| Pinned
    Pinned -->|pill pins its zone| Pinned
```

The four listeners at the bottom of `src/main.ts`:

| Event | Target | Behavior |
| --- | --- | --- |
| `pointermove` | `svg#ikigai` | Calls `zoneForEvent()`, toggles `svg.hovering` (pointer cursor), and calls `setZone(key \|\| pinned)` |
| `pointerleave` | `svg#ikigai` | Removes `hovering` and calls `setZone(pinned)` |
| `click` | `svg#ikigai` | If the click is inside a zone, sets `pinned` to it and calls `setZone()` |
| `click` | each `.pill` | If the pill's `data-zone` passes `isZoneKey()`, sets `pinned` to it and calls `setZone()`; otherwise does nothing |

### Activating a zone

`setZone(key, instant)`:

1. Returns immediately if `key === current`. This makes the frequent `pointermove` calls cheap.
2. Toggles `.active` on the matching overlay in `zoneEls` (looping over `ZONE_KEYS`). In `src/styles.css`, `.zone` has `opacity: 0` with a 0.22 s transition, and `.zone.active` has `opacity: 1`, so the region brightens.
3. Toggles `.active` on the matching pill (dark fill).
4. Clears any pending swap timer, then either renders immediately (`instant`, used once at startup) or runs the panel fade described in [Detail panel](detail-panel.md).

### Touch devices

The SVG has `touch-action: manipulation` in `src/styles.css`, which disables double-tap zoom so taps register as clicks right away. A tap fires `click`, which pins the tapped zone.

### Reachability

The five pills cover only the center and the four named pairs. Single-circle zones (`L`, `G`, `N`, `P`) and the three-circle zones (`LGN`, `LNP`, `GNP`, `LGP`) can only be reached through the diagram. The white dots drawn in `index.html` at (400, 291), (509, 400), (400, 509), and (291, 400) sit inside the four three-circle zones to hint where they are.

## Integration points

- Imports geometry (`CENTERS`, `R`, `zoneAt`) from `src/geometry.ts` and keys and content (`ORDER`, `ZONE_KEYS`, `isZoneKey`, `ZoneKey`) from `src/data.ts`. See [Data models](../reference/data-models.md).
- Depends on the overlay groups produced by [Region rendering](../systems/region-rendering.md).
- Drives the [Detail panel](detail-panel.md) through `setZone()`.

## Entry points for modification

To add a new Explore button, add a `<button class="pill" data-zone="KEY">` to `#pills` in `index.html`; the existing listener picks it up. The value must be a valid key, because the listener silently ignores anything that fails `isZoneKey()`. To change what happens on hover versus click, edit the listeners at the bottom of `src/main.ts`. To change hit-testing math, edit `zoneAt()` in `src/geometry.ts`. If you change circle positions or the radius, update both `CENTERS`/`R` in `src/geometry.ts` and the `<circle>` attributes in `index.html`, because hit testing and the generated masks use the TypeScript values while the visible circles and outlines use the HTML values (see [Pitfalls](../background/pitfalls.md)).

## Key source files

| File | Purpose |
| --- | --- |
| `src/main.ts` | Coordinate conversion, state, `setZone()`, and all event listeners |
| `src/geometry.ts` | `R`, `CENTERS`, and the `zoneAt()` hit test |
| `src/data.ts` | `ZoneKey` type, `ORDER`, `ZONE_KEYS`, and the `isZoneKey()` guard |
| `index.html` | The `svg#ikigai` element and the Explore `.pill` buttons |
| `src/styles.css` | `.zone` fade, `.pill.active` styling, `svg.hovering` cursor, `touch-action` |
