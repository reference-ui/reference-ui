# @fixtures/meta-extend-library

Meta-fixture used by the chain matrix to prove transitive `extends`.

This library declares `extends: [@fixtures/extend-library.baseSystem]`. Its
published `baseSystem.fragment` republishes extend-library's contributions
plus its own (`metaExtendBg`, `metaExtendText`).

Used by:

- T6 — chain (App extends meta-extend-library which already extends extend-library)
- T7 — diamond (sibling B extending shared base extend-library)
- T11 / T16 / T17 / T18 — multi-input chain composition
