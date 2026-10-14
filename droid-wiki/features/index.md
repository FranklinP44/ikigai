# Features

The app has two user-facing features. Both live in `src/main.ts` and share the same state (`current` and `pinned`). Their content comes from `src/data.ts`, and hit testing comes from `src/geometry.ts`.

The repository also has developer-facing wiki refresh and functional QA workflows in `.github/workflows/droid-wiki-refresh.yml` and `.github/workflows/qa.yml`. They run separately from the browser app.

| Feature | What it does | Page |
| --- | --- | --- |
| Zone exploration | Hovers, taps, or clicks regions of the diagram, or presses an Explore button | [Zone exploration](zone-exploration.md) |
| Detail panel | Reads the eyebrow, title, description, circle chips, and examples for the active zone | [Detail panel](detail-panel.md) |
| Wiki refresh | Updates documentation in Factory and prepares a rolling pull request | [Wiki refresh](wiki-refresh.md) |
| Functional QA | Selects browser checks from a diff and reports on branch-local app behavior | [Functional QA](functional-qa.md) |

```mermaid
graph LR
    Pointer[Pointer over SVG] -->|zoneAt| ZE[Zone exploration]
    Pills[Explore buttons] -->|isZoneKey| ZE
    ZE -->|setZone key| DP[Detail panel]
    ZE -->|.active| Overlay[Zone overlay highlight]
```

The visual building blocks these features depend on are covered under [Systems](../systems/index.md).
