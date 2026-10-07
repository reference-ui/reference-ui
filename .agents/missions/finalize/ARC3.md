# ARC3 — Native MDX support via mdx-rs

STATUS: PENDING

Context: MDX-to-JS is 12.6 ms/pass (`@mdx-js/mdx`) vs 2.9 ms/pass
(`@rspress/mdx-rs`) on the 11-file docs corpus. Not the 15s cause. Legacy
transform exists at
`packages/reference-legacy/src/virtual/transforms/mdx-to-jsx/index.ts` (56
lines, uses `@rspress/mdx-rs`). MDX is currently excluded from fragment
bundling (`collect/constants.ts` `FRAGMENT_EXTENSIONS` + gated matches in
`collect/lib/scan/scanner.ts`).

This arc ports the legacy preprocess into Neo sync, with a proving case and
`bench:neo` before/after. Bounded: if the seam is large, file a precise plan
and stop rather than half-land.

## Entries
