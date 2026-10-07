# ARC3 — Native MDX support via mdx-rs

STATUS: NOT LANDED — plan approved with changes (Oracle); Arc 3 deferred to a
follow-up mission

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
- 2026-10-07 · ARC3.review (Oracle, pin `2ffb79770`) · **VERDICT: APPROVED WITH
  CHANGES; Arc 3 stays NOT LANDED.** STOP upheld: even re-scoped, Phase 1 (new
  NAPI dep + root lockfile install on the shared native tree) is cross-package
  work outside this arc's bound. Adopt R1 (drop the `mdx` flag; register the
  `.mdx` plugin unconditionally in `plugins/index.ts`, covering `bundleFragments`,
  `runSingle`, `runPlanner`) and R2 (MDX-scoped **sync** pre-pass; the global
  `createImportPatterns` stays frozen, so no `.ts/.tsx` goldens churn); R3 is
  conditional (no `splitScan → async` under R2). R4's `NEO-MDX-01` needs a
  decoy-only `decoy.mdx`; the font-content mirror is `NEO-PARITY-01` /
  `NEO-GLOBAL-08`, not `NEO-SYNC-01`. Full ruling in `reports/ARC3.review.md`.
- 2026-10-07 · ARC3.fix (DeepSeek V4.1 Flash, base `96f017015`) · **Captain
  rulings recorded; revised plan filed.** R5: on MDX compile failure, **abort
  with attribution** (diagnostic naming file + parse error) — a deliberate
  divergence from the legacy silent `export {}` warn-and-empty, because the repo
  bans silent failure. R6: platform coverage is via pnpm
  `optionalDependencies`; the future land must verify install on **darwin-arm64**
  and **linux-x64 (incl. Dagger)**, not just name `-darwin-x64`. R7/R8: the
  `@mdx-js/react@3.1.1` root-lock entry means `react-stub` widening is the
  chosen route (pnpm isolation, not store absence); scope stays `.mdx`-only.
  Revised durable plan: `PLAN-mdx.md` (the `reports/` dir is gitignored). No
  source files changed.
