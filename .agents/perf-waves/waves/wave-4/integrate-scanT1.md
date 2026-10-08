# scan-INT-T1 INTEGRATE: wave-4 T1 LAND-claim adjudication (judge + prove)

## Identity

- Integrator base pin: `1f71f3711e116ac0541fc0e5bac0f5a93f8d53c9` (verified
  `git rev-parse HEAD` first act; tree clean at start).
- Member record: T1 `REPORT.md` + `git diff` read in place at worktree
  `...-01a0c92b-e1f6-73f0-83e4-01f6c46c8f10` (member base `0eade4ac1`,
  diet = `scanner.ts` +145/−6 + new `scanner-identity.test.ts`). Member
  worktree untouched (read-only; never copied, never stashed).
- Integrator tree end state: `M packages/reference-neo/src/fragments/lib/scanner.ts`
  (+145/−6) + `?? .../scanner-identity.test.ts` + this INTEGRATE.md. No other
  files. No commits, no pushes, no LOG writes. No `git stash` anywhere (file
  asides only; the two `git stash list` entries present are pre-existing
  foreign stashes, untouched).
- Integrator `.node`: `c0dd6ddcf4a96ba76a46edfc60d6aa78ffc56e411a7ea31be8cd206f720e8c30`
  (`dist/native/virtual-native.darwin-x64.node`, 8,889,408 B — byte-size
  identical to member's; sha differs by worktree-path embedding, sources
  proven identical per §1). Sha-verified before AND after the verdict set
  (stable). `build:js` present (`dist/namer.mjs`).

## Reproduction (merge re-applied per the filed record, then proven)

- Re-applied all 3 hunks by hand into the integrator tree (import `resolve`;
  suffix-walk block after `isDeclarationFile`; `splitScan` loop rewrite) and
  created `scanner-identity.test.ts` verbatim (170 lines).
- Proof: integrator `git diff` body is **byte-identical** to the member diff
  (`diff` empty, including the `index` line — pre/post blobs identical);
  `git diff --stat` +145/−6 exactly as filed; post-image
  `scanner.ts` sha `013ac3db…` == member's; test-file sha `802ad7a0…` == member's.

## 1. Collision checklist (file:line evidence)

1. **same-function-twice — CLEAN.** `git log --oneline 0eade4ac1..1f71f371 -- packages/reference-neo/src/fragments/lib/scanner.ts`
   is EMPTY (3 commits in range, all docs/voyage: `46c81719d`, `7ce9478fd`,
   `1f71f3711`). `git diff 0eade4ac1..1f71f371 -- <scanner.ts>` is 0 lines;
   member-base blob sha == integrator-tree pre-image sha (`a982822f…`).
   Full base-to-base delta is 37 files, ALL docs/evidence/viz/perf-index/LOG —
   zero files under `packages/`, `pipeline/`, or `matrix/`. `splitScan`
   (`scanner.ts:183`, pre-image `:183-206`) untouched between bases.
2. **shared-state/ordering vs T2-bundle CUT — DISJOINT, no interaction.**
   T2 ground (filed `docs/perf/waves/wave-4/report-swarm-scanbundle.md` §Identity+§2):
   `fragments/lib/runner.ts` `bundleFragments` (`runner.ts:23-38`) +
   `lib/microbundle/microbundle.ts` (new `microBundleMany`) + `lib/microbundle/index.ts`
   (export) + new `microbundle-many.test.ts`. T1 ground: `fragments/lib/scanner.ts`
   (`splitScan` + pure helpers) + `scanner-identity.test.ts`. Zero file overlap.
   Call-graph: `runPlanner` calls `scanForFragments` (`runner.ts:103`), then bundles
   per file (`runner.ts:117-121`) — strictly sequential scan-then-bundle; T2's diet
   consumes only the opaque matches array, whose contract T1 preserves (same loop,
   same pushes, `scanner.ts` hunk 3). No shared mutable state (T1 adds only module
   consts + pure functions). Moot in any case: T2 verdict is CUT, it will not land.
3. **regen/tests carried over — enumerated by name.** Exactly one file,
   `packages/reference-neo/src/fragments/lib/scanner-identity.test.ts`, 3 tests,
   all passing on BOTH arms (hand-derived goldens validated against base first):
   `scanner identity pins the tricky-tree match and retention sets`;
   `scanner identity is invariant under cwd spelling (trailing slash, dot-dot)`;
   `scanner identity falls back exactly for absolute out-of-cwd globs`.
4. **soundness re-verification — 15,837 checks, 0 mismatches on MY tree.**
   `/tmp/scan-int-t1/iedge-probe.mjs` (integrator authorship): diet + baseline
   extracted MECHANICALLY (source slices of the sha-verified tree file, never a
   hand mirror; aborts unless tree == diet aside) vs exact old path over
   15,122 real pinned-repo candidates + 715 edge vectors (out-of-cwd,
   sibling-prefix traps `/a/src` vs `/a/src2/x.ts`, `abs==cwd`, dir forms,
   trailing-slash/dot-dot/root/symlinked cwds, dotfiles, d.ts case variants,
   extname adversaries, all 9 IGNORE dirs as dir/file/near-miss, unnormalized
   abs, unicode, spaces, 40-deep, 200-char names). Result: 15,122/15,122 real
   take the strip path, 0 anomalies, suffix string-exact on all 15,122,
   **0 mismatches / 15,837 checked** (count reproduces the filed shape exactly).
   Disclosure: first probe run reported 15,541 mismatches from a PROBE typo
   (`!hasSourceExtension` in the probe's own baseline composer — the diet arm
   read `[true,true]`, the true value); caught by impossible-baseline inspection,
   fixed, re-run clean. The diet was never implicated.

## 2. Confirm protocol

**(a) Suites, three-arm file-aside comparison (never `git stash`).**
Neo vitest JSON inventoried per test (file :: fullName :: status), sorted:

| arm | tree | files | tests |
|---|---|---|---|
| P pristine | HEAD scanner, test asided | 31 | 239 pass, 0 fail |
| B base+test | HEAD scanner + carried-over test | 32 | 242 pass, 0 fail |
| D diet | reproduced diet + test | 32 | 242 pass, 0 fail |

- P→D delta is EXACTLY the 3 carried-over tests (§1.3), all passing.
- B↔D per-test-name diff is byte-identical (242/242 lines) — zero regressions;
  goldens green on base before the diet ran them. Native C3 differential
  `scan-retention.test.ts` 5/5 green in the diet arm.

**(b) Quality — 0 errors; warn reading verified firsthand; tsc clean.**
`pnpm agentneo q` on both touched files: **0 errors, 2 warnings**, both on
`classifyScanSuffix` (`scanner.ts:203`): cyclomatic 12 (warn above 8; the gate
reports 12 as WARN, exit 0 — "at the fail line, passes" confirmed) and cognitive
16 (warn line 12, fail line 20 — non-failing). Gate spec read firsthand at
`.agents/skills/agent-neo/SKILL.md:113-117` (fail 12/20/5/120/500/4;
warn 8/12/4/80/365). `tsc -p packages/reference-neo/tsconfig.json --noEmit`:
clean, exit 0. No `any`, no suppressions.

**(c) Confirmatory whole-sync 8-pair on the REPRODUCED merge — BAR CLEARS.**
`/tmp/scan-int-t1/iverdict.mjs` (integrator authorship): bench lock grabbed/
released two-step, no contention; 2 unscored warmups (2756.5 BASE-first cold —
module/esbuild/native cold start, correctly discarded — / 832.8 diet); pin
stream `/tmp/scan-t1/repo-ent` all runs; 8 interleaved pairs alternating lead
arm; scanner arm sha-verified per swap; `.node` sha stable before+after
(`c0dd6ddc…`); diet left installed and verified. Load at grab ~3.8/3.0/2.9,
no competing bench workers; zero discards.

| pair | lead | base syncMs | diet syncMs | Δ sync | base scan | diet scan |
|---|---|---|---|---|---|---|
| 1 | base | 851.99 | 838.26 | −13.74 | 285.99 | 268.23 |
| 2 | diet | 852.86 | 843.18 | −9.68 | 284.12 | 269.76 |
| 3 | base | 854.37 | 840.53 | −13.84 | 285.47 | 267.46 |
| 4 | diet | 855.15 | 831.81 | −23.33 | 283.29 | 266.36 |
| 5 | base | 852.25 | 832.61 | −19.64 | 285.76 | 270.09 |
| 6 | diet | 859.76 | 836.43 | −23.33 | 285.29 | 270.68 |
| 7 | base | 854.70 | 848.48 | −6.22 | 290.99 | 272.25 |
| 8 | diet | 855.13 | 838.87 | −16.27 | 281.83 | 265.12 |

- Whole-sync: baseMed 854.54, dietMed 838.56, **Δ −15.05 ms / −1.76%**,
  ex-run-1 **−16.27 / −1.90%**, 8/8 agree negative.
- Bar ≥15 ms AND ≥1.5%: **clears on full-8 (−15.05, −1.76%) and ex-run-1
  (−16.27, −1.90%)**. Margin on the ms bar is thin (0.05 ms) — disclosed;
  the pre-registered statistic clears, ex-run-1 clears harder, and two
  independent harnesses clear with margin (below). No re-run (sets are
  reported as run; never cherry-picked).
- Phase decomposition (paired medians): scan **−16.82** carries the whole gain
  (config −0.16, evaluate +0.01, compile +0.17, publish +0.53; phases sum
  −15.83 vs sync −15.05 — closes). Compile is flat this run (member saw −3.78
  GC knock-on): the pure scan mechanism alone clears the bar — the cleaner read.
- S3 support (real module, identity guard 2/15,122 all 16 runs): baseMed 230.44,
  dietMed 214.46, **Δ −17.32** (ex-run-1 −15.29), 8/8 agree.
- Member comparison: filed −16.84/−1.96% ex1 −17.64/−2.05% at base level 859.38;
  integrator −15.05/−1.76% ex1 −16.27/−1.90% at base level 854.54. Same direction,
  same order, both clear; level shift is box noise (member disclosed the same
  sensitivity). Absolute repo state post-member-runs is shared fairly: interleaved
  pairs + alternating lead control any monotonic drift.

**(d) Enterprise-scale identity re-proof — 4/4 byte-exact, order-exact.**
Base vs diet arms via the real integrator-tree module, sha16 of NUL-joined
matches / retention paths / retention contents (no sorting), diet run twice
per scale:

| scale | matches | retained | identical | deterministic |
|---|---|---|---|---|
| small | 2 | 308 | yes | yes |
| medium | 2 | 1,276 | yes | yes |
| enterprise | 2 | 15,122 | yes | yes |
| churn | 2 | 6,122 | yes | yes |

Counts reproduce the filed table exactly. 4/4 identical (all three hashes per
scale), 4/4 deterministic.

## Bench-lock accounting

One timed block held this session: confirmatory 8-pair (`mkdir` grab + owner
file `scan-INT-T1 confirmatory 8-pair (whole-sync + S3)`, per-iteration
ownership checks, two-step release). No other timed blocks (edge battery,
identity, suites untimed). Never killed foreign PIDs. Whole sets reported;
zero discards anywhere.

## Claims

`PROGRESS scan-INT-T1 START` + lock-HELD + 8-pair-COMPLETE filed to
`/tmp/swarm-claims.md` during the run; FINISH filed on completion.

## What was NOT done

- No diet modifications of any kind (judge + prove only; nothing needed fixing).
- Playwright 17/17 NEO-SYNC cases not re-run (outside the integrator protocol
  (a)–(d); member's 17/17 stands on the byte-identical diet, and the
  confirmatory whole-sync 8-pair exercises the same sync path on the reproduced
  tree, as do the 242 green vitest tests).
- No census/ablation re-runs (mechanism already triangulated: scan phase −16.82,
  S3 −17.32, whole-sync −15.05 — three harnesses agree).
- No commits, pushes, LOG writes, or perf-index filings (integrator leaves the
  reproduced diet uncommitted for the landing crew; member worktree preserved).
- No T2 work (CUT, disjoint, will not land — §1.2 only confirms non-interaction).

INTEGRATE-VERDICT: LAND
