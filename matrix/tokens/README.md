# Tokens Matrix

This package is the matrix-owned contract for token generation and token-backed runtime styling.

It proves:

- `tokens()` emits the expected generated config and CSS variable output
- stale watch-only token names do not leak into clean one-shot sync output
- primitives and css() consume emitted token values in the browser
- both Vite and webpack apply the same token contract

Runner contract:

- tests live under `tests/e2e` and `tests/unit`
- the package runs with full `ref sync` before tests
- Playwright projects cover both `vite7` and `webpack5`
- Vitest owns the static generated-artifact assertions