# swarm-programsfx REPORT: parse-new `programs` maps std→Fx (intset2 deferred tail)

## Mechanism (one)

Parse (set-1 LANDED) built NEW `programs` maps keyed by source position
(`identity`) and path (`trace`) so the identity walk and the styletrace
entry re-parse reuse main-phase programs instead of re-parsing bytes.
Those maps postdate hashers' banked audit, so intset2 deliberately left
them `HashMap` (integrate-set2.md §2 + §What-was-NOT-done). This change
converts exactly those maps to `FxHashMap` — pure 1–3-line type swaps,
no logic, capacity, or API-shape change, mirroring hashers' banked
method. No memo added; every converted site already hashed on the bench
path (9,485 counted ops, §Census).

## Diff

Base pin: `3dd32a659715aeb17d5d04167d756fb7f5ce30c8` (post set-3 tip,
`git rev-parse HEAD` verified at start; tree clean then).

```
7 files changed, 24 insertions(+), 25 deletions(-)
```

- `atomic/src/extract/identity.rs` — field `:47` + params `:60`/`:68`
  `HashMap<usize,&Program>` → `FxHashMap`; std import dropped
  (Fx already imported).
- `atomic/src/lib.rs` — `reuse_programs` `:436-440` return/constructors
  → `FxHashMap::default()`; import unioned onto existing
  `rustc_hash::{FxHashMap, FxHashSet}`.
- `atomic/src/hosts/mod.rs` — empty local `:55` → `FxHashMap::default()`,
  `resolve` param `:75` → `&FxHashMap<PathBuf,&Program>`.
- `styletrace/.../surface.rs` — `TraceSources.programs` `:118` field type,
  hint-path empty local `:158`.
- `styletrace/.../tests/owned_props.rs` — locals `:56`/`:221`/`:263`/`:296`
  (forced fallout: feed `TraceSources.programs`).
- `styletrace/.../tests/trace_gate.rs` — local `:40` (forced fallout).
- `atomic/src/extract/identity_tests.rs` — local `:368` (forced fallout:
  feeds `with_programs`; EXTRA site from repo-wide grep, not in brief).

NO-EDIT (audited, no declaration): `styletrace/.../parser/mod.rs`
(reads via `sources.programs.get(path)` `:64` only; its `HashMap` import
serves `ParseState.exports`, which stays).

## Per-site iteration audit (order-observed iteration bars conversion)

Repo-wide grep for `\.programs` method calls + `HashMap<(usize|PathBuf),
&Program` declarations + all `TraceSources{}`/`with_programs`/`resolve`
construction sites. Type chain is closed: 8 declaration sites, all
converted or fenced; every read is below.

| # | site | shape | ops observed (code) | iteration? | verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | identity.rs `programs` field+params | `Option<&FxHashMap<usize,&Program>>` | single `.get(&position)` `:299` | none | CONVERT |
| 2 | lib.rs `reuse_programs` | builds both maps, insert-only; loop iterates `retained`, not the maps | consumers borrow `:219`/`:234` | none | CONVERT |
| 3 | hosts/mod.rs `:55`+`:75` | empty map → `resolve` param → `TraceSources` passthrough | none | none | CONVERT |
| 4 | surface.rs `TraceSources.programs` | field + hint-path empty local | read via `.get` (parser/mod.rs:64) | none | CONVERT |
| 5 | parser/mod.rs:64 | read-only | `.get(path)` per `parse_trace_module` call | none | NO-EDIT |
| 6 | owned_props.rs test locals | feed `TraceSources` | insert/collect-only | none | CONVERT (fallout) |
| 7 | trace_gate.rs test local | feeds `TraceSources` | empty | none | CONVERT (fallout) |
| 8 | identity_tests.rs test local | feeds `with_programs` | insert-only | none | CONVERT (fallout) |
| F1 | resolver/mod.rs:96 `programs` | ALREADY `FxHashMap` (hashers LANDED) | — | — | CITE, no touch |
| F2 | model.exports / ParseState.exports | `RandomState` STANDS: analyzer.rs iterates `exports.keys()` into walk order → diagnostics push order | ORDER-OBSERVED | stays std |

Sortshape bar: zero order changes possible — no converted map is
iterated anywhere, so the hasher swap cannot shift any iteration order.
`collect_hosts` (hosts/mod.rs:55) and the hint path (surface.rs:158)
construct EMPTY maps; converting them is forced type-chain fallout
(intset2 precedent: reuse-test staged map), not a traffic conversion.

## Op census (seed-7 enterprise, instrumented, env-gated ×2)

`SWARM_PROGRAMSFX_CENSUS`-gated `eprintln` at the 3 production sites
(build sizes in `reuse_programs`, hit/miss per `parse_position` /
`parse_trace_module` call); patch applied for count runs only, reverted
after with `git diff` verified byte-identical to the asided diet.
Two runs, sorted-line sha `6c1364e17cf86f6c` BOTH → identical.

| site | inserts | gets (hit/miss) | iters |
| --- | --- | --- | --- |
| identity map (lib.rs build + identity.rs:299) | 3,122 | 119 / 0 | 0 (no code path) |
| trace map (lib.rs build + parser/mod.rs:64) | 3,122 | 3,122 / 0 | 0 (no code path) |
| **total** | **6,244** | **3,241 / 0** | **0** |

3,242 lines/run. Every production site has measured traffic — no
carve-out needed. 3,122 vs parse's 3,123 retained = 1 panicked position
(excluded from both maps); 0 errored; 0 fallbacks on this load.
Count-run outputs hashed the sealed enterprise pins (census did not
perturb bytes). Fantasy ≈ 9,485 ops × ~35ns ≈ **0.33 ms** — disclosed
below both solo bars (same shape as the five banked micro-diets; the
brief's BANK conditions list no solo-ms threshold, and LAND is not
claimed). CUT-counter: pushstring's 0.1–0.3 CUT was unbuilt (no diet
existed); here the diet exists, is implemented, and removes 9,485
counted SipHash ops with byte-identical outputs.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. Base `.node` `c24603be…`, cand `.node`
`69e0ae7b…` (distinct; sha256 verified before AND after the set, zero
mismatches; neither rebuilt mid-set; dist `.node` moved aside +
bogus-path proven to fail hard with sole-candidate `Searched paths:`).
css/data bytes exact (2867925/214466) on all 20 runs.

Warmups (unscored): base 1183.49, 999.57; cand 1195.68, 1003.31.

| pair | base syncMs | cand syncMs | Δ ms | Δ % | order |
| --- | --- | --- | --- | --- | --- |
| 1 | 1012.74 | 1009.43 | −3.31 | −0.33% | B,C |
| 2 | 1019.80 | 1007.34 | −12.47 | −1.22% | C,B |
| 3 | 1007.09 | 1007.97 | +0.87 | +0.09% | B,C |
| 4 | 1007.52 | 1015.39 | +7.87 | +0.78% | C,B |
| 5 | 1018.32 | 998.90 | −19.42 | −1.91% | B,C |
| 6 | 1004.24 | 1001.78 | −2.45 | −0.24% | C,B |
| 7 | 1003.37 | 994.96 | −8.41 | −0.84% | B,C |
| 8 | 1015.01 | 1021.01 | +5.99 | +0.59% | C,B |

- Base median 1010.13; cand median 1007.65; median Δ **−2.48 ms
  (−0.25%)**, **5/8 favor**.
- Ex-run-1: Δ **−0.18 ms** — does not stand alone (honest sub-noise).
- Median of pair deltas: **−2.88**.
- Read: two estimators ≈ −2.5…−2.9, ex-run-1 ≈ 0 — the honest
  below-noise shape for a ~0.3 ms mechanism (sysprefix/marshal
  precedent). No second set per cascade precedent.

## Byte-identity vs sealed pins (4-scale)

Base vs cand `cmp`-identical **8/8 files**; every hash matches the
filed wave-1 pins (enterprise full-64 verified character-for-character;
small/medium/churn 16-char + bytes vs filed).

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` full-64 ✓ (2,867,925 B) | `718d19e4…378918` full-64 ✓ (214,466 B) |
| small | `ecdec1e80f8e71a8` (92,651 B) | `ad9194f41181aaee` (91,030 B) |
| medium | `37f2ef5b43f8b7cb` (348,780 B) | `54735e4d5a51c567` (110,241 B) |
| churn | `1aad4978ffdc1ba1` (8,289,806 B) | `e134930586eb56a5` (103,709 B) |

## Determinism

All 24 enterprise runs in this block (2 census + 4 warmups + 16 pair +
2 identity, both arms) hash to the sealed pins on BOTH files; sweep
over the kept window shows 26/26 at the single sealed hash per file
(2 same-pin neighbor runs in the window). 0 divergences.

## Suites + quality

- `pnpm agentrs c atomic`: **594 + 1 passed, 0 failed** (== post-set-3
  tip 594+1, delta zero — no new tests).
- `pnpm agentrs c styletrace`: 31 passed / 18 failed, failure set
  **byte-identical (`diff`-empty) to base** via stash-compare; barrel
  passes in isolation (banked parallel-scratch flake). Zero new reds.
- `pnpm agentrs q` on all 7 touched files: **0 code violations**,
  7 warnings all pre-existing/banked on untouched lines (parse's
  5-arg trio + lengths; identity.rs length).
- Release build: same 18 pre-existing warnings, none on diet lines.
- Ordering note: conversion implemented edit-only while queued (lock
  held by others); sibling-measured traffic existed for every
  production site before conversion (parse's 3,123+119 eliminated =
  get-hits by construction, 0 fallbacks), so no site converted on
  faith; the instrumented census ran before the verdict and confirmed
  every site live (no carve-out).

## Collision / scope notes (for the captain)

- `ddce131e7` landing (cloneplasma, child of my pin, landed mid-flight):
  **DISJOINT** — its 5 files (object/mod, resolve/mod, normalize,
  unit, builder) intersect none of my 7. Proof on `3dd32a65` stands;
  diet patch expected bit-exact on tip.
- `intset4-diet` (in-flight, unlanded): touches `identity.rs` at
  `:413-420` only (`normalize_path` exact-capacity) — disjoint lines
  from my `:13`/`:47`/`:60`/`:68` hunks; my other 6 files untouched →
  mechanical composition.
- STASH INCIDENT (recovered): shared `refs/stash` across worktrees
  dropped `intset4-diet` mid-block (observed present at HELD, gone
  after my balanced+verified base-build cycle — another party's
  unbalanced pop). Found the commit (`4e4fe6fc`) intact in the object
  store and restored it via `git stash store`; stack == observed 3.
  Warning posted to claims: crews should use file asides, never stash
  cycles. No more stash ops from this crew afterward (none needed).
- Fences honored: hashers' Fx sites cited untouched; `model.exports`
  `RandomState` stands; extract's `JsxHosts` union composed (untouched);
  marshal wire seam untouched; zero order changes (sortshape bar).

## Artifacts

- base `.node`: `c24603bef5374564…` — cand `.node`: `69e0ae7b14b3c587…`
  — census `.node`: `abadfb619ba5c360…` (asided `/tmp/swarm-programsfx-*.node`)
- census: `/tmp/swarm-programsfx-count{1,2}.{json,err}` (3,242 tagged
  lines each, sorted-sha `6c1364e17cf86f6c` both)
- diet patch: `/tmp/swarm-programsfx-diet.patch` (== in-tree `git diff`)

## Verdict

**BANK (programs-map Fx tail: 9,485 counted SipHash ops removed, 8-pair
−2.48/−0.25% 5/8 with honest sub-noise ex-run-1 −0.18, byte-identical
4/4 scales with enterprise full-64 == sealed pins, determinism 26/26,
suites green-or-pre-existing, q 0 violations)**

Micro-bank-track as briefed: a zero-risk type swap completing hashers'
banked audit, with exact per-site counts and full proof. Tree left as
7 diet files + this REPORT; no commits — the captain lands.
