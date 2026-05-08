# Font Matrix

This package is the matrix-owned contract for `font()` and the generated font
registry surface.

It proves:

- repeated `font()` calls register a multi-font fixture shaped like the
  `reference-lib` theme fonts
- generated stylesheets stay syntactically valid and emit `@font-face` rules,
  font utilities, and font-level CSS contributions
- generated `@reference-ui/react` types expose the authored font registry
- primitives resolve named and compound font weights in a real browser

Runner contract:

- tests live under `tests/unit` and `tests/e2e`
- the package runs with full `ref sync` before tests
- Playwright uses the local `vite7` project
- Vitest covers generated CSS and TypeScript-facing font registry contracts