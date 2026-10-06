# Testing

There are no automated tests and no test framework in the repository. Testing is manual, in a browser.

## Manual checklist

Run this after any change. It takes about two minutes.

### Load

- [ ] The page loads with no errors in the DevTools console.
- [ ] The circles pop in one after another, then labels and outlines fade in.
- [ ] The panel shows "Ikigai" with all four chips on.

### Diagram interaction

- [ ] Hovering each of the four single-circle areas shows that circle's name and the eyebrow "One circle".
- [ ] Hovering each named pair (Passion, Mission, Profession, Vocation) highlights the region and updates the panel.
- [ ] Hovering near each white dot shows a three-circle zone.
- [ ] The cursor becomes a pointer over the circles and returns to normal outside them.
- [ ] Moving outside the circles returns the panel to the pinned zone.
- [ ] Clicking a zone pins it. Leaving the diagram then shows that zone instead of Ikigai.

### Explore buttons

- [ ] Each of the five pills switches the zone and shows the active (dark) style.
- [ ] The pill for the pinned zone stays active; hovering a different zone deactivates it until the pointer leaves.

### Responsive

- [ ] At widths below 900 px, the panel stacks under the diagram.
- [ ] At widths below 600 px, the SVG labels are still readable.
- [ ] On a touch device or touch emulation, tapping a zone pins it.

## Quick data check from the console

Paste this in the DevTools console to confirm every zone has content and three examples. `ZONES` and `EXAMPLES` are top-level `const` declarations in `script.js`, so they are reachable from the console.

```js
Object.keys(ZONES).every(k => EXAMPLES[k] && EXAMPLES[k].length === 3)
```

It should return `true`.

## If you add automated tests

A browser test runner such as Playwright would fit best, since most behavior depends on SVG geometry and pointer events. The pure functions `zoneAt()` and the data objects in `script.js` could be unit tested if the file were split into a module. Neither exists today. See [Cleanup opportunities](../cleanup-opportunities.md).
