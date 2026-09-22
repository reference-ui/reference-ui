# swarm-canon2 REPORT: no-alloc case-insensitive matching in value classify

## Mechanism (one)

`canon::css::values::classify_css_value` runs per declaration value (harvest
`classify_harvest_value` plus the token-resolve fence, `tokens/mod.rs:139,175`),
and every miss paid **two** `String` allocations: `is_named_color` and
`is_css_keyword` each ran `text.to_ascii_lowercase()` before an exact table
search. Paren-values paid a third in `classify_function` (`name` lowering).
Wave-1 islen proved the shape on `is_length` (one alloc → −16 ms); this is the
remainder of that alloc shape in the same chain, on top of landed `0a7330c76`.

Fix, three call sites of one mechanism (fold case during the search instead of
lowering per call):

- `named_colors.rs::is_named_color`: `binary_search` → `binary_search_by` with
  the shared `cmp_lower_probe` comparator (values/mod.rs), which folds input
  bytes on the fly — exactly the order `to_ascii_lowercase()` byte-compares
  in, so the lowercase-sorted 150-entry table decides identically.
- `classify.rs::is_css_keyword`: lowercase-then-search → `eq_ignore_ascii_case`
  over the unchanged 7-entry table (single source of truth, no arm drift).
- `functions.rs::function_kind`: takes the raw name, same `binary_search_by`
  comparator over the five unchanged kind tables.

No table changed, no decision can change: ASCII-only folds coincide on both
sides, non-ASCII bytes pass through unfolded in old and new code alike.

