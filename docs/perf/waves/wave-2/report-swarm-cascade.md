# swarm-cascade REPORT: cascade sort + keys diet (fused scan, rank memo, lazy tiebreak)

## Mechanism (one)

Wave-1 emit (`report-swarm-emit.md`) landed direct-push rule emission and
deliberately left the sort comparator and `CascadeKey::from_atom`
(~14 wt sort + ~7 wt key-build, LOG "stylesheet emission remainder ~20 wt").
This diet attacks exactly that remainder, on top of the landed emit work,
measured against the new base:

1. **Fused condition scan** — `from_atom` walked `atom.conditions()` three
   times (`first_at_rule`, `bucket`, `selector_rank`, each calling
   `cond.wrap()`). One pass (`scan_conditions`) now yields bucket, first
   at-rule wrap, and selector rank together. Same values, one third of the
   `wrap()` calls.
2. **Rank memo** — `property_cascade_rank` (2× `resolve_alias` + 1×
   `find_property` per call, more for shorthands via `has_nested_shorthand`)
   ran once per atom but depends only on `prop`. A per-`write_utilities`
   `FxHashMap<&str, u8>` computes each distinct prop's rank once.
   Enterprise: 23,505 computations → 46 (511×).
3. **Lazy tiebreak** — the comparator used `.then(cmp_whens(...))`, and
   `Ordering::then` takes its argument **eagerly**: `cmp_whens` ran on all
   362,743 comparisons. `.then_with(|| …)` runs it only on the 1,399
   `CascadeKey` ties (259× fewer).

No output change is possible by construction: the fused scan returns the
same triple the three passes did, the memo caches a pure function of `prop`,
and `then_with` is the lazy equivalent of `then`. Stable sort order,
`EscapeCursor` rules, and the `class_name` runtime path are untouched.

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874`
(`git rev-parse HEAD` verified at start; tree = wave-1 landing `0a7330c76`
plus a docs-only filing).

```
packages/reference-rs/modules/atomic/src/stylesheet/cascade/mod.rs | 103 ++++++++++++---------
1 file changed, 59 insertions(+), 44 deletions(-)
```

(`packages/reference-neo/benchmark/reports/latest/*` also shows modified —
live bench byproducts, regenerable, not part of the diet. `dist/*.mjs`
wrappers were missing in the fresh worktree; ran `build:js` once,
gitignored, not in diff.)

## Artifacts

- base `.node`: `6857aac31e646db6759bbcb36617cc9cc259a174927a2b15ba46333798548320`
- cand `.node`: `9ecdfb031b2c40ea33e737bac57b8530ea3bf4aed5ea984a48e954ec10aa9479`
- Arm selection via `REFERENCE_UI_NATIVE_PATH` (sole-candidate override,
  INTEGRATE method — zero swap/rebuild interference).
- Harness never rebuilt mid-set: both `.node` sha256 verified after every
  one of the 26 timed runs (20 enterprise + 6 cross-scale), all ok.
- Counting build (temporary instrumentation, reverted before the clean
  cand build): `64c4bfe437728d0e5c8763bee49753531e382030447e752114e72ae4c15af5e2`.

## Correctness

- (a) `pnpm agentrs c atomic`: **567 + 1 passed, 0 failed**.
  `pnpm agentrs q` on the touched file: **0 code violations**
  (1 warning: `scan_conditions` cognitive 22 — acceptable per wave-1
  precedent, not a violation). No wrappers touched.
- (b) Byte-identical outputs base vs cand on all four scales:

| scale      | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) | css bytes |
| ---------- | ------------------------------ | ------------------------------------ | --------- |
| enterprise | `7ec827fb…10dcea`              | `718d19e4…8918`                      | 2,867,925 |
| small      | `ecdec1e8…a2973`               | `ad9194f4…4d41`                      | 92,651    |
| medium     | `37f2ef5b…19fe`                | `54735e4d…fe7ce`                     | 348,780   |
| churn      | `1aad4978…ec05`                | `e1349305…8cdb`                      | 8,289,806 |

  Full hashes match the wave-1 filed values exactly (same seed, same bytes).
- (c) Determinism: all 16 enterprise kept outputs (8 base + 8 cand runs)
  hash-identical to each other — stronger than ×2.

## Mechanism counts (not just ms)

Temporary counters (`AtomicUsize`, one enterprise run, then reverted):

| count | value |
| ----- | ----- |
| atoms N (`ranked.len()`) | 23,505 |
| `from_atom` calls | 23,505 (= N, by code) |
| rank computations, base | 23,505 (one per atom) |
| rank computations, cand | 46 (unique props; 511×, 23,459 eliminated) |
| comparator invocations | 362,743 (≈ N log2 N = 341k + driftsort overhead) |
| `cmp_whens` calls, base | 362,743 (eager `then`) |
| `cmp_whens` calls, cand | 1,399 (lazy `then_with`; 259×, 361,344 eliminated) |
| condition passes per atom | 3 → 1 (`wrap()` calls 3N → N) |

Theoretical capture: rank memo ~2–3 ms, lazy tiebreak ~1–2 ms, fused
scan ~0.2 ms → **~3–5 ms on a ~20 wt ceiling** (sort 14 + keys 7 per
`enterprise-flame3` inspection: `write_utilities` incl 51 →
`driftsort_main` 14, `from_iter`/`from_atom` 7 with 4 wt
`property_cascade_rank`, sort closure 13 incl / 8 self + 5 wt memcmp).
Even 100% capture (17 ms needed) was out of reach; the achievable ~4 ms
sits far below the 15 ms + 1.5% LAND bar and below the box noise floor
(see pairs).

## Enterprise A/B: 8 interleaved pairs, `.node` per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm first, then
pairs alternating start arm (B/C, C/B, …). Lock held once for the whole
confirm block (~4 min), released immediately after.

Warmups (unscored): base 1437.7, 1201.4; cand 1457.3, 1214.3.

| pair | base syncMs | cand syncMs | Δ ms (cand−base) |
| ---- | ----------- | ----------- | ---------------- |
| 1 (B,C) | 1216.40 | 1214.83 | −1.57 |
| 2 (C,B) | 1225.63 | 1214.13 | −11.50 |
| 3 (B,C) | 1171.01 | 1190.88 | +19.86 |
| 4 (C,B) | 1174.05 | 1181.47 | +7.42 |
| 5 (B,C) | 1184.24 | 1247.53 | +63.29 |
| 6 (C,B) | 1182.10 | 1155.96 | −26.15 |
| 7 (B,C) | 1179.00 | 1155.46 | −23.54 |
| 8 (C,B) | 1183.49 | 1166.22 | −17.27 |

- base median: **1182.79 ms**; cand median: **1186.17 ms**
- median Δ: **+3.38 ms (+0.29%)** — 5/8 pairs favor cand, but the
  p5 cand outlier (+63.3) pulls the cand median above base.
- Excluding run 1: base median 1182.10, cand median 1181.47,
  median Δ **−0.64 ms (−0.05%)** — indistinguishable from zero.
- Median of per-pair deltas: −6.54 ms (reported for completeness;
  arm medians are the verdict metric per the canon protocol).

Pair noise is ±20 ms with a +63 ms outlier; a ~3–5 ms true effect is
unresolvable in 8 pairs. More pairs were considered and rejected: 16
pairs would still leave the signal inside the noise, and 32+ would hog
the shared lock for a sub-bar chase.

Other scales, single samples each (directional only):

| scale  | base syncMs | cand syncMs | Δ         |
| ------ | ----------- | ----------- | --------- |
| small  | 90.35       | 90.66       | +0.31     |
| medium | 167.20      | 170.09      | +2.89     |
| churn  | 2523.81     | 2497.31     | −26.5     |

Churn favors cand (larger N → larger absolute sort/keys share), consistent
with a real but small diet — but single-sample, not a verdict basis.

## Caveats (honest)

- One `cargo test` + `agentrs q` invocation overlapped sibling crews'
  bench window (lock appeared between check and run start); the runs are
  millisecond-scale tests plus an incremental rebuild, no bench was running
  on my side at the time.
- The counting run's syncMs (1563) is instrumented + cold and is not a
  verdict number; it exists only for the mechanism counts above.
- `scan_conditions` carries one quality warning (cognitive 22); 0
  violations. Refactoring to silence it would churn the diff for no
  behavioral gain.

## Verdict

**CUT (no proven enterprise benefit: median Δ +3.38 ms full / −0.64 ms ex-run-1 vs ±20 ms pair noise; ~3–5 ms theoretical on a ~20 wt ceiling cannot clear the bar and cannot be resolved in 8 pairs)**

The diet is sound — byte-identical on 4 scales, deterministic 16/16,
suites green, mechanism counts prove eliminated work (23,459 fewer rank
computations, 361,344 fewer `cmp_whens` calls per enterprise sync) — but
the effect is below the noise floor, so there is nothing to BANK. No
second hypothesis was attempted. Future waves: the remaining sort cost is
362k integer compares + string memcmps with no further redundancy to memo;
LANDing this topic needs a different sort shape (prefix bucketing or
unstable sort with an `important` tiebreaker — both change equal-order
semantics and need their own byte-identity proof), not a bigger memo.
