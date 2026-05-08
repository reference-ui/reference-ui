# Primitives Matrix

This package is the matrix-owned primitives contract for generated Reference UI
primitives and style props.

It collapses the current split across `reference-unit` and `reference-e2e`
into one fixture that proves:

- generated primitives mount in a real browser
- style props resolve through emitted design-system CSS
- border shorthand, font presets, and size/container custom props resolve in computed styles
- container queries apply based on real container width instead of happy-dom approximations
- the `css` prop composes into generated classes instead of leaking to the DOM
- both Vite and webpack apply the same primitive styling contract

Runner contract:

- tests live under `tests/e2e`
- the package runs with full `ref sync` before tests
- Playwright projects cover both `vite7` and `webpack5`
- Vitest keeps a small import/runtime smoke surface for fast failures