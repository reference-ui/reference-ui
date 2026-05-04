# System Matrix

This package is the matrix-owned contract for APIs imported from
`@reference-ui/system`.

It proves:

- `tokens()` emits consumable design tokens
- `globalCss()` writes document-level rules and custom properties
- `keyframes()` emits animation names consumable from runtime components
- generated stylesheets mount with the expected layer ordering in a real browser

Runner contract:

- tests live under `tests/e2e`
- the package runs with full `ref sync` before tests
- Playwright projects cover both `vite7` and `webpack5`
- Vitest keeps a small import/runtime smoke surface for fast failures