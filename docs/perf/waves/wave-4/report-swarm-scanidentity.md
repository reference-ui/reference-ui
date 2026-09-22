# scan-T1-identity REPORT: prefix-strip + fused checks diet for splitScan

## Identity

- Base: `0eade4ac14167a094fd0ac12e07378f3c343280d` (verified `git rev-parse HEAD`
  first act; tree clean at start).
- Release `.node`: `cec0a71aa3171cefdfac62d08cbbc729713a36fb94f7a4c61d71c2a1740a8ceb`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`, 8,889,408 B),
  sha-verified before AND after the verdict set (stable). `build:js` ran once
  (missing in fresh worktree; gitignored), same as recon.
- End state: `M packages/reference-neo/src/fragments/lib/scanner.ts` (+145/−6) +
  `?? packages/reference-neo/src/fragments/lib/scanner-identity.test.ts` +
  this REPORT.md. No other files. No commits. No LOG writes. No stash (asides only).

## Grounding (index-first; fences honored)

- `agentperf search` before scoping: PERF-W2-COLLECT [BANK] (native matcher /
  union walk is LANDED ground — the diet never touches the native matcher or
  the walk: candidates still come from the same `fg.sync`, reads unchanged);
  PERF-W2-SHOT2 [KILL] (no sound pre-open skip exists — the diet reads every
  file exactly as before; identity-only, zero skip logic added); PERF-W4-SCANRECON4
  (the wave-4 recon: `SCANRECON` has 0 index hits — the recon REPORT is filed in
  the sibling worktree and not yet absorbed by `agentperf rebuild`, so it is
  cited from the filed REPORT.md + `enterprise-repro5a/b` + `enterprise-scancensus4`
  bundles read in place; nothing re-litigated).
- Seam/napi/marshal untouched: retention stores the same `{path, content}` refs
  (`candidates[index]` verbatim, same contents array) — marshal-neutral by
  construction. Serial order kept (same loop, same pushes). T2-bundle CUT (−3.12)
  is disjoint ground (runner/bundle) — no interaction.

## Hypothesis (one only)

- Where: `packages/reference-neo/src/fragments/lib/scanner.ts` `splitScan`.
- Diet: one-time `resolve(cwd)+sep` prefix; per file `startsWith` → fused
  single-pass suffix walk (dot/ignore/extension/declaration gates, zero rel-string
  alloc, zero splits) over the absolute path; non-prefix hits and anomalous
  suffixes (empty/`.`/`..`/empty segment) fall back to the exact old
  `relative()`+helpers path with identical selection.
- Removed per file on the strip path: `relative()` (resolve+normalize),
  2 `split(sep)` + 1 `slice`, `extname` scan, rel-string alloc, split/slice arrays.
  Kept: 1 fused walk + needle `includes` + regex + retention alloc.

## Standing falsifier FIRST (probe before diet)

`/tmp/scan-t1/edge-probe.mjs` — shipped-shape verbatim mirror vs exact old path:

- 15,122/15,122 real enterprise candidates take the strip path, 0 anomalies,
  suffix `== relative()` string-exact on all 15,122.
- Edge battery: out-of-cwd, sibling-prefix traps (`/a/src` vs `/a/src2/x.ts`),
  `abs==cwd`, dir forms, trailing-slash/dot-dot/root/symlinked cwds, dotfiles,
  d.ts case variants, extname adversaries (`.ts`, `..ts`, `a.`, `...`, `..`, `.`,
  `.TS`, `.mts`, `.map`, extensionless), all 9 IGNORE dirs as dir vs file vs
  near-miss (`distx`, `Dist`, `node_module`), unnormalized abs (`//`, `/./`,
  `/../`, trailing `/`), unicode, spaces, 40-deep, 200-char names.
- Result: 15,837 checks, **0 mismatches**. Falsifier survived — diet built.

## Census-first (S5 pattern, real arrays, warm medians ×7, unlocked staging)

| component | ms |
|---|---|
| `relative()` ×15,122 | 7.72 |
| dot `split`+some | 3.06 |
| `.d.ts` endsWith | 0.26 |
| ignore `split`+slice+some | 3.24 |
| `extname`+slice+has | 1.20 |
| needle `includes` ×75,602 | 1.27 |
| retention push ×15,122 | 0.38 |
| old full (verbatim S5) | 15.31 |
| diet full (strip+fused+same includes/retention) | 4.17 |

Counts: matchable 15,122, includes 75,602, needle hits 2, regex ~2, matches 2,
retained 15,122 — matches recon §6 (75,600/2/2/15,122). Counted warm ceiling:
15.31 − 4.17 ≈ **11.1 ms**. Ablations (walk only): slice+Set 1.58 vs manual
switch-compare 0.99 vs shipped loop-table 1.28 — shipped shape keeps the Sets as
single source of truth (derived table) at near-fastest speed.

## Verdict set (bench-locked 8-pair, whole-sync worker, frozen seed-7 repo)

Protocol: lock grabbed/released two-step, no contention; 2 unscored warmups
(861.1/889.0); 8 interleaved pairs, alternating lead arm; pin stream (same
`/tmp/scan-t1/repo-ent` all runs); scanner arm sha-verified per swap;
`.node` sha stable before+after; diet left installed and verified.

