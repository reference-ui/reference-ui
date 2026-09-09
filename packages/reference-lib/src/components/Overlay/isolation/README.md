# isolation

Modal side effects, reference-counted per document.

- `hide-outside` — `inert` on siblings; skip authored hidden ancestors; reparent into Content or a hidden tree drops duplicate ownership; walks open ShadowRoots
- `scroll-lock` — per-document scroll; RTL gutter; pinch-zoom allowed; iOS edge sheets pin `body` to `position: fixed`
- `pointer-events` — `body { pointer-events: none }` while a modal is present
