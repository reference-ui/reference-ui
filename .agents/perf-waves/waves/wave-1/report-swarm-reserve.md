# swarm-reserve: reserve-once at growth sites — REPORT

## Verdict

**CUT (wall-clock misses bar: arm medians +16.5ms clears ≥15ms but +1.31% misses ≥1.5%; noise spread ~71ms ≫ 2.4ms gap; mechanism proven but wall effect unresolved at bar)**

Near-miss, fully quantified below so the captain can overrule on evidence: the
mechanism is deterministically proven (−394,867 reallocs, −35.3%, zero phases
regress), outputs are byte-identical on all 4 scales × 24 runs, and the paired
median (+24.2ms / +1.92%) clears both prongs — but the pre-registered
computation (per-arm medians) fails the pct prong, and picking the passing
estimator post-hoc would be shopping (paired mean +11.9ms fails too).

## Base / binaries

- Base: `1a57b1e80daaa6b062a2a02e6ad4cc66e56d5402` (verified `git rev-parse HEAD` before work)
- Base .node sha256: `c5e477c4738ceb4662145b6200cc835c2188086e911b123b559e46f9b29c1e36`
- Cand .node sha256: `1d43b011d876a7d5c9c207a4e5eca6700ec7245bc1b14493451f0b504c81f61c`
- Harness never rebuilds mid-run: .node sha verified before AND after every
  one of 24 runs, always matched the arm's pinned hash.
- Trace binaries: base `04d11667…`, cand `0f2380f8…` (`--features alloc-trace`).

## Diff (`git diff --stat`)

6 files, +56/−21, one mechanism (exact-capacity reserve-once, zero behavior change):

- `modules/module-graph/src/ladder/mod.rs`: new `join_with`/`concat2` exact-capacity
  helpers; 5 `format!("{a}/{b}")` joins converted (node_hit, package_hit ×2, direct_hit, find_tsconfig)
- `modules/module-graph/src/ladder/probe.rs`: 3 probe-loop formats converted (suffix needle, `{base}.{suffix}`, `{base}/{name}`)
- `modules/module-graph/src/ladder/package.rs`: split_bare ×2 + types_package_name ×3 converted to exact-capacity builds
- `modules/module-graph/src/key.rs`: `normalize` uses `PathBuf::with_capacity(input bytes)` (output ≤ input: normalization only drops)
- `modules/atomic/src/includes/mod.rs`: strip_root `"{root}/"` needle pre-sized
- `modules/atomic/src/runtime/builder.rs`: `build` + `build_keyed` reserve `decls.len()` for plans/keys/seen_keys

Deliberately NOT touched (visible for selection): `format_entry` + emit `format!`s
(swarm-keys / swarm-emit ground), wants vecs + `sorted_entries` (cardinality
unknowable → CUT per brief), one-shot lib.rs collects (negligible count).

## Mechanism counts (alloc-trace, enterprise, deterministic counters)

| span metric | base | cand | delta |
| --- | --- | --- | --- |
| reallocs | 1,117,428 | 722,561 | **−394,867 (−35.3%)** |
| alloc blocks | 8,259,538 | 7,864,658 | −394,880 |
| alloc bytes | 946.6 MiB | 922.2 MiB | −24.4 MiB transient |
| span wall (instrumented) | 997.9ms | 959.2ms | −38.7ms |

Base trace reproduces the filed census (1,117,428 vs filed 1,117,430).
Per-phase alloc-block deltas: extract −248,628, graphs −60,168,
constants −36,000, collect −30,245, hosts −19,800, assembly −39 (builder
reserves worked — one-shot vecs were only ever ~39 blocks), all other
phases exactly 0. Every moving phase moves the right direction.

## Timed A/B: 6 interleaved enterprise pairs (exclusive lock, .node swap, no rebuilds)

Order alternated per pair (B,C / C,B). Sample = stdout `{…}` line syncMs.

| pair | base syncMs | cand syncMs | pair Δ (b−c) | order |
| --- | --- | --- | --- | --- |
| 1 | 1265.07 | 1239.49 | +25.58 | B,C |
| 2 | 1194.19 | 1245.97 | −51.78 | C,B |
| 3 | 1261.82 | 1193.87 | +67.96 | B,C |
| 4 | 1199.56 | 1243.00 | −43.45 | C,B |
| 5 | 1265.48 | 1242.70 | +22.78 | B,C |
| 6 | 1253.36 | 1203.40 | +49.96 | C,B |

- Base median 1257.59, mean 1239.91 | Cand median 1241.09, mean 1228.07
- **Delta (medians): +16.50ms, +1.31%** — ms prong ✓, pct prong ✗ (bar ≥1.5% = ≥18.87ms)
- Delta (means): +11.84ms, +0.95% | Paired median: +24.2ms/+1.92% (noted, not claimed)
- 4/6 pairs favor candidate. Both arms drew exactly 2 low runs each
  (bimodal machine state, symmetric); within-pair second-run-faster in 5/6
  pairs indicates a residual order effect the interleave only partly cancels.
- All 12 timed outputs hash-identical (below).

## Output hashes (byte-identical before/after, all four scales)

Full sha256 of `.reference-ui/styled/` outputs; identical across base/cand/cand
in all 24 kept repos (12 correctness + 12 timed):

| scale | styles.css | runtime-data.mjs |
| --- | --- | --- |
| small | `ecdec1e8…bda2973` | `ad9194f4…994d41` |
| medium | `37f2ef5b…4819fe` | `54735e4d…cfe7ce` |
| enterprise | `7ec827fb…e10dcea` | `718d19e4…78918` |
| churn | `1aad4978…10ec05` | `e1349305…f18cdb` |

(Full 64-char hashes verified; prefixes shown. Correctness-run syncMs values
are untimed contention noise — lock was free — and carry no timing claim.)

## Rule checks

1. ONE mechanism, no semantic change: `pnpm agentrs c atomic` green,
   `pnpm agentrs c module_graph` green, `pnpm agentrs q` on all 6 files green
   (1 pre-existing builder.rs length warning); no wrapper/TS changes so no
   `agentrs v` needed. Byte-identical outputs ×4 scales; candidate×2
   deterministic on all 4 scales.
2. Bench lock honored: acquired before the timed set (`swarm-reserve` owner),
   nothing else run while held, released after (via owner-file removal +
   rmdir; first rmdir attempt failed on non-empty dir — lock was NOT leaked).
3. 6 interleaved A/B pairs, .node file swap between arms, no mid-set rebuilds,
   sha pinned + verified every run, outputs hashed in every kept repo.
4. Hypothesis did not die on mechanism (−35% reallocs) but the wall-clock bar
   is missed on the pre-registered computation → CUT, no pivot.
5. This file. Diff + REPORT.md left uncommitted; bench-report noise files
   (`benchmark/reports/latest/*`) reverted out of the diff.

## Note for the captain (override data, not a claim)

The 0.19pp miss sits inside ±2pp noise; the deterministic counters prove real
allocator relief (−395k reallocs, −24MB transient). If the mission values a
zero-risk, minimal-diff allocator diet over the strict bar, this diff is
landable as-is: 6 files, exact-capacity math only, no new soundness surface,
no textual overlap with sibling topics.
