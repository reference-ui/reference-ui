# scan-T2-bundle REPORT: fragment-bundle fixed cost — single multi-entry build

## Identity

- Base pin: `0eade4ac14167a094fd0ac12e07378f3c343280d` (verified first act; tree clean at start).
- Hypothesis: ONE mechanism — fuse the 2 `microBundle` (esbuild.build) calls in
  `bundleFragments` into ONE multi-entry `esbuild.build`. No pivot, no second lever.
- Where: `packages/reference-neo/src/fragments/lib/runner.ts` (`bundleFragments`) +
  new `microBundleMany` on the seam (`packages/reference-neo/src/lib/microbundle/`).
- Fences honored (by function): bundle-call shape ONLY. No config-phase changes
  (service warmth is config's — probes warm the service to mirror production);
  `runSingle`/`runPlanner` collect paths untouched (per-file tmp-import interleave
  is execution semantics, not call shape); `microBundle` itself untouched (old path
  intact as fallback); seam untouched; no N-API/Rust touched.
- End state: tree diff vs HEAD is 3 modified + 1 new test + this REPORT.md only.
  No commits, no pushes, no LOG writes, no `git stash` (file asides only).

## Grounding (index-first)

- `pnpm agentperf search bundle microbundle esbuild kevent`: 0 combined hits
  (94 entries, index built 2026-09-22T12:21:59Z); `bundle` alone 3 hits, all
  unrelated (RSS-hunters guardrails, repro, valgraph). Unexamined ground.
- `PERF-W4-SCANRECON4` cited in brief is NOT in the perf index (`show` → unknown
  id). Grounding instead from the recon record read directly:
  scan-recon4 `REPORT.md` (base `b8a75b0`) + `enterprise-repro5a/b` flames +
  `enterprise-scancensus4` census in the recon worktree.
- Recon facts consumed: S4 `bundleFragments` 11.0 ms warm (21.4 cold service
  start); 2 matches (`theme/global.ts`, `theme/tokens.ts`); kevent 11/11 flame
  wait; fantasy 11 / realistic 5–8; BANK track ≥5 ms + identical bundle bytes.

## 1. Census-first split (TIMED, bench lock, round-robin, 2 warmup + 5 scored)

Fixed enterprise repo (seed-7 templates, fixed dir — esbuild embeds a relative
entry-path comment per module, so pins need fixed dirs), warm service (2 scratch
builds, unscored, discarded — mirrors config-phase warmth). Medians:

| arm | median ms | scored iters |
| --- | --- | --- |
| js-opts-only (`buildMicroBundleOptions` ×2000) | 0.000 | all 0.00 |
| ipc-floor (`esbuild.transform`, bare round trip) | 0.312 | 0.31, 0.41, 0.30, 0.35, 0.31 |
| build-tiny-noplugin (warm, trivial entry) | 4.870 | 4.87, 5.19, 4.37, 5.36, 4.38 |
| build-global-alias (single real file) | 5.597 | 5.48, 5.60, 6.08, 5.44, 6.21 |
| build-tokens-alias (single real file) | 6.054 | 6.05, 6.42, 5.73, 5.63, 6.12 |
| realpath-promiseall (old `bundleFragments`) | 8.213 | 8.21, 8.00, 8.51, 8.90, 8.16 |
| candidate-dual (one 2-entry build) | 5.716 | 6.22, 5.72, 5.37, 5.30, 6.41 |
| DELTA realpath − dual | 2.498 | — |
| cold-first-build (fresh process ×2) | 13.47 / 13.80 | warm-second 4.91 / 5.32 |

Split read:
- JS overhead ~0.000 ms — nil. Bare service IPC ~0.31 ms — small.
- Per-build FIXED cost (warm service, trivial entry, no plugins) ~4.87 ms —
  DOMINANT. This is Go-side graph setup + resolve + transform, not IPC bytes.
- Alias/plugin + real-entry marginal: only ~0.7–1.2 ms over tiny.
- Promise.all overlaps the two builds in the Go service: wall 8.21 <
  5.60+6.05 = 11.65 sequential. The real path already captures ~3.4 ms overlap.
- One dual build ≈ one fixed cost + both marginals (5.72). Removable handle =
  second fixed cost minus already-captured overlap ≈ 2.5 ms.
- Standing falsifier RESOLVED: the 11 ms is not pure service-IPC wait (bare IPC
  is 0.3 ms); it is ~4.9 ms per-build fixed Go cost × 2, overlapped. A reducible
  handle EXISTS (fuse the calls) but measures ~2.5 ms — below the 5 ms floor.

## 2. Diet (one mechanism)

- `microbundle.ts`: new `microBundleMany(entryPaths, options)` — one
  `esbuild.build` with all entry points (`outdir: 'out'` names in-memory outputs
  only; `write: false`, content unaffected), outputs mapped back to entries by
  stem in entry order. Safe fallbacks to verbatim per-file builds on: <2 entries,
  `outfile` set, entry-stem collision, or unmappable outputs. Byte-identity by
  construction (fallback IS the old path).
- `runner.ts` `bundleFragments`: 0/1-file path byte-for-byte unchanged; ≥2 files
  route through `microBundleMany` preserving `[{file, bundle}]` order.
- `index.ts`: export `microBundleMany`. `microBundle`/`microBundleWithResult`
  untouched.
- Rejected without building (fence/contract, not pivots): `transform()` instead
  of `build()` — imports (`@reference-ui/neo` → author entry) must be bundled,
  transform leaves them unresolved = certain byte drift; `esbuild.context`
  incremental rebuild — cross-sync lifecycle, beyond the bundle-call-shape fence.

## 3. Formal 8-pair A/B (TIMED, bench lock, verdict run)

- A = old path verbatim (`Promise.all` of per-file `microBundle`, same options
  object the old `bundleFragments` built); B = diet `bundleFragments`.
- Pin stream (seed-7 enterprise fixed dir), warm service, 2 unscored warmup pairs
  discarded, 8 scored interleaved pairs alternating AB/BA, timed region = bundle
  call only. esbuild 0.28.2, node v24.16.0. Noise disclosed: IDE/browser helper
  processes idle, load ~3.1; no competing bench/samply workers. Zero discards.

| pair | order | A ms | B ms | d (B−A) | ident |
| --- | --- | --- | --- | --- | --- |
| 1 | AB | 9.471 | 6.250 | −3.220 | true |
| 2 | BA | 10.341 | 6.590 | −3.751 | true |
| 3 | AB | 9.311 | 6.430 | −2.881 | true |
| 4 | BA | 8.806 | 5.683 | −3.123 | true |
| 5 | AB | 9.155 | 6.428 | −2.727 | true |
| 6 | BA | 9.010 | 5.514 | −3.496 | true |
| 7 | AB | 9.080 | 5.576 | −3.504 | true |
| 8 | BA | 8.660 | 6.170 | −2.490 | true |

- Medians: A 9.155, B 6.250, d −3.123; ex-run-1 −3.123 (stands); agree 8/8.
- Even the best pair (−3.751) clears only 75% of the −5.00 bar. No straddle.
- Diet-file shas before == after (6c027974b499 / 29002f43d04b / fb20ce374bf0 /
  434a7ca6becc): artifact unchanged mid-set.

## 4. Byte-identity (4 scales + edges + determinism)

Diet `bundleFragments` vs old per-file path, fixed dirs (full-sha compare):

| scale | tokens | global | identical |
| --- | --- | --- | --- |
| small | 9077 B #3a05e4c52174 | 4854 B #fec473005468 | true |
| medium | 12560 B #7586003fd6ad | 4855 B #fee0da9596f3 | true |
| enterprise | 19285 B #76c561eb6392 | 4859 B #48fd7bca232d | true |
| churn | 19280 B #dffa820b462e | 4854 B #960b67a65056 | true |

- Edges: 0 files → `[]`; 1 file → per-file bytes; stem collision across dirs →
  fallback bytes; all identical=true. Diet ×3 determinism identical.
- 8-pair run: ident-all 8/8, determinism-A true, determinism-B true.
- Note: bundle bytes embed a relative entry-path comment, so pins are
  dir-scoped; within any fixed repo, diet == base bit-exactly.

## 5. Suites (aside-compared, deltas enumerated by name — never `git stash`)

| check | diet tree | base tree (diet asided) | delta |
| --- | --- | --- | --- |
| `tsc --noEmit -p packages/reference-neo` | 75 errors | 75 errors | ZERO; 0 in touched files both sides (all pre-existing `@reference-ui/rust/*` unbuilt-module errors) |
| microbundle vitest | 21/21 (4 files) | 14/14 (3 files) | exactly +7 new `microbundle-many.test.ts` tests, all pass; 0 regressions |
| fragments vitest | 48 pass + 5 fail (9 files) | 48 pass + 5 fail (9 files) | ZERO; same 5 `scan-retention.test.ts` failures both sides (`Cannot find package '@reference-ui/rust/atomic'` — unbuilt Rust in fresh worktree, environmental, pre-existing) |

Failing names (identical both sides): star include: provided files equal the disk
scan…; positive plus negation…; negation-only include…; empty-match include…;
match-before-filter… (all 5 in `retention scan differential`).

## 6. Quality

- `pnpm agentneo q` on all 4 touched files: 0 errors, 0 warnings (one initial
  function-lines warning on the test file fixed by splitting describes).
- Repo typecheck: clean on touched files (see §5).

## 7. Verdict + mechanism proof

CUT. The mechanism is REAL and fully proven — one multi-entry `esbuild.build`
replaces two per-call fixed costs (~4.87 ms each, Go-side, warm service) with
one, at bit-identical bytes on 4 scales + edges — but the honest saving on the
real `Promise.all` path is −3.12 ms median (8/8 agree, ex-run-1 −3.12), below
the 5 ms BANK floor. The old path already overlaps the two builds concurrently,
so only the non-overlapped fixed remainder is removable. No second lever exists
inside the bundle-call-shape fence (transform drifts bytes; context caching is
lifecycle). Nothing banked, nothing preserved for integrators beyond this record.

## DX appendix

- `pnpm agentperf show PERF-W4-SCANRECON4` → unknown id (brief-cited entry never
  filed to the index). Workaround: read the recon `REPORT.md` + evidence dirs
  directly. Minutes lost: ~5. Fix proposal: captain files recon entries to the
  perf index at wave open so brief citations resolve.
- No other breakage. Probe scripts live at `/tmp/scan-t2/*.mjs` (asides, not in
  tree): `stage-identity`, `stage-drift`, `census`, `cold`, `identity`, `pairs`.

DIET-VERDICT: CUT below-5ms-floor (-3.12ms median, 8/8 agree, ex-run-1 stands, identity 4/4)
