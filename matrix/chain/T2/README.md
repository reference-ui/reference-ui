# matrix/chain/T2 — Layer one library

**Topology:** `Library A ──▶ layer ──▶ User space`

**Chain topology:** T2 (core proof set)

## What this tests

When a consumer declares `layers: [LibA]` in its `ui.config.ts`:

- Only the upstream library's `css` surface is imported during stylesheet assembly
- The upstream `fragment` is NOT adopted — upstream tokens do not enter this package's Panda config or TypeScript surface
- Components that live inside the upstream library's CSS layer can still resolve their own layer-scoped tokens
- A bare consumer primitive attempting to use an upstream layer token will NOT resolve it

## Fixture used

`@fixtures/layer-library` — provides `LayerPrivateDemo` (uses the `layerPrivateAccent` token
that is intentionally private to the layer), `LightDarkDemo`, and exports its `baseSystem`.

## Tests

- `tests/unit/runtime.test.ts` — Verifies the component tree renders and the marker is correct.
- `tests/e2e/T2-contract.spec.ts` — Browser assertions confirming that the
  layer-library's CSS is applied (LayerPrivateDemo's background resolves), while
  the upstream token is scoped inside the layer's own components.
