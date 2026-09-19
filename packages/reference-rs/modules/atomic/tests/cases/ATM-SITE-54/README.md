# ATM-SITE-54: Specifier Resolution and Collision Control

Pins SPEC-V2-76's Ph4 row 1: specifiers resolve (relative, `tsconfig`
`paths`/`baseUrl`, extension and index probing, `package.json` `exports`)
and the `(path, export)` cache serves them, so two files declaring the same
const name with different values never cross.

`a.ts` and `b.ts` both export `gap` (`4px` vs `8px`); `App.tsx` imports
from `b` and `Page.tsx` from `a`, and each file's wants carry ONLY its own
target's value. The same compile resolves `@/tokens` through the input
`tsconfig.json`, `./nested` to `nested/index.ts`, `./ui` to `ui.tsx`, and
`theme-pkg/tokens` through the package manifest to `dist/shades.ts` — a
target no direct subpath reaches, so only the exports map can find it.
