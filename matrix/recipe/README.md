# Recipe Matrix

This package is the matrix-owned contract for the `recipe()` API.

It proves:

- base recipe styles apply in a real browser
- variants switch stable classes and computed styles predictably
- compound variants override the expected branch without leaking unstable output
- both Vite and webpack apply the same recipe contract

Runner contract:

- tests live under `tests/e2e`
- the package runs with full `ref sync` before tests
- Playwright projects cover both `vite7` and `webpack5`
- Vitest keeps a small runtime surface for fast failures