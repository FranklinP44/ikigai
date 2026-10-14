---
name: qa-web
description: >
  QA tests for the web app: the single-page interactive Ikigai diagram (index.html, src/).
  Covers page load, hover, click to pin, the Explore pills, keyboard selection, console errors,
  and the built page under vite preview.
---

# QA: web (Ikigai diagram)

A static single page built with Vite and plain TypeScript, with no framework, no backend, no login, and no data storage. One SVG diagram of four overlapping circles makes 13 regions ("zones"). A side panel describes the selected zone, and five Explore pills select the named zones.

Read `.factory/skills/qa/config.yaml` first for the environment URLs and for `video_evidence` and `droid_control.compose`.

## Driving the browser

Invoke the `droid-control` skill before interacting with the page. Use its web route (browser-use, driven by agent-browser) plus the Capture and Verify stages. Load Compose only when both `video_evidence` and `droid_control.compose` are true in config. This file describes WHAT to test and how to judge it; droid-control owns HOW to drive the browser, capture evidence, and verify it.

Use real pointer moves, clicks, and key presses. Do not call the page's handlers or dispatch synthetic events from JavaScript; read-only JavaScript evaluation is fine for computing coordinates and reading DOM state.

## Testing Target

The project has no preview deployments, so always test the branch's own code on a local server. Never fall back to the production URL (`https://franklinp44.github.io/ikigai/`): it serves `main`, so testing it says nothing about a pull request. If no local server can be started, report the affected flows as BLOCKED.

### Dev server (default, `local`)

1. If `node_modules/` is missing, run `npm ci`.
2. Check whether http://localhost:5173/ already answers.
   - In CI (`CI=true`), something already on the port is unexpected: report BLOCKED with the port conflict.
   - Outside CI, you may reuse a server that is already running, and say so in the report notes, because it may not be serving this working tree.
3. Otherwise start `npm run dev -- --strictPort` in the background from the repository root. `--strictPort` makes Vite fail instead of silently moving to 5174 when 5173 is taken.
4. Poll http://localhost:5173/ about once a second for up to 60 seconds until it returns HTTP 200. If it never does, report BLOCKED and include the last lines of the server output.
5. Use http://localhost:5173/ as the base URL.

### Built page (`preview`, used by flow 6)

1. Run `npm run build`. A build failure is a FAIL for flow 6; include the error.
2. Start `npm run preview -- --strictPort` in the background and poll http://localhost:4173/ the same way.
3. Use http://localhost:4173/ as the base URL for flow 6.

Stop every server this run started before finishing, including the `vite` child process: stopping only the `npm` wrapper leaves Vite serving the port. Confirm that http://localhost:5173/ and http://localhost:4173/ no longer answer. Do not open `dist/index.html` from disk; the README says the built page must be served over HTTP.

## Authentication

None. The only persona is `visitor`, an anonymous user who can explore every zone and has nothing it cannot do. No environment variables or secrets are needed. Do not invent permission tests.

## Page anatomy

Read these with read-only DOM queries or the accessibility tree:

| What          | Where                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Page title    | `document.title`                                                                                                    |
| Diagram       | `svg#ikigai` with `aria-label="Four-circle Ikigai diagram"`, `viewBox="40 40 720 720"`                              |
| Zone overlays | 13 `g.zone[data-zone]` inside `#zones`; the selected one has class `active`                                         |
| Hover state   | `svg#ikigai` has class `hovering` while the pointer is over a zone                                                  |
| Panel         | `#eyebrow`, `#title` (an `h2`), `#desc`, `#chips`, `#examples` inside `#content`                                    |
| Chips         | four `#chips .chip` in L, G, N, P order; a chip has class `off` when the zone does not include that circle          |
| Examples      | `#examples li` items                                                                                                |
| Pills         | five `button.pill` in `#pills` with `data-zone` `LGNP`, `LG`, `LN`, `GP`, `NP`; the selected one has class `active` |

Zone keys list the circles a zone sits inside: `L` What you love, `G` What you're good at, `N` What the world needs, `P` What you can be paid for.

**Expected content comes from the branch's `src/data.ts`.** For a zone key `K`, the panel must show `ZONES[K].eyebrow`, `ZONES[K].title`, and `ZONES[K].desc`, one example per entry of `EXAMPLES[K]` in order, and chips named after `CIRCLE[k].name` with `off` on every circle not in `K`. Read `src/data.ts` at the start of the run; do not rely on remembered text, because a pull request may change it. The text uses typographic apostrophes (`’`), so compare exactly.

### Pointing at a zone

Hit-testing uses the pointer position in SVG coordinates (`zoneAt` in `src/geometry.ts`), not the element under the pointer, so you must move the real pointer to the right screen point. Convert an SVG point to viewport coordinates with read-only JavaScript after scrolling the diagram into view:

```js
const svg = document.getElementById("ikigai");
const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
[Math.round(p.x), Math.round(p.y)];
```

Probe points in SVG coordinates, checked against the circle geometry at install time (re-check them against `CENTERS` and `R` in `src/geometry.ts` when the diff changes the geometry):

| Zone                 | Pill       | SVG point              |
| -------------------- | ---------- | ---------------------- |
| `LGNP` Ikigai        | Ikigai     | (400, 400)             |
| `L`                  | none       | (400, 120)             |
| `G`                  | none       | (120, 400)             |
| `N`                  | none       | (680, 400)             |
| `P`                  | none       | (400, 680)             |
| `LG` Passion         | Passion    | (282, 287)             |
| `LN` Mission         | Mission    | (518, 287)             |
| `GP` Profession      | Profession | (282, 527)             |
| `NP` Vocation        | Vocation   | (518, 527)             |
| `LGN`                | none       | (400, 310)             |
| `LNP`                | none       | (490, 400)             |
| `GNP`                | none       | (400, 490)             |
| `LGP`                | none       | (310, 400)             |
| outside every circle | none       | (60, 60) or (740, 740) |

To leave the diagram, move the pointer to a visible element outside `svg#ikigai`, such as the page `h1` or, when the `h1` has scrolled out of view, the panel `#title`. Confirm with `document.elementFromPoint` that the point is not inside `svg#ikigai`.

### Timing

A selection change fades the panel out (`#content` gets class `swap`) and renders the new text after 140 ms. Wait until `#content` no longer has `swap`, or at least 400 ms, before reading the panel or taking a screenshot. The first render on page load is instant. The circle labels fade in over about 1.4 seconds after load, so wait about 2 seconds before a load screenshot.

## Test flows (menu)

Pick the flows that match the diff, plus adjacent flows that show the change works with the rest of the page. All flows use the `visitor` persona.

| Changed files                                                          | Flows to run                                                     |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/data.ts` (zone text, examples, circle names)                      | 2 and 4 for every changed zone; 1 if `LGNP` changed              |
| `src/geometry.ts`, or circle geometry in `index.html`                  | 2 across all 13 probe points plus both outside points, and 3     |
| `src/main.ts`                                                          | 1 to 5, focused on the handlers or rendering the diff touches; 6 |
| `index.html` markup                                                    | 1; 4 and 5 if the pills changed; 6                               |
| `src/styles.css`                                                       | 1 and 7, with screenshots; 2 if hover or active styles changed   |
| `vite.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json` | 6, then 1                                                        |

### Flow 1: Page load and initial state

1. Open the base URL and wait for `svg#ikigai` and a non-empty `#title`.
2. Check:
   - `document.title` is `Ikigai · A reason for being`, and the page `h1` reads `Ikigai`.
   - `svg#ikigai` is visible, has its `aria-label`, and `#zones` holds 13 `g.zone` elements.
   - The panel shows `LGNP` (eyebrow `All four circles`, title `Ikigai`, per `src/data.ts`), with four chips, none `off`, and the `LGNP` examples.
   - Only the Ikigai pill is `active`, and only `g.zone[data-zone="LGNP"]` is `active`.
3. Evidence: panel text snapshot and a screenshot `01-load.png`.

### Flow 2: Hover updates the panel

1. Move the pointer to the probe point of each zone under test (at minimum one single circle, one pair, one triple, and the centre).
2. For each, after the swap completes, check eyebrow, title, description, chips (`off` pattern), and examples against `src/data.ts`; check that `g.zone[data-zone="<key>"]` is the only active overlay and that `svg#ikigai` has class `hovering`.
3. Check pills: hovering a named zone marks its pill `active`; hovering an unnamed zone (for example `L` or `LGN`) leaves no pill active.
4. Negative: move to an outside point such as (60, 60). The panel must return to the pinned zone (`LGNP` on a fresh load), and `svg#ikigai` must lose `hovering`.
5. Evidence: one panel snapshot per hovered zone.

### Flow 3: Click to pin, then leave the diagram

1. Click the Mission point (518, 287). The panel shows `LN`, and the Mission pill is `active`.
2. Hover the Profession point (282, 527). The panel shows `GP`.
3. Move the pointer off the diagram (onto the `h1`). The panel returns to `LN`, and the Mission pill is `active` again.
4. Negative: click an outside point such as (60, 60), then leave the diagram. The pin must still be `LN`.
5. Click an unnamed zone such as `L` (400, 120) and leave the diagram. The panel must stay on `L`, with no pill active.
6. Evidence: panel snapshots after steps 1, 3, and 4.

### Flow 4: Explore pills select zones

1. Click each pill in turn: Ikigai, Passion, Mission, Profession, Vocation.
2. After each click, check that the panel matches its `data-zone` (`LGNP`, `LG`, `LN`, `GP`, `NP`) per `src/data.ts`, that exactly one pill is `active`, and that the matching `g.zone` is the only active overlay.
3. Pills pin their zone: after clicking Vocation, hover any zone, then leave the diagram. The panel must return to `NP`.
4. Evidence: panel snapshot after each pill.

### Flow 5: Keyboard selection

The pills are native `<button>` elements, so Tab, Enter, and Space work without extra code.

1. Load the page fresh and, without clicking anything, press Tab until the Ikigai pill has focus (it should be the first focusable element). Record the focus order and check that the focused pill has a visible focus indicator.
2. Tab to Passion and press Enter. The panel shows `LG`, and the Passion pill is `active`.
3. Tab to Mission and press Space. The panel shows `LN`.
4. Shift+Tab back to Passion and press Enter. The panel shows `LG` again.
5. Expected, not a failure: the SVG regions are not focusable and have no key handlers, so Tab never lands on the diagram. Only report this as a failure if the diff claims to add keyboard support to the diagram.
6. Evidence: focus order and panel snapshots after steps 2 and 3.

### Flow 6: Console errors and the built page

1. During every flow above, collect console messages and uncaught page errors through the driver. Any error from the page's own code or a failed request to the page's own origin is a FAIL. Errors only from `fonts.googleapis.com` or `fonts.gstatic.com` are environment noise when the network blocks them; note them without failing the flow. The page links no favicon, so the browser's own `/favicon.ico` request returns 404; note it without failing the flow.
2. Build and serve the page as described under Built page, then open http://localhost:4173/.
3. Repeat flow 1's checks, one hover from flow 2, and one pill from flow 4.
4. Check that the page's script and stylesheet load from relative `./assets/` URLs with no 404s (`base: "./"` in `vite.config.ts` is what lets GitHub Pages serve the page from `/ikigai/`).
5. Evidence: console summary ("0 errors" or the errors), the asset URLs, and a screenshot `06-preview.png`.

### Flow 7: Narrow layout and taps (styles changes only)

Run this adjacent flow when `src/styles.css` or the page layout changes. The stylesheet has breakpoints at 900 px and 600 px.

1. Set the viewport to about 390 by 844.
2. Check that the diagram and the panel stack in one column, with no horizontal scrolling and readable circle labels.
3. Click (tap) the Passion point and one unnamed zone. The panel must update and pin as in flow 3.
4. Evidence: screenshot `07-narrow.png` and panel snapshots.

## Per-persona variations

There is one persona, `visitor`. Every flow runs as `visitor` with no login. There are no negative permission tests; flows 2 and 3 carry the negative boundary checks (outside points).

## Error handling

- If the server does not start, report every affected flow as BLOCKED with the command, the port, and the last server output.
- If a probe point lands in an unexpected zone, re-check the point against the branch's `src/geometry.ts` before calling it a FAIL; a geometry change in the diff can move zones.
- If the panel text does not match `src/data.ts`, it is a FAIL. Quote the expected and actual text.

## Known Failure Modes

1. **Port 5173 or 4173 already in use.** Without `--strictPort`, Vite silently moves to the next port and the flows hit the wrong server or nothing. Always start with `--strictPort`, and report BLOCKED on a port conflict in CI.
2. **Reading the panel too early.** The panel swaps text 140 ms after a selection and fades for about 180 ms more. Wait for `#content` to drop the `swap` class before asserting.
3. **Synthetic hover does nothing.** Hovering is computed from pointer coordinates in `pointermove` on the SVG, not from the element under the pointer. Dispatching events on a `g.zone` or hovering a zone element by selector will not select it; move the real pointer to the converted probe point.
4. **Pointer left inside the diagram.** `pointerleave` fires only when the pointer leaves `svg#ikigai`. Moving to an outside point that is still inside the SVG box (such as (60, 60)) shows the pinned zone but does not leave the diagram. Use the `h1` to leave it.
5. **Google Fonts blocked.** The page loads fonts from Google Fonts. Sandboxed runners may block them, which logs network errors and changes the fallback fonts in screenshots. That is environment noise, not an app failure.
6. **SVG regions are not keyboard focusable.** This is the current design, not a regression.
7. **Labels missing in early screenshots.** Circle labels fade in over about 1.4 seconds after load; wait about 2 seconds before a load screenshot.
8. **Orphaned Vite after shutdown.** Killing a backgrounded `npm run dev` or `npm run preview` stops only `npm`; the `vite` child keeps the port. Stop the whole process group (or the `vite` child too) and check that the port stops answering.
9. **`h1` out of view.** After scrolling the diagram into view for the lower probe points, the `h1` can be above the viewport. Leave the diagram through the panel `#title` instead.
10. **favicon 404.** The browser requests `/favicon.ico` on its own and Vite answers 404 because `index.html` links no favicon. This is not a page failure.
11. **Production is out of bounds for branch testing.** Never point the flows at `https://franklinp44.github.io/ikigai/` for a pull request or CI run, even when the local server fails.
