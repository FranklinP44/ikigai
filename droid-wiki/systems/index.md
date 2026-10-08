# Systems

Two internal building blocks sit underneath the [features](../features/index.md).

| System | Responsibility | Page |
| --- | --- | --- |
| Region rendering | Builds SVG masks in `src/main.ts` so each of the 13 zones can be painted and highlighted on its own | [Region rendering](region-rendering.md) |
| Visual design | Design tokens, typography, entrance animations, and responsive layout in `src/styles.css` | [Visual design](visual-design.md) |

Region rendering is TypeScript that runs once when the `src/main.ts` module loads, using circle geometry from `src/geometry.ts`. Visual design is pure CSS and applies continuously. Vite bundles both into `dist/` at build time; see [Deployment](../deployment.md).
