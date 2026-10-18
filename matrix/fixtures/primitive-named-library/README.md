# @fixtures/primitive-named-library

Prebuilt fixture package for chain T18: a third-party package built on
Reference UI, the shape the component-ownership plan calls `Package`. It
syncs under its own name (`primitive-named-library`) and bundles its own
generated runtime, so every style prop its components forward mints
`primitive-named-library__*` at runtime.

## Exports

- `baseSystem` (also at `./baseSystem`) for `extends` / `layers`.
- `Button`: the generated primitive itself (`export { Button } from
  '@reference-ui/react'`). A consumer's `<Button>` from this package spells
  an own primitive name but renders through this package's runtime.
- `Tile`: forwards every style prop to its `Div`, so tracing publishes it in
  `jsxElements`.
- `Chip`: owns `size` (consumed as inline padding, the icons shape), so
  tracing publishes it with `size` in `jsxOwned`.
- `chipPaddingSm` / `chipPaddingLg`: the chip's own size values, for
  assertions.

Its `ui.config.ts` carries no `jsxElements`: both wrappers reach the
published roster by tracing alone.

## Usage

```bash
pnpm run sync
pnpm run build
```
