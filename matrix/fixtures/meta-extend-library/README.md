# @fixtures/meta-extend-library

Meta-fixture used by the chain matrix to prove transitive `extends`.

This library declares `extends: [@fixtures/extend-library.baseSystem]`. Its
published `baseSystem.fragment` republishes extend-library's contributions
plus its own (`metaExtendBg`, `metaExtendText`).

Used by:

- T6 — chain (App extends meta-extend-library which already extends extend-library)
- T7 — diamond (one branch on shared base extend-library)
- T10 — extend chain plus an app-level layered library
- T11 — parallel extend chains
- T12 — diamond with mixed branches (one layered, one extended)
- T13 — parallel extend chains plus a shared app-level layer
