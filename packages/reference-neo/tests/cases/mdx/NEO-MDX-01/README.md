# NEO-MDX-01 — MDX files contribute fragments through the native mdx-rs loader

One world whose only fragment is written in MDX. `world/theme/doc.mdx` carries a
real top-level `import { font } from '@reference-ui/system'` and calls
`font('display', …)` in a top-level `export const`; sync compiles the MDX
through `@rspress/mdx-rs` (the `mdxPlugin`), bundles it with the react stub, and
the eval script runs the `font()` call, so the sheet mints `@font-face` and
`.ref-display`. `world/theme/decoy.mdx` carries the same needle **only inside a
fence** with no top-level import: it must never be collected and contributes no
fragment. The decisive decoy proof is scan-level
(`src/collect/lib/scan/mdx.test.ts`): a compiled fence is an inert string, so the
sheet alone cannot distinguish a wrongly-collected decoy — the match set can.
This is the fail-before/pass-after file: before MDX was a fragment candidate the
sheet had no face and no `.ref-display`.

Do not "simplify" the `export const display = font(...)` into a bare call or a
`{…}` expression: MDX treats bare call lines as prose and `{…}` defers the call
to render, so only the top-level `export const` runs `font()` at sync.

> Search terms: mdx, mdx-rs, rspress, fragment collection, esbuild loader, fence decoy, frontmatter, @mdx-js/react, react stub, native import scan, NEO-PARITY-01, NEO-GLOBAL-08
