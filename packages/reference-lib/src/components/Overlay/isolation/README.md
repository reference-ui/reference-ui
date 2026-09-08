# isolation

Modal side effects, reference-counted per document.

- `hide-outside` — `inert` on siblings; reparent into Content clears stale ownership
- `scroll-lock` — document scroll; iOS edge sheets pin `body` to `position: fixed`
- `pointer-events` — `body { pointer-events: none }` while a modal is present
