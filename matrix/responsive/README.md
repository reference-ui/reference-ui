# Responsive Matrix

This package is the matrix-owned contract for responsive behaviour across `css()`, `recipe()`, and primitive `r` props.

It proves:

- primitive `r` props respond to real container width
- `css()` responsive branches follow the correct named container
- `recipe()` responsive branches apply in the browser without flattening
- both Vite and webpack apply the same responsive contract

Runner contract:

- tests live under `tests/e2e`
- the package runs with full `ref sync` before tests
- Playwright projects cover both `vite7` and `webpack5`
- Vitest keeps a small runtime surface for fast failures