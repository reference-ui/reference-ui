# swarm-selpush REPORT: selector-push string diet (cursor runs + nest alloc/scan diet)

## Verdict

**BANK (proven-identical diet, sub-bar by construction: 12wt ceiling bars LAND at 100% fantasy; 8-pair median Δ −1.76 ms/−0.16% full, −4.13/−0.39% ex-run-1 — effect below the pair-noise floor, mechanism counts prove the eliminated work)**

## Base / artifacts

- Base commit: `810b8b5b47448b4b99b688d9c2fda94c3ec9658e` (verified `git rev-parse HEAD` first command; wave-2 set-1 landing)
- Base `.node` sha256: `3038abdab08b985390861282ece105de95e8c0d0a110a41a2b1700ce636f9758`
- Candidate `.node` sha256: `66e63114fe5fe71e54d63a967aa7cdfe67f9ceb5a66ba369c1b7d9fb80b8dc9e`
- Both binaries `cp`-saved aside (`/tmp/swarm-selpush/base.node`, `/tmp/swarm-selpush/cand.node`); arms selected via `REFERENCE_UI_NATIVE_PATH` (zero swap/rebuild interference, cascade INTEGRATE method)
- Harness never rebuilt mid-set: both `.node` sha256 verified after every one of the 26 timed runs (20 enterprise + 6 cross-scale), all ok
- Counting builds (temporary instrumentation, fully reverted): separate `.node` files, never scored
- Fresh worktree lacked `dist/*.mjs` wrappers → `build:js` ran once (gitignored, not in diff)

```
git diff --stat
 .../resolve/conditions/pseudoselectors/nesting.rs  | 107 ++++++++++++-------
 .../modules/atomic/src/stylesheet/name/escape.rs   | 116 ++++++++++++++++++++-
 .../modules/atomic/src/stylesheet/name/mod.rs      |  11 +-
 3 files changed, 202 insertions(+), 32 deletions(-)
```

## 1. Mechanism (ONE): per-atom selector-emission string diet

Re-seed #2 from the post-landing re-profile: `push_selector_with_system`, 12wt incl (wave-1 emit's function, unworked). The `--inspect` split on both repro bundles led from the entry to its callee:

| frame | repro1 | repro2 |
| --- | --- | --- |
| `push_selector_with_system` incl (self) | 12 (1) | 11 (1) |
| ↳ `nesting::nest` incl (self) | 8 (2) | 8 (3) |
| ↳ ↳ `split_selector_list` | 4 | 3 |
| ↳ ↳ `member_needs_is_wrap` | — | 3 |
| ↳ ↳ malloc/free/join | 3 | — |
| ↳ `push_selector_base` incl (self) | 4 (1) | 2 (—) |
| ↳ ↳ `class_prefix_for_prop` (canon, NOT dieted) | 2 | — |
| ↳ ↳ `EscapeCursor::push_char` | 1 | — |

Two-thirds of the ceiling sits in `nest()` internals, not the escape loop. Same push path, same hypothesis (no pivot — counts led here). Four sub-parts, all byte-exact by construction, **zero order changes** (sortshape bar: sort, comparator, `CascadeKey`, grouping untouched — `cascade/mod.rs` and `emitter/mod.rs` are not in this diff):

1. **D1 — EscapeCursor run scan** (`name/escape.rs`): leading char keeps the slow path (the rule keys off index 0 only); the rest moves in `push_str` ident-body runs; sanitized whitespace maps to `_`; escape takes and non-ASCII keep the per-char rule. `append_escaped`, `push_hex_escape`, `is_ident_body` untouched — EscapeCursor rules preserved exactly.
2. **N1 — nest() comma-free fast path** (`nesting.rs`): no `,` bytes on either side ⟹ both sides are single trimmed members ⟹ one `nest_member_into`, no splits, no vecs, no join. Comma-carrying sides keep the original split + parent-major loop with `, ` separators (join-equivalent). Empty sides return `""` exactly as before.
3. **N2 — push-direct members** (`nesting.rs`): `nest_member_into` / `reorder_pseudo_element_into` / `substitute_into` push into one result `String`. Kills per-pair `String`, the `:is()`/`to_owned` substitution temporary, and the join alloc+copy. Same push order, same bytes.
4. **N3 — predicate diet** (`nesting.rs`): reorder gated on `parent.contains("::")` (necessary condition — no `::` bytes ⟹ the trailing scan cannot find a pair; the slow check runs whenever the gate passes, never weakened); `substitution_needs_wrap` evaluates the member multi-amp predicate before the parent combinator scan (pure predicates, `&&` commutes — same boolean, short-circuits the parent scan).
5. **D3 — nested base pre-size** (`name/mod.rs`): `String::with_capacity` from exact pieces (system, segments, prop/value lens) plus escape slack. Capacity only.

Deliberately untouched: `class_prefix_for_prop` per-atom canon lookups (2wt — swarm-callermemo's caller-side-memo ground; RACE RULE respected, see §Collision); `nest()` branching logic (no behavior change, only allocation/scan shape); recipe `IndexMap` (hashers' banked hunk). D2 (system-prefix format-once, ~0.7 ms incremental over D1, would thread through landed `cascade/mod.rs`) was considered and SKIPPED — filed as a lead below.

## 2. Mechanism counts (seed-7 enterprise load)

Temporary `AtomicUsize` census (5 files, fully reverted before the cand build). Base counters bit-identical across 5 runs and 2 binaries; extended nest counters identical ×2:

| count | value |
| --- | --- |
| atoms N (`push_selector_with_system` calls) | 23,505 (= cascade's N ✓) |
| nested atoms (selector condition) | 11,002 (46.8%) |
| unconditioned atoms | 6,093 |
| `has_selector_condition` iters / sel hits | 17,412 / 11,002 |
| cond segments pushed / bytes | 23,962 / 113,560 |
| system bytes pushed (`bench-enterprise__`, all atoms) | 423,090 (49% of utilities cursor chars) |
| prefix bytes / value bytes / `!` | 132,321 / 146,432 / 0 |
| `nest()` calls (utilities / recipe) | 14,228 / 2,859 = 17,087 |
| nest parent bytes / template bytes / base bytes | 756,635 / 500,152 / 483,260 |
| nest calls with >1 parent or >1 member | **0** (all 17,087 are 1×1) |
| nest calls comma-free both sides (N1a hit) | 2,260 |
| `nest_member` no-amp arm / reorder hits / multi-amp | **0 / 0 / 0** (all 17,087 substitute, single-`&`) |
| reorder attempts (all wasted scans) | 17,087 |
| `member_needs_is_wrap` true / `:is()` hits | 622 / 0 |
| EscapeCursor chars (utilities 862,870 + recipe/layers ~352k) | 1,214,911 |
| backslash takes / hex takes / WS sanitizations | 29,072 / 0 / 0 |
| `write_utilities` calls per sync | 1 |

Eliminated work per enterprise sync: 17,087 × (2 split vecs + per-pair `String` + substitution `String` + join alloc/copy) → 1 result `String`; 34,174 wasted reorder scans gated to a `::` byte check; ~17k parent combinator scans short-circuited by the predicate swap; 2,260 × 2 split machines skipped by the comma byte check; 1.21M chars moved from per-char push to run scans; 11,002 nested bases pre-sized (~44B avg, was `String::new`).

Ceiling math: 12wt incl bars LAND at 100% fantasy (12 < 15 ms and < ~16 ms = 1.5% of ~1073) — BANK is the ceiling verdict. Realistic capture ~50–60% ≈ 5–7 ms (nest ~4–5.5 + cursor ~1–1.5), below the ±10–17 ms pair-noise floor: BANK on mechanism, cascade/keys2/parse precedent.

## 3. Correctness

- (a) `pnpm agentrs c atomic`: **572 + 1 passed, 0 failed** (includes 2 new pin tests: cursor runs across pushes incl. empty-first/leading-digit/sanitize/non-ASCII; nest fast/slow trim/empty/comma-in-parens agreement). `pnpm agentrs q` on the 3 touched files: **0 code violations**, 1 warning (`nesting.rs` 397 lines > 365 soft limit — accepted with rationale: one cohesive walker family plus its pins; a split would churn the diff for no behavioral gain; cascade-22 precedent). My files rustfmt-clean (tree-wide fmt drift elsewhere is pre-existing, untouched). Wrappers untouched → seam vitest not required (emit precedent).
- (b) `styles.css` + `runtime-data.mjs` **byte-identical (full sha256) base-vs-candidate on all four scales**:

| scale | styles.css (both arms) | runtime-data.mjs (both arms) | cssCalls |
| --- | --- | --- | --- |
| enterprise | `7ec827fb…10dcea` | `718d19e4…8918` | 7527 |
| small | `ecdec1e8…a2973` | `ad9194f4…4d41` | 171 |
| medium | `37f2ef5b…19fe` | `54735e4d…fe7ce` | 635 |
| churn | `1aad4978…ec05` | `e1349305…8cdb` | 43956 |

Full hashes match the wave-1 filed values exactly (same seed, same bytes). Churn (43,956 calls) exercises the diet across the widest nesting-shape distribution.
- (c) Determinism: all 20 enterprise kept outputs (4 warmups + 16 pair runs, both arms) hash-identical — stronger than ×2.

## 4. Enterprise A/B: 8 interleaved pairs, `.node` per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample = `scales[0].samples[0].syncMs`. 2 unscored warmups per arm, then pairs alternating start arm (B/C, C/B, …). Lock held once for the whole verify+A/B block, released immediately after.

Warmups (unscored): base 1082.46, 1058.75; cand 1234.94, 1068.75. (One earlier base smoke run, 1317.5, while probing kept-output paths — unscored, disclosed.)

| pair | base syncMs | cand syncMs | Δ ms (cand−base) |
| ---- | ----------- | ----------- | ---------------- |
| 1 (B,C) | 1055.13 | 1057.13 | +2.00 |
| 2 (C,B) | 1061.07 | 1064.38 | +3.31 |
| 3 (B,C) | 1071.06 | 1069.19 | −1.86 |
| 4 (C,B) | 1070.01 | 1072.71 | +2.70 |
| 5 (B,C) | 1065.13 | 1077.33 | +12.20 |
| 6 (C,B) | 1075.27 | 1065.88 | −9.39 |
| 7 (B,C) | 1060.46 | 1065.74 | +5.28 |
| 8 (C,B) | 1079.25 | 1062.04 | −17.21 |

- base median: **1067.57 ms**; cand median: **1065.81 ms**
- median Δ: **−1.76 ms (−0.16%)**, 3/8 pairs favor cand
- Excluding run 1: base median 1070.01, cand median 1065.88, median Δ **−4.13 ms (−0.39%)**
- Median of per-pair deltas: +2.35 ms (reported for completeness; arm medians are the verdict metric)

Pair noise is ±17 ms; the ~5–7 ms realistic effect is unresolvable in 8 pairs, and the estimators disagree in sign — a textbook below-noise-floor diet. More pairs were considered and rejected: 16+ pairs would hog the shared lock chasing a sub-bar signal (cascade precedent).

Other scales, single samples each (directional only — identity hashes above are the claim, times are not): small 89.35→94.80, medium 164.87→170.40, churn 2414.95→2332.65 (churn favors cand; N-scaling-consistent but single-sample — explicitly disclaimed, scalarjson-style).

## 5. Caveats (honest)

- The stopwatch does not resolve the diet (medians −1.8/−4.1 vs ±17 noise; median-of-deltas +2.35). The BANK rests on mechanism counts (17,087 nests dieted, 1.21M chars re-pathed, 34k wasted scans gated) + 4-scale byte-identity + green suites — the cascade/keys2/parse BANK shape, not a timing claim.
- `nesting.rs` carries the one quality warning (397 lines); 0 violations. Refactoring to silence it would churn the diff for no behavioral gain.
- Two lock holds: count block (install + base/count builds + 5 count runs + `--inspect` queries) and verify+A/B block (q + cargo + cand build + 26 timed runs). No foreign-process interaction of any kind.
- `WARM-C1` (1234.9) is a first-run warmup outlier on the cand arm, absorbed by the 2-warmup discipline.

## 6. Collision (for the captain)

- TEXTUAL: diet touches `stylesheet/name/escape.rs`, `stylesheet/name/mod.rs`, `resolve/conditions/pseudoselectors/nesting.rs`. Mechanical grep over filed set-1/set-2 patches: **no file overlap** with `hashers.patch` (60 files; their emitter hunk is the recipe-`groups` IndexMap type + import), `parse.patch` (12 files), `keys2.patch`, `diag.patch`, `canon2.patch`, or landed `cascade.patch` (`cascade/mod.rs` untouched — census hooks there fully reverted).
- BEHAVIORAL: recipe path shares `nest()` (`recipe_selector`, 2,859 calls) — same-bytes improvement, no conflict; set-2 integrator re-verifies as usual. `split_selector_list`, `member_needs_is_wrap`, `SelectorScan` semantics untouched (mod.rs not in diff); `apply`/`apply_distributed` callers unaffected.
- RACE respected: `class_prefix_for_prop` (2wt, 23,505 calls, one per atom) deliberately NOT memoized — caller-side canon memo is swarm-callermemo's live ground. My diet needs no canon change.
- LEAD filed (not taken): D2 system-prefix format-once (~0.7 ms incremental over D1; 423k redundant system chars escape identically every atom) needs a `SelectorPrefix` threaded through landed `write_groups`/`write_group`/`write_rule` — skipped to keep `cascade/mod.rs` untouched. A future crew can take it with a byte-identity proof.
- sortshape bar honored: NO order changes anywhere — no sort/comparator/bucketing/grouping edits; `nest()` preserves parent-major member order and exact separator bytes.

## Verdict

**BANK (proven-identical selector-push diet: 12wt ceiling bars LAND by construction; 8-pair median Δ −1.76 ms/−0.16% full, −4.13/−0.39% ex-run-1, below the noise floor; byte-identical 4/4 scales + 20/20 determinism + 572+1 green + q 0 violations; mechanism counts prove the eliminated work)**
