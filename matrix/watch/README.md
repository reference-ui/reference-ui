# Watch Matrix

This package is the matrix-owned watch contract for `ref sync --watch`.

It intentionally collapses the existing split coverage from `reference-unit`
and `reference-e2e` into one runtime fixture that proves:

- `css()` edits invalidate generated CSS and reach the browser
- primitive style-prop edits are present at the watch-ready edge
- `recipe()` and `tokens()` edits can land in the same watch cycle
- both Vite and webpack consume the same generated runtime output

Runner contract:

- tests live under `tests/e2e`
- the package runs in `watch-ready` ref sync mode
- Playwright projects cover both `vite7` and `webpack5`
- the suite mutates tracked source files in-place and restores them before exit
