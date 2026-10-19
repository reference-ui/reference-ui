# chain-t3 — Hybrid: extend one library + layer another

**Topology:**
```
Library A ──▶ extend ──┐
                        ├──▶ User space
Library B ──▶ layer  ──┘
```

**Chain topology:** T3 (core proof set — first in suggested execution order)

## What this tests

Can one boundary use both composition modes simultaneously?

- `extend-library` is adopted via `extends`: its fragment, tokens, and portable CSS enter this package's config surface and TypeScript types.
- `layer-library` is adopted via `layers`: only its portable CSS enters the assembled stylesheet; its tokens do NOT enter this package's config or TS surface.

## Fixtures used

- `@fixtures/extend-library` — adopted side. Provides `fixtureDemoBg`, `fixtureDemoAccent`, `fixtureDemoText` tokens and `DemoComponent`.
- `@fixtures/layer-library` — layered side. Provides `LayerPrivateDemo` with its layer-scoped `layerPrivateAccent` token.

## Tests

- The node-side runtime suite verifies the component tree renders and the marker is correct.
- The browser contract spec asserts both sides:
  - Extend side: `DemoComponent` resolves all three upstream tokens correctly.
  - Layer side: `LayerPrivateDemo` renders with its layer-scoped background color.
