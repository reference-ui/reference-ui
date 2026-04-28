# CSS Matrix

This package is the matrix-owned contract for the `css()` API and its adjacent
generated CSS surfaces.

It proves:

- `css()` classes are generated and applied in a real browser
- `globalCss()` rules are emitted and observable in the document
- `keyframes()` definitions are emitted and used by runtime classes
- container-query branches authored through `css()` lower into real `@container` CSS
- the generated stylesheet is mounted and preserves expected layer order

Runner contract:

- tests live under `tests/e2e`
- the package runs with full `ref sync` before tests
- Playwright projects cover both `vite7` and `webpack5`
- Vitest keeps a small generated-output smoke surface for fast failures