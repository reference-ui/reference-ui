# REPORT: swarm-keys2 — keys memo under a per-phase bar (memo CUT, diet BANK)

## Verdict

**BANK (lookup-key serialization diet: −3.3 ms on the key-serialization phase, byte-identical, zero-risk; whole-sync effect below A/B resolution as predicted; memo CUT with counts)**

One line: the memo loses structurally (identity-verification ≈ serialization cost, misses +400 ns); the zero-overhead diet half (scalar canonical skip + borrowed `when`) saves a measured 3.31 ms on the phase with 106,278/106,278 byte-parity — too small for whole-sync resolution, clean for the bank.

## Base

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` before any work; `packages/` tree identical to wave-1 landing `0a7330c76`, docs-only delta)
- Base `.node` sha256: `501a5cc0ec2715b7eb0386743bda5740cab04b2c4fb21ab12c75656a34f3a10c`
- Candidate `.node` sha256: `a8a6673d2e79accb25c9b48f9f76428bd42a4853fc87a9bc5c8564cc30788060`
- Both binaries `cp`-saved aside (`/tmp/swarm-keys2/base.node`, `/tmp/swarm-keys2/cand.node`); arms swapped by file copy, never rebuilt mid-set; sha256 verified before AND after every run (26/26 `ok`).
- Current tree `.node` = candidate build (restored after A/B).

```
git diff --stat
 .../modules/atomic/src/diagnostics/facts.rs        |  3 +--
 .../modules/atomic/src/runtime/serializer.rs       | 29 +++++++++++++---------
 2 files changed, 18 insertions(+), 14 deletions(-)
