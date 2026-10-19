# ATM-SITE-54 — Specifier Resolution and Collision Control

Pins the specifier rungs: specifiers resolve (relative, `tsconfig`
`paths`/`baseUrl`, extension and index probing, the package `exports` map)
and the `(path, export)` cache serves them, so two files declaring the same
const name with different values never cross.

`a` and `b` both export `gap` (`4px` vs `8px`); `App` imports
from `b` and `Page` from `a`, and each file's wants carry ONLY its own
target's value. The same compile resolves `@/tokens` through the input
`tsconfig`, `./nested` to the `nested` index, `./ui` to `ui` plus `.tsx`, and
`theme-pkg/tokens` through the package manifest to the built `shades` module — a
target no direct subpath reaches, so only the exports map can find it.