Deliberately untouched (other mechanisms / rare paths): `has_non_length_unit`
(allocs only on Length-valued words), `is_css_color_keyword` (token-resolve
cluster), `find_property` PHF/match dispatch (different mechanism, future work).

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874` (`git rev-parse HEAD`
verified at start; `packages/` tree identical to wave-1 landing `0a7330c76`).

```
.../modules/canon/src/css/values/classify.rs       | 26 ++++++++++-
.../modules/canon/src/css/values/functions.rs      | 53 ++++++++++++++++++----
.../modules/canon/src/css/values/mod.rs            | 24 ++++++++++
.../modules/canon/src/css/values/named_colors.rs   | 15 ++++--
4 files changed, 105 insertions(+), 13 deletions(-)
```

Notes:

- All four files are hand-written (no `@generated` marker): no regen step
  exists for them, so no emitter drift question arises.
- `dist/*.mjs` wrappers were missing in the fresh worktree; ran `build:js`
  once for bench harness resolution (gitignored, not in diff).
- Temp differential/alloc-count test (`canon/tests/wave2_canon2_diff.rs`)
  removed after its run; bench-touched `reports/latest/*` restored — final
  tree diff is the four files above. Permanent member-contract tests
  (every table entry matches in lower/UPPER/Mixed case) live next to the
  tables.

## Artifacts

- base `.node`: `4d031856a28c11cd83baf94ad06c783ac736b6252cdfecdfe0e63d5b924e35c6`
- cand `.node`: `be527e5283ac6fc1bb7e1e286edf61582ca10a2e3877aa807733266795ce7e6e`
- Base built from the stashed (clean `5844b24a8`) tree; stash round-trip
  verified byte-identical against a pre-stash `git diff` backup, pre-existing
  stashes untouched. Arm selection via `REFERENCE_UI_NATIVE_PATH` (loader's
  sole-candidate override, no rebuild interference).
- Harness never rebuilt mid-set: both `.node` sha256 verified identical
  before/after all timed runs (`sha256sum -c` OK).

## Correctness (rule 1)

- (a) `pnpm agentrs c canon`: 58 passed, 0 failed (55 pre-existing + 3 new
  contract tests); `pnpm agentrs c atomic` (consumer): 567+1 passed, 0 failed.
  `pnpm agentrs q` on the touched dir: green, zero code violations.
- (b) Byte-identical outputs base vs cand on all four scales (full sha256
  match; byte counts match the landed base exactly: 183681 / 459021 /
  3082391 / 8393515 total):

| scale      | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| ---------- | ------------------------------ | ------------------------------------ |
| enterprise | `7ec827fb0c0c…05e10dcea`       | `718d19e47017…b7378918`              |
| small      | `ecdec1e80f8e…b5bda2973`       | `ad9194f41181…72994d41`              |
| medium     | `37f2ef5b43f8…840d94819fe`     | `54735e4d5a51…a108cfe7ce`            |
| churn      | `1aad4978ffdc…a80deb10ec05`    | `e134930586eb…f70103f18cdb`          |

- (c) Determinism: candidate enterprise run twice → identical css+rtm hashes.

## Mechanism counts (not just ms)

Criterion `canon/benches/classify.rs`, prebuilt base/cand binaries, same lock
hold, `--bench` flag (a first attempt ran test-mode without it; rescored under
a second hold — A/B unaffected):

| bench              | base      | cand     | delta         |
| ------------------ | --------- | -------- | ------------- |
| classify/length    | 126.39 ns | 60.64 ns | −65.8 ns (−52%) |
| classify/color_hex | 10.63 ns  | 9.84 ns  | −0.8 ns (−7%) |
| classify/color_named | 59.92 ns | 20.41 ns | −39.5 ns (−66%) |
| classify/color_fn  | 50.75 ns  | 25.28 ns | −25.5 ns (−50%) |
| classify/keyword   | 94.19 ns  | 22.64 ns | −71.6 ns (−76%) |
| classify/var       | 78.65 ns  | 40.75 ns | −37.9 ns (−48%) |
| classify/miss      | 132.17 ns | 67.12 ns | −65.1 ns (−49%) |
| classify/miss_token | 160.45 ns | 81.42 ns | −79.0 ns (−49%) |
| classify/mixed (9v) | 839.62 ns | 401.07 ns | −438.6 ns (−52%) |

Differential corpus (temporary test, since removed): 756 inputs (all 150
colors + all 40 function names + all 7 keywords × lower/UPPER/Mixed, plus
near-misses, token paths, unicode/whitespace/padding adversaries) —
**zero divergences** old vs new on all three functions. Allocation count
(counting global allocator, single-threaded): old = 493 (colors) + 48
(keywords) over the corpora, new = **0** on all 756 (incl. whole
`classify_css_value` calls).

Call volume: `classify_css_value` fires per declaration value in harvest plus
twice per token path in the resolve fence — every one of those calls paid the
two String allocs before, zero now.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm first (base 1465.1,
1326.5; cand 1169.8, 1145.9), then 8 pairs alternating lead order.
Lock held once for the timed set, released immediately after.

| pair | order | base syncMs | cand syncMs | Δ ms    | Δ %     |
| ---- | ----- | ----------- | ----------- | ------- | ------- |
| 1    | B,C   | 1259.55     | 1119.23     | −140.31 | −11.1%  |
| 2    | C,B   | 1124.87     | 1125.33     | +0.46   | +0.0%   |
| 3    | B,C   | 1193.67     | 1131.07     | −62.60  | −5.2%   |
| 4    | C,B   | 1131.84     | 1121.87     | −9.97   | −0.9%   |
| 5    | B,C   | 1118.51     | 1137.01     | +18.49  | +1.7%   |
| 6    | C,B   | 1148.58     | 1137.35     | −11.23  | −1.0%   |
| 7    | B,C   | 1145.62     | 1115.74     | −29.89  | −2.6%   |
| 8    | C,B   | 1148.33     | 1116.06     | −32.27  | −2.8%   |

- base median: **1146.97 ms**; cand median: **1123.60 ms**
- median Δ: **−23.37 ms (−2.04%)**, 6/8 pairs favor candidate.
- Excluding run 1: base 1145.62, cand 1125.33 → **−20.29 ms (−1.77%)** —
  verdict stands.
- Median per-pair delta: −20.56 (all 8), −11.23 (run 1 excluded) — same
  direction, noisier statistic; the median-of-medians is the verdict metric
  per wave-1 precedent.

Honest noise notes: the base arm is much noisier (range 141 ms, incl. the
pair-1 outlier) than the candidate arm (range 22 ms); pair 5 inverts (+18.5)
and pair 2 is flat. No lead/lag pattern (B-first vs B-second splits show no
systematic ordering effect), and every mechanism count (criterion −52% mixed,
zero allocs, zero divergences) points the same way.

Process notes: one small-scale smoke run accidentally overlapped another
crew's lock hold (my check and run shared one command; disclosed, not
repeated — all later holds used check-then-act). The first criterion attempt
ran in test mode (direct binary invocation needs `--bench`); rescored under a
second brief hold with prebuilt binaries. Neither affects the A/B above.

## Verdict

**LAND (delta −23.4 ms + −2.04% full, −20.3 ms + −1.77% run-1-excluded; rules 1–3 green)**