```

## Mechanism

Two parts, bisected per-component after the memo disappointed (never ship a bundle on faith):

1. **Lookup-key serialization memo (CUT):** unified `KeyMemo` over both five-tuple owners (`AuthoredDeclaration`, `OwnedLookupKey`), FxHash + hashbrown raw-entry, structural identity with bitwise number equality (`0.0` vs `-0.0` and `1` vs `1.0` split, as their bytes differ) and order-independent object equality (as canonicalization sorts). Fully implemented, tested (5 unit tests incl. table-growth hygiene), byte-identical over the full 106,278-tuple corpus — and SLOWER by 5–15 ms (see §Phase). Reverted without residue (no dep, no signature, no file left behind).
2. **Lookup-key serialization diet (BANK):** scalar values borrow through `serialize_lookup_key` instead of cloning through `canonical_json_value` (canonicalization is the identity on scalars — same reference serialized, provably identical bytes); `OwnedLookupKey::lookup_key` borrows its `when` steps (`&[Box<str>]` via a backward-compatible generic `LookupKey<W>`) instead of cloning a `Vec<String>` per call. Strictly fewer allocations on every path, zero added work.

## Phase definition, protocol, and bar

**Phase:** the lookup-key serialization sub-phase of assembly = all `serialize_lookup_key` calls plus their per-call caller-frame overhead (the `OwnedLookupKey::lookup_key` when-vec materialization, the `canonical_json_value` clone), from the two bench-path sites (`PlanBuilder::build_keyed` decl loop, `Proof::collect_exact` exact loop) within one enterprise compile. Flame: `serialize_lookup_key` incl **19 wt**, all in compile phase under `AssembleCtx::finish` (callers: exact site 12 wt, decl site 7 wt).

**Protocol (same discipline as whole-sync):** drive the REAL functions over the REAL enterprise key corpus (the preserved wave-1 site-tagged dump, 106,278 tuples in call order — exact shapes, exact multiplicities), 2 unscored warmup rounds + 9–11 scored interleaved rounds, medians. Temporary instrumentation, reverted after numbers landed (wave-1 `SWARM_KEYS_DUMP` precedent).

**Method validation:** the legacy path over the corpus measures 20.1–20.5 ms vs the filed flame weight 19 wt — the corpus method reproduces the independent instrument within 6%.

**Per-phase bar (defined and defended):** ≥5 ms absolute on the phase AND ≥25% relative on the phase. Defense: (a) the whole-sync bar's 15 ms absolute prong prices whole-sync noise (scan-phase kernel jitter, ±20–100 ms pair spreads in wave-1); the phase instrument has ~0.1 ms noise, so a smaller absolute floor is metrologically sound; (b) 5 ms ≈ 1% of the 486 ms program gap — material at program scale and large enough to show directionally in whole-sync A/B (additivity check for the bank); (c) 25% relative is 10–25× the phase instrument's noise (micro-bench CV ~1–2%) — decisive by metrology; (d) this bar is the bank-admission bar, not a solo-LAND bar: wave-1 banked islen/reserve on realness + identicality with the combined set clearing whole-sync bar at integrate; the wave-1 sketch (12 ms = 63% capture) would make the LOG's revive clause dead letter by demanding near-perfection. The bar gated the memo (complex mechanism); the diet below is judged by VOYAGE's bank standard (sub-bar proven-identical diet banks), not by the memo's bar.

## Phase counts and tables (filed evidence)

Corpus (independently re-verified from `/tmp/swarm-keys-dump-ent.txt`, agreeing with `docs/perf/waves/wave-1/report-swarm-keys.md` exactly):

- decl 35,426 / 19,187 unique (1.85x); exact 70,852 / 19,187 unique (3.69x); decl ∩ exact = 19,187 (identical sets); union 19,187.
- Value shapes: 82,458 strings (78%), 15,699 objects (15%), 8,121 arrays (8%); ZERO JSON numbers anywhere (top-level or nested); 27,570 non-empty `when` (26%).
- Key string bytes: min 37, p50 54, p90 81, p99 120, max 153, mean 58.7.
- New structural finding: the exact sequence is exactly the decl sequence TWICE, positionally (exact[0..35426] == exact[35426..] == decl[0..35426], all 35,426 match). Adjacent dupes ~0; dup distance p50 6,589 — a small cache cannot work, only a full map.
- Local-memo max hits 67,904 (63.9%); unified max hits 87,091 (81.9%).

Phase medians (two independent process runs, 11 scored of 13 interleaved rounds for diet; 9 of 11 for memo):

| path | run 1 | run 2 | per-tuple |
| --- | --- | --- | --- |
| legacy serialize | 20.50 ms | 20.11 ms | ~190 ns |
| diet serialize | 17.21 ms | 16.74 ms | ~160 ns |
| **diet saves** | **3.29 ms** | **3.37 ms** | **~31 ns** |
| diet + local memos | 31.70 ms | 31.31 ms | ~300 ns |
| diet + unified memo | 22.44 ms | 22.72 ms | ~212 ns |
| **memo delta (local)** | **−14.70 ms** | **−14.35 ms** | LOSS |
| **memo delta (unified)** | **−5.44 ms** | **−5.76 ms** | LOSS |

Hit/miss decomposition (measured): hash-only 20–21 ns/tuple (FxHash fine), clone-only 25–26 ns/tuple, all-hits 99–101 ns/tuple → probe+eq ≈ 54 ns (memory-bound: 3 MB table + scattered strings); miss ≈ 550–585 ns (+~400 ns over serialize: owned-key clones + insert + growth).

Why the memo cannot win (mechanism counts, beating canon's HashMap skepticism with the reverse asymmetry): serialize is cheap (159 ns: small keys, presized buffer, no escaping in practice); a hit still pays hash (21) + probe/eq (54) + clone (26) ≈ 101 ns, saving ≤58 ns; a miss costs +400 ns. At max 82% hits: 0.82×58 − 0.18×400 < 0. Even the optimistic-best memo (70 ns hits, presized, zero growth) nets ≈ +5.1 ms — grazing the 5 ms floor under optimistic-everywhere assumptions. Canon rejected a HashMap memo because hash ≈ bsearch on a miss-heavy path; here hash+verify ≈ serialize on a hit-heavy path — same verdict, opposite asymmetry, both by count. The implementation is near-efficient (hash 21 ns); the mechanism is at fault, not the code.

Byte-parity: memo bytes == direct bytes over all 106,278 tuples (asserted); diet bytes == legacy bytes over all 106,278 tuples (asserted); both runs.

Presize (considered, killed by reading source): `serde_json::to_vec` already presizes 128 B; p99 key is 120 B — no regrows to kill. Positional exact→decl reuse (considered, rejected): sound only with producer cooperation (fact→decl index threading through analysis — invasive, diag territory, fragile); filed as a lead. Scalar fast-path JSON writer (considered, NOT pursued — second mechanism): hand-rolled tuple writer for the 78% string values could save ~6 ms but needs differential fuzzing; filed as a lead for a future crew, not this one (one mechanism).

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample = `scales[0].samples[0].syncMs`. Pair order alternated (B/C, C/B, …). 2 unscored warmups per arm. Lock held once, released immediately after.

| pair | base syncMs | cand syncMs | Δ ms | Δ % |
| --- | --- | --- | --- | --- |
| 1 (B,C) | 1227.17 | 1166.78 | −60.39 | −4.9% |
| 2 (C,B) | 1244.41 | 1224.72 | −19.69 | −1.6% |
| 3 (B,C) | 1196.30 | 1191.93 | −4.37 | −0.4% |
| 4 (C,B) | 1192.72 | 1194.81 | +2.10 | +0.2% |
| 5 (B,C) | 1198.11 | 1191.31 | −6.80 | −0.6% |
| 6 (C,B) | 1239.37 | 1539.27 | +299.91 | +24.2% |
| 7 (B,C) | 1369.47 | 1251.31 | −118.16 | −8.6% |
| 8 (C,B) | 1408.50 | 1397.16 | −11.34 | −0.8% |

- Warmups (unscored): base 1570.41, 1181.43; cand 1237.11, 1165.91 (first-run outlier absorbed, wave-1 lesson).
- Base median: **1233.27 ms**; cand median: **1209.77 ms**; median Δ **−23.50 ms (−1.91%)**, 6/8 pairs favor candidate.
- Ex-run-1: base 1239.37, cand 1224.72, Δ **−14.65 ms (−1.18%)**.

**Explicit disclaimer (read before the medians):** the full-median −23.5 ms nominally clears the solo bar's numbers, but it exceeds the mechanism's proven 3.3 ms phase win by 7× and rides on pair noise (pair-6 +300 ms cand outlier, pair-1 −60, late-run drift lifting pairs 7–8 on both arms) — it is NOT a claimable win and this report does not claim LAND. Ex-run-1 (−14.65/−1.18%) misses both prongs. As pre-registered, a 3.3 ms effect is unresolvable under whole-sync scan noise; the A/B's job here is no-regression (candidate not systematically worse: 6/8 pairs favor, no cand-side pattern beyond the shared drift) + byte-identity + determinism. The win evidence is the phase micro-bench (§Phase), validated against the filed flame weight.

Cross-scale single samples (hash runs, directional only — single-sample noise ±100 ms swamps the effect): small 388.13→147.50 (base cold-start outlier), medium 292.91→373.93, churn 2588.01→2696.17. Reported for completeness, not claimed.

## Correctness

- (a) `pnpm agentrs c atomic`: 567 + 1 passed, 0 failed. `pnpm agentrs q` on both touched files: green, zero violations. No wrappers touched.
- (b) `styles.css` + `runtime-data.mjs` **byte-identical (`cmp`) base-vs-candidate on all four scales**:

| scale | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) | `718d19e4…378918` (214,466 B) |
| small | `ecdec1e8…bda2973` (92,651 B) | `ad9194f4…e994d41` (91,030 B) |
| medium | `37f2ef5b…04819fe` (348,780 B) | `54735e4d…08cfe7ce` (110,241 B) |
| churn | `1aad4978…deb10ec05` (8,289,806 B) | `e1349305…f70103f18cdb` (103,709 B) |

All four match the wave-1 filed hashes exactly (enterprise full strings verified character-for-character against `report-swarm-emit.md`). `cssCalls` constant per scale (7527 / 171 / 635 / 43956).
- (c) Determinism: all 20 enterprise kept repos (4 warmups + 16 pair runs, both arms) `cmp`-identical to each other on both files; per-scale base==cand everywhere.

## Housekeeping notes

- `packages/reference-neo/benchmark/reports/latest/*` shows as modified: live bench-output side effect of the 26 A/B runs (regenerable; LOG.md already flags this path as live state). Not part of the deliverable diff.
- No commits, no pushes — the captain lands. Worktree diff is exactly the 2 files above plus this REPORT.md (untracked).

## Overlap notes

- `diagnostics/proof/render.rs` was touched during the memo implementation and fully reverted; final diff does not touch proof/render — no collision surface with swarm-diag beyond the shared `OwnedLookupKey::lookup_key` (facts.rs, 3-line diet hunk).
- `CascadeKey`/sort ground untouched (swarm-cascade's topic).
- The `sorted_entries` readdir-presize lead from the brief is scan-phase ground, a different mechanism — not pursued (one mechanism).

## Verdict

**BANK (diet −3.3 ms phase, proven-identical, zero-risk; memo CUT with counts)**
