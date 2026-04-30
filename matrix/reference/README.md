# Reference Matrix

This package is the matrix-owned single-consumer contract for generated
reference docs and the browser `Reference` surface.

It proves:

- `ref sync` emits `@reference-ui/types` plus Tasty manifest artifacts
- local fixture symbols and projected public types are queryable from the
  generated manifest
- the browser `Reference` component renders complex interface and alias fixtures
  in a real consumer
- missing symbols fail with readable browser copy and symbol renames refresh
  after a local sync

Runner contract:

- unit tests live under `tests/unit`
- browser tests live under `tests/e2e`
- the package runs with full `ref sync` before tests
- Playwright uses Vite against the local consumer app