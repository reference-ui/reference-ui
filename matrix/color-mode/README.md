# Color-Mode Matrix

This package is the matrix-owned contract for color-mode scoping.

It proves:

- root light and dark scopes resolve the correct token branch
- nested `colorMode` props create local light and dark islands
- descendants follow the nearest explicit scope in real CSS
- both Vite and webpack apply the same color-mode contract

Runner contract:

- tests live under `tests/e2e`
- the package runs with full `ref sync` before tests
- Playwright projects cover both `vite7` and `webpack5`
- Vitest keeps a small runtime surface for fast failures