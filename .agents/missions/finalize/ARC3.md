# ARC3 — Native MDX support via mdx-rs

STATUS: NOT LANDED — plan filed; Oracle review pending

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

- 2026-10-07 · ARC3.impl (feasibility, base `2ffb79770`) · **VERDICT: NOT LANDED —
  plan filed**. Not a small seam: `@rspress/mdx-rs` is absent from
  `packages/reference-neo/package.json`, `pnpm-lock.yaml`, and `node_modules`
  (legacy is workspace-excluded), so landing needs a native NAPI dep + root
  install; transform-before-match breaks the frozen "verbatim T1" `splitScan`
  confirm; compiling MDX alone does not kill the docs false positive because
  `createImportPatterns` is unanchored and the fence still carries the needle
  bytes (probe-verified), so discovery needs statement-level matching (global
  change + goldens blast radius); the bundle path needs an MDX esbuild plugin and
  `@mdx-js/react` handling; and there is no MDX case group or `bench:neo` axis.
  No source files changed; `pnpm agentneo q` clean (0 errors, 24 warnings). Full
  plan + `NEO-MDX-01` sketch in `reports/ARC3.impl.md`.
