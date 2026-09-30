# REPORT-STPERF-benchent: TIMED bench:neo enterprise guard (base vs each diet + sum)

One line: on the enterprise bench load all three diets + sum read **null** (rc −1.6, cow +8.4, alloc +6.4, sum +4.5 ms on ~960 ms; 6/8, 3/8, 1/8, 4/8) — the guard passes as **no-regression**, and the null is mechanistically grounded: the instrumented binary emits 500 stperf session lines on the scratch lib world vs **0** on the enterprise bench world through the same `sync()`. The diet surface (tracer `load_module` / `bind_type_params` / `resolve_*`) is never entered on this load. Wave-2's hash identity is extended: the sum arm (never hashed in wave-2) reproduces the enterprise pins byte-for-byte.

## Liveness (why null is the correct read, not a dead swap)

- Instrumented binary `/tmp/stperf-instrumented.node` sha
  `dffb9563…` (verified; == in-tree dist binary) emits
  `{"tag":"stperf"}` lines to stderr unconditionally, ~1/session
  (500 lines / 499 sessions on scratch, `counts3-run1.stderr.log`).
- Bench children inherit stderr (`measure/child.ts`: stdio
  `['ignore','pipe','inherit']`), so a live tracer would surface.
- Enterprise bench + instrumented binary via
  `REFERENCE_UI_NATIVE_PATH`: **0 stperf lines**, exit 0
  (`/tmp/benchent-livecheck2.err`, 0 bytes). Same `sync()`
  (`src/sync/index.ts`) as the scratch probe; only the world differs.
- Swap path itself is proven live: worker → `sync()` →
  `compileNative` → `@reference-ui/rust/atomic` → loader honors
  `REFERENCE_UI_NATIVE_PATH` (`loader.ts:117-118`); the timed sets
  below ran all 80 syncs through env-swapped arms with per-run sha
  discipline. A dead swap and an unexercised surface both read ~0 —
  the 500-vs-0 census is what separates them.

## 8-pairs (lock-held, pin stream, warmups unscored)

Harness `/tmp/stperf-benchent.mjs`: per-set lock grab/release ×4
(clean two-step; no losses), `taskpolicy -a -d default -t 0 -l 0`
(mission recipe — `pnpm agent run` SIGPIPEs per WAVE2-COUNTS),
alternating order, no `--seed` (pin stream: seed 7; all 80 runs
cssCalls=7527, cssBytes=2867977, dataBytes=214596 — bit-constant
load). Scored metric: `samples[0].syncMs` (wall around `sync()`
only; generation excluded). Sha-verified before AND after all 80
timed + 4 ident runs; arms never rebuilt mid-set. Uptime 21 days
all sets. Foreign procs observed, never touched (user `dev:lib`,
playwright-mcp, Chrome).

Base `.node` `5cbffe78…`; rc `485c3957…`; cow `650b25d4…`; alloc
`1cbb16ff…`; sum `/tmp/stperf-full.node` `f9c6af85…` (full
rc+cow+alloc stack — `stperf-full-stack.diff` carries all three).

| diet | base med | cand med | Δ ms | favor | pairedMed | exRun1 | dCompile | load |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rc | 961.7 | 960.0 | −1.6 | 6/8 | −2.4 | −2.4 | +2.0 | 1.43→2.58 |
| cow | 956.6 | 965.0 | +8.4 | 3/8 | +3.9 | +3.9 | +3.6 | 2.58→2.52 |
| alloc | 967.3 | 973.7 | +6.4 | 1/8 | +14.9 | +14.9 | +8.1 | 2.52→3.06 |
| sum | 960.4 | 964.9 | +4.5 | 4/8 | −0.2 | +7.4 | +3.9 | 3.06→2.17 |

Pair deltas (cand−base, ms):
- rc: −0,−11,−3,−20,−3,+29,+16,−2 (wu 951,970 / 969,962)
- cow: +9,−3,+19,−1,−6,+1,+21,+7 (wu 953,974 / 958,949)
- alloc: +75,+52,−24,+17,+2,+15,+15,+8 (wu 962,973 / 966,969)
- sum: −29,−2,−12,−4,+13,+1,+24,+19 (wu 961,970 / 983,965)

All |Δ| ≤ 0.9% of ~960 ms — rig noise. Nothing discarded.

Alloc pairs 1–2 (+75/+52) disclosure: kept in every estimator (no
cherry-picking). They are transient machine noise, not a diet
effect: (a) cand warmups immediately before were normal (966/969 —
cold-page-cache ruled out); (b) alternating order means the spikes
hit only the cand legs of those two moments; (c) the sum arm, which
CONTAINS the alloc diet, reads paired-median −0.2 on the same
load — a real +15 ms alloc effect would appear in the sum. The
alloc set also ran under the highest rising load (→3.06).

## Identity (vs-wave2 note)

- Wave-2 (`stperf-scales.jsonl`, `--runs 1`, hashes only):
  enterprise base/rc/cow/alloc all css `a46e3e33…` /
  data `3bee4d35…` — 4/4 identical. The sum arm was never hashed.
- This guard: base re-hash reproduces BOTH wave-2 pins exactly
  (pin stream stable, no code/plan drift), and the sum arm hashes
  **identical to base** (`/tmp/stperf-benchent-ident.jsonl`):
  css `a46e3e334408846cc863ba7fba62e7cfb290475f99ad71a504ed4cbf7a8d16a1`,
  data `3bee4d3578c35128cfeef2c8c710f33a961f4fd15137ed543945a7c99fe83258`.
- So: wave-2 identity (4 arms, untimed) → now timed (4 sets, null
  = no-regression) + identity extended to the sum (5 arms).

## Agreement with integrator scratch sum (prior result 1)

Recomputed from `/tmp/stperf-ab-int-*.jsonl` (scratch lib world,
499 tracer sessions): sum base 1846.5 → full 1066, Δ **−780.5**,
8/8, paired −777.0; LOO alloc −123.5 (8/8), LOO rc −628.5 (8/8),
LOO cow +3.0 (4/8). In-stack parts ≈ sum (628.5+123.5−3 ≈ 749
vs 780.5 — additive within noise).

No contradiction with the enterprise null (+4.5, 4/8): different
loads — the scratch world drives 499 tracer sessions/sync where
the diets remove counted clones; the bench world drives 0. The
scratch 8-pairs remain the speedup proof; the enterprise timed
guard proves the diets perturb nothing where the surface is cold.

## Verdict

**GUARD PASS** — no-regression on enterprise bench (all arms
|Δ|<1%, bundle bytes constant all 80 runs, sum identity 5/5).
No LAND/BANK claim is made or implied by these numbers; speedup
claims rest on the scratch sets + integrator sum-confirm.

## Hygiene

- Scratch worlds only: bench `mkdtemp` worlds (+`--keep` dirs,
  removed after hashing). Never synced in packages/reference-lib.
- `benchmark/reports/latest` snapshotted before set 1, restored
  byte-identical after (`diff -r` clean; M-vs-HEAD drift there is
  pre-existing, from earlier crews' bench runs).
- In-tree dist binary untouched (`dffb9563…` before/after).
- No commits (none in mission tree, none on main). Other crews'
  filings observed during the run (perf-index, styletrace-perf
  wave dir, stack flames) — not touched.
- Full logs: `/tmp/stperf-benchent-{rc,cow,alloc,sum}.jsonl`
  (per-run syncMs/rss/genMs/bundle/phases + shas + uptimes),
  `/tmp/stperf-benchent-ident.jsonl`, rig `/tmp/stperf-benchent.mjs`.
