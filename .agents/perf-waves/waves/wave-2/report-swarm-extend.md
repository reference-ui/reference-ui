# swarm-extend REPORT: extend-path serial diet (ladder allocs)

## Mechanism (one)

`ValueGraph::resolve_file_imports` (44 wt) is one `HashMap::collect` whose
`Extend` frame (42 wt) is pure per-import resolution, not insertion:
`resolve_binding` 38 wt + `value_of` 4 wt. The 38 wt walks every import
through `BindingWalk::follow_edge → follow_specifier → SpecifierLadder::resolve`
(35 wt), and on the seed-7 load that ladder work is an all-miss bare-specifier
grind: 3,562 bare resolutions × 9 ancestor levels × (tsconfig joins, node_modules
joins, package-dir joins, `@types` fallback joins) plus 6,684 `ancestors` Vecs
and 67,338 `ModuleKey::new` normalizations — every probe missing, every string
thrown away. Flame chain (enterprise-flame3, compile scope):
`resolve_file_imports` 44 = `extend` 42 + `ModuleKey::new` 2;
`extend` 42 = `resolve_binding` 38 + `value_of` 4;
`resolve_binding` 38 = `follow_edge` 35 + `String::clone` 2 + `edge_of` 1;
`resolve` 37 = `package_hit` 12 + `format_inner` 7 + `try_fold` 7 +
`types_package_name` 5 + `ancestors` 3 + `ModuleKey::new` 2 + `probe_hit` 1
(pre-wave-1 profile; wave-1 reserve has since converted the formats to
exact-capacity joins — this diet builds on that base).

Diet (caches exactly as they are; probe sequences identical):
1. `ModuleKey::new` fast path (`key.rs`): already-normal paths (no backslash,
   dot/empty segments, trailing slash) return one copy instead of a replaced
   scan plus a component walk plus a second copy. The predicate can only
   decline to the slow walk, never corrupt.
2. Zero-alloc ancestor cursor (`key.rs`): `ancestors_iter` yields the exact
   old sequence (dir-to-root, `/` for absolutes incl. the `"/" → ["/","/"]`
   quirk, 32-cap) as borrowed slices; callers walk off the borrowed
   `dir_str` instead of owned `dir()` strings plus a `Vec<String>`.
3. Ladder scratch buffers (`ladder/mod.rs`): `node_hit` regrows one `roots`
   and one package-dir buffer across levels instead of joining per probe;
   the loop-invariant `@types` fallback request builds once per call instead
   of per level; `find_tsconfig` regrows one candidate path across levels.
   Every return still owns its string, so buffer reuse is sound.

Deliberately NOT built (each killed by an exact count, §Mechanism counts):
per-file `collect()` capacity (maps hold ≤1 entry), borrowed origins lookup
(2.9% hits), empty-imports early return (0 len-0 calls), manifest parsing
(0/0 calls — swarm-manifest CUT ground reproduced), `strip_runtime_ext`
(906 calls — swarm-modgraph CUT ground reproduced exactly, untouched),
`value_of` hit clones (inherent dual ownership), memo hashing (swarm-hashers
ground, excluded).

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874` (`git rev-parse HEAD`
verified at start; perf base wave-1 landing `0a7330c76` plus docs-only filing).

```
.../modules/module-graph/src/key.rs         | 200 +++++++++++++++++++--
.../modules/module-graph/src/ladder/mod.rs  |  70 +++++---
2 files changed, 232 insertions(+), 38 deletions(-)
```

Notes:
- `dist/*.mjs` wrappers were missing in the fresh worktree; ran `build:js`
  once for bench harness resolution (gitignored, not in diff).
- `pnpm install` (store-backed, 7 s) likewise outside the diff.
- New unit tests live inline in `key.rs` (`#[cfg(test)] mod tests`): predicate
  table (21 arms), dir-borrow equivalence, ancestor sequences, depth cap.

## Artifacts

- base `.node`: `535ba2900e04956dc4bff7102fa5e08941370539985684f4002a06440d9189d0`
- cand `.node`: `736d6779cde3a00d02707924aba0d07f8e020ebe6f6c03c2b5098ae585c1dbb9`
- Harness never rebuilt mid-set: `.node` swapped per arm, sha256 verified
  identical before AND after every one of 28 timed/identity runs.

## Correctness

- (a) `cargo test -p module_graph`: 16/16 suites green (lib 6 incl. 4 new
  key tests; integration incl. ladder_exports/fields/relative/remap/symlink/
  tsconfig/types, walk_chains/refused/star, key/fs/graph/record — 109 passed,
  0 failed). `cargo test -p atomic --lib`: 567 passed, 0 failed.
  `pnpm agentrs q` on both touched files: 0 violations, 0 warnings.
  Clippy: zero NEW warnings (one `direct_hit` needless-borrow and the
  memo-test borrows are pre-existing on untouched lines). `cargo fmt --check`:
  touched files clean (only pre-existing `benches/ladder.rs` diffs remain).
- (b) Byte-identical outputs base vs cand on all four scales:

| scale      | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| ---------- | ------------------------------ | ------------------------------------ |
| enterprise | `7ec827fb…10dcea`              | `718d19e4…8918`                      |
| small      | `ecdec1e8…a2973`               | `ad9194f4…4d41`                      |
| medium     | `37f2ef5b…19fe`                | `54735e4d…fe7ce`                     |
| churn      | `1aad4978…ec05`                | `e1349305…8cdb`                      |

  Full 64-char hashes verified; prefixes shown. All four match the wave-1
  filed canonical hashes exactly.
- (c) Determinism: all 8 candidate enterprise A/B runs (plus all 8 base runs,
  4 warmups, and 8 identity runs — 28/28 kept repos) produced identical
  output hashes per scale.

## Resolver semantics (memo protocol untouched, cycle/refusal identical)

- Memo-cache semantics: zero changes to `ProbeMemo`/`memo.rs`, to
  `ValueGraph`'s `origins`/`valued`/`refined`/`refining`/`valuing`, to
  `BindingWalk`'s cache/visited, or to `resolve_file_imports` traversal
  order. The diet touches only per-call locals: key normalization cost,
  ancestor-string materialization, and probe-path join allocation.
- Probe-sequence identity: `ancestors_iter` yields the old `ancestors`
  sequence exactly (table-tested incl. root quirk and 32-cap); per level the
  ladder probes the same paths in the same order with the `@types` fallback
  in the same position. Same memo keys → same hits/misses → same outcomes.
- Cycle/refusal paths: `value_of`/`refined_file` chases, `ensure` staging,
  `record_copy`, and all `Refused` construction are untouched. The existing
  differential corpus is green: module_graph `walk_chains`/`walk_refused`/
  `walk_star` (cycles, star clashes, missing exports, namespace/default
  refusals) and atomic's resolver staging differential (force-unstage vs
  census vs full incl. the tsconfig-aliased true miss and the nested-import
  arm). Bare (3,562, all miss), relative (906, all hit), refused, cycled,
  and missing shapes all resolve byte-identically per §Correctness (b).

## Mechanism counts (exact instrumented census, seed-7 enterprise load)

One env-gated instrumented run (temporary counters, reverted before the
diet; single compile, `compile_calls` 1). Every number below is an exact
counter, cross-checked (`origins_hit+miss` = 4,028 top-level + 119 origin
refs; `ancestors_calls` = 2×3,122 Follow-policy + 440 Skip-policy, the 440
extra bare calls are styletrace's ladder).

| counter | count | meaning |
| --- | --- | --- |
| `rfi_calls` | 3,122 | `resolve_file_imports` calls (files) |
| `rfi_len` 0/1/2/3+ | 0/2,216/906/0 | imports per file → maps hold ≤1 entry |
| `origins` hit/miss | 119 / 4,028 | 2.9% hits (origin re-resolves only) |
| `valued` hit/miss | 787 / 119 | 906 `value_of` calls (relative hits only) |
| `refined` ready/cycling/external/retained/streamed | 0/0/0/119/0 | `valued` memo shadows `refined` (ready 0 expected) |
| `collect_origin` / `origin_refs` | 119 / 119 | 119 of 120 recipes refined |
| `identity_trace` / `identity_terminal` | 908 / 908 | bindings-identity path (out of mechanism) |
| `walk_resolve_binding` / `walk_follow_specifier` | 4,028 / 4,028 | one walk per origins miss, one edge each |
| `ladder` relative/bare/miss | 906 / 3,562 / 0 | bare = 3,122 atomic + 440 styletrace |
| `find_tsconfig` / `tsconfig_hit_some` | 3,122 / 0 | atomic bare only; never hits (no tsconfig) |
| `node_hit` / `node_levels` | 3,562 / 32,056 | 9.0 levels per bare call |
| `package_hit` / `isdir_miss` | 64,112 / 64,112 | all miss (no node_modules) |
| `manifest_export` / `manifest_root` | 0 / 0 | manifest CUT ground reproduced |
| `probe_hit` / `probe_base` / `probe_runtime` | 906 / 906 / 0 | relative hits only |
| `strip_calls` | 906 | modgraph CUT ground reproduced exactly |
| `memo` file/dir/text/canon hit/miss | 787/119, 64000/112, 28056/40, 0/0 | misses memoized; joins rebuilt per call |
| `key_new` | 67,338 | `ModuleKey::new` calls compile-wide |
| `ancestors` calls / depth-sum | 6,684 / 60,152 | 9.0 entries per call |

Derived structural savings (exact constructions removed by the diet;
scratch-buffer regrowth residuals estimated, not counted):
ancestors 6,684 Vecs + ~73k Strings → 0 alloc; `roots` joins 32,056 →
~18k growth; `pkg_dir` joins 64,112 → ~18k growth; fallback constructions
64,112 → 7,124; tsconfig-path joins 28,096 → ~16k growth; `ModuleKey::new`
67,338 × (replace-alloc + component walk) → 1 copy + scan. Net ≈ 290k
alloc-ops + 67k path walks removed per enterprise sync.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm
(B 1190.49/1179.68, C 1158.98/1166.56). Pair order alternated.
Lock held once for clippy+builds+identity+A/B, released right after.

| pair | base syncMs | cand syncMs | Δ ms   | Δ %    | order |
| ---- | ----------- | ----------- | ------ | ------ | ----- |
| 1    | 1183.41     | 1180.93     | +2.49  | +0.21% | B,C   |
| 2    | 1183.74     | 1161.43     | +22.31 | +1.88% | C,B   |
| 3    | 1167.55     | 1163.62     | +3.92  | +0.34% | B,C   |
| 4    | 1171.73     | 1165.26     | +6.46  | +0.55% | C,B   |
| 5    | 1178.44     | 1171.22     | +7.21  | +0.61% | B,C   |
| 6    | 1193.58     | 1152.49     | +41.09 | +3.44% | C,B   |
| 7    | 1167.82     | 1168.98     | −1.16  | −0.10% | B,C   |
| 8    | 1115.98     | 1167.65     | −51.67 | −4.63% | C,B   |

- base median: **1175.08 ms**; cand median: **1166.46 ms**
- median Δ: **+8.63 ms (+0.73%)**, 6/8 pairs favor candidate.
- Excluding run 1: medians 1171.73 vs 1165.26, Δ **+6.46 (+0.55%)** —
  verdict stands favoring candidate.
- Paired median +5.19; means +3.83/+0.33%.
- Note: pair 8 base (1115.98) is a fast outlier of the bimodal-machine kind
  wave-1 reserve documented; even excluding pair 8 instead, Δ is
  +13.18/+1.12% — still sub-bar on both prongs. BANK is robust to the cut.

Other scales, single samples each (directional only, high noise at small N):

| scale  | base syncMs | cand syncMs | Δ          |
| ------ | ----------- | ----------- | ---------- |
| small  | 149.66      | 90.73       | −58.9 (−39%) |
| medium | 224.61      | 163.35      | −61.3 (−27%) |
| churn  | 2520.01     | 2435.93     | −84.1 (−3.3%) |

Caveat (same as canon's): small/medium single-sample deltas exceed what the
ladder cluster can explain and carry startup/scan noise; reported for
completeness, not claimed. Enterprise medians are the verdict metric.

## Collision (§Collision for the captain)

- swarm-hashers (DIRECTLY adjacent): their mechanism is hasher choice over
  hashbrown-insert 29 wt + the extend edge; mine is alloc diet over the same
  edge's per-call locals. Disjoint mechanisms, no coordination per RACE RULE.
  If they touch `ladder/*`/`key.rs` or the origins/valued maps, the overlap
  is textual, not mechanical — first sound LAND wins.
- swarm-modgraph (modgraph remainder): same files possible (`key.rs`,
  `ladder/*`). My diff: `key.rs` (normalize fast path, ancestors iterator,
  `dir_str`, tests) + `ladder/mod.rs` (`node_hit`/`package_hit`/
  `find_tsconfig` plumbing). Any same-function diff needs integrator merge.
- swarm-realloc: built ON their landed wave-1 joins (`join_with`/`concat2`
  retained for cold paths: manifest path, `direct_hit`, probe candidates);
  my buffers only replace hot per-level joins. No conflict.
- CUT grounds honored, both reproduced exactly and untouched:
  `manifest_root`/`manifest_export` 0/0 (swarm-manifest), `strip_calls` 906
  (swarm-modgraph).

## Verdict

**BANK (delta +8.63 ms / +0.73% medians, +6.46/+0.55% ex-run-1; sub-bar
proven-identical diet with exact mechanism counts, 4/4 byte-identity,
determinism ×8, suites green, q clean)**