| pair | lead | base syncMs | diet syncMs | Δ sync | base scan | diet scan |
|---|---|---|---|---|---|---|
| 1 | base | 867.18 | 854.44 | −12.74 | 294.73 | 278.93 |
| 2 | diet | 858.32 | 846.09 | −12.23 | 289.30 | 283.84 |
| 3 | base | 867.53 | 839.80 | −27.73 | 287.65 | 279.54 |
| 4 | diet | 863.04 | 848.40 | −14.64 | 288.59 | 273.50 |
| 5 | base | 856.70 | 839.06 | −17.64 | 286.25 | 272.52 |
| 6 | diet | 855.35 | 839.32 | −16.03 | 287.11 | 271.64 |
| 7 | base | 859.56 | 836.54 | −23.02 | 288.26 | 270.93 |
| 8 | diet | 859.21 | 840.89 | −18.32 | 286.91 | 276.27 |

- Whole-sync: baseMed 859.38, dietMed 840.35, **Δ −16.84 ms / −1.96%**,
  ex-run-1 **−17.64 / −2.05%**, 8/8 agree negative.
- Bar: ≥15 ms AND ≥1.5% — **clears on both full-8 and ex-run-1**.
- Phase decomposition (diet−base medians): scan **−14.40**, compile **−3.78**
  (7/8 agree — GC knock-on from ~60k+ removed short-lived allocs/file-scan),
  config +0.20, evaluate −0.09, publish +0.58, residual +0.08 (noise).
  SyncTotal −16.84 ≈ scan −14.40 + compile −3.78 + smalls (closes).
- S3 support pairs (fresh process, real module): baseMed 232.78, dietMed
  218.34, **Δ −15.05** (ex-run-1 −15.37), 8/8 agree, identity 2/15,122 every run.
- Disclosures: pair 3 carries a base-side compile outlier (−17.2 in compile)
  — kept counted, medians are robust (drop-3 changes nothing: ex-run-1 clears
  harder). Absolute level on this box (~860) sits below recon's instrumented
  ~950–984 with ZERO code delta between the bases (2 docs commits only;
  `git diff --stat` empty) — uninstrumented runs on hot state vs shimmed
  census/sampled flames; the % denominator is the measured 859.38 (bar: 12.89).

## Identity (4-scale, real module, order-exact, untimed)

Base vs diet arms, sha16 of NUL-joined matches / retention paths / retention
contents (no sorting), diet run twice per scale for determinism:

| scale | matches | retained | bytes | identical | deterministic |
|---|---|---|---|---|---|
| small | 2 | 308 | 141,283 | yes | yes |
| medium | 2 | 1,276 | 577,001 | yes | yes |
| enterprise | 2 | 15,122 | 5,874,046 | yes | yes |
| churn | 2 | 6,122 | 7,775,500 | yes | yes |

4/4 byte-identical (all three hashes per scale), 4/4 deterministic.

## Suites (stash-compared via file asides, delta by name)

- Neo vitest, diet arm: **32 files / 242 tests pass** (incl. new
  `scanner-identity.test.ts` 3/3 and native C3 differential
  `scan-retention.test.ts` 5/5).
- Neo vitest, base arm (only `scanner.ts` swapped, test file stays):
  **32 files / 242 tests pass**; per-file name diff base-vs-diet: **identical
  32/32 — delta zero**.
- Hand-derived goldens in the new test were validated against BASE first
  (3/3 green before the diet ran them) — regression lock, not pasted output.
- Playwright: **17/17 NEO-SYNC cases PASS** on the diet (01–17 incl. 02).
- `agentneo run` typecheck gate passes (runs refuse on red types).

## Quality

- `pnpm agentneo q` on both touched files: **0 errors**; 2 non-failing warns,
  both on `classifyScanSuffix` (cyclomatic 12 = at the fail line, passes;
  cognitive 16) — inherent to the single fused pass, which IS the mechanism
  (splitting the pass to quiet non-failing warns would slow the diet).
- `tsc -p packages/reference-neo/tsconfig.json --noEmit`: clean, exit 0.
- No `any`, no suppressions, header intact, import boundary clean.

## Mechanism proof (why the ms moved)

1. Census removes exactly the counted parts: resolve+normalize+splits+ext
   (~11.1 warm) shrink to one fused walk (~1.3); includes/retention kept.
2. In-worker scan phase moves −14.40 (recon's ~1.3µs/call × 15,122 ≈ 19.7ms
   unit figure reconciles: colder resolve + alloc pressure exceed the warm
   census — expected direction).
3. Whole-sync moves −16.84 = scan −14.40 + compile GC knock-on −3.78 + noise;
   S3 moves −15.05 independently. Three harnesses agree on ~15±2.

## DX appendix

1. `pnpm agentrs build` on the fresh worktree failed `tsx not found /
   node_modules missing` — needed `pnpm install` first (protocol line was
   right). ~2 min. Fix: `agentrs build` should pre-check node_modules and say
   so plainly instead of surfacing pnpm's recursive-exec error.
2. Worker died `ERR_MODULE_NOT_FOUND dist/namer.mjs` — needed
   `pnpm --dir packages/reference-rs run build:js` (recon hit the same).
   ~2 min. Fix: `ensure-native` should also ensure `build:js`, or the worker
   import chain should hint it.
3. `vitest run --reporter=basic` is not a vitest 4 reporter (module-load
   stack). Used the default reporter + grep. ~3 min. Fix: none (my flag error).
4. `verdict.mjs` shipped a syntax error (`base ScannerSha`) — caught by
   `node --check` before the lock was ever grabbed; zero contention. ~2 min.

DIET-VERDICT: LAND -16.84ms/-1.96%
