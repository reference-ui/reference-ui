# Spacing Matrix

This package is the matrix-owned contract for rhythm props and the size custom prop.

It proves:

- rhythm spacing resolves to concrete layout in a real browser
- multi-value rhythm shorthands preserve per-side values
- the size custom prop keeps width and height in lockstep
- both Vite and webpack apply the same spacing contract

Runner contract:

- tests live under `tests/e2e`
- the package runs with full `ref sync` before tests
- Playwright projects cover both `vite7` and `webpack5`
- Vitest keeps a small runtime surface for fast failures