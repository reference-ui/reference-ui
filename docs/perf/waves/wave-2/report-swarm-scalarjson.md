# REPORT: swarm-scalarjson — scalar fast-path JSON writer (BANK)

## Verdict

**BANK (scalar lookup-key writer: −2.1 ms on the key-serialization phase vs
legacy, +0.28 ms marginal vs the banked keys2 diet shape, byte-identical,
zero-risk; whole-sync effect unresolvable as predicted)**

One line: hand-rolled five-tuple framing for scalar values (78% of the
106,278-tuple enterprise corpus) skips the canonical clone and the serde
tuple machinery with 0 divergences over corpus + 37k committed fuzz cases —
a real, small, proven-identical diet for the bank.

## Base

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified
  `git rev-parse HEAD` before any work; `packages/` tree identical to wave-1
  landing `0a7330c76`, docs-only delta)
- Base `.node` sha256:
  `c809341681d57eee5039dbf9933dc5f4c521b2de63a442dccc2088c225ea9a5f`
- Candidate `.node` sha256:
  `21a6dbd72cb17ba0163a6e62247c96dfc4b0b3b97947316136563d720663fa76`
- Both binaries `cp`-saved aside (`/tmp/swarm-scalarjson/base.node`,
  `/tmp/swarm-scalarjson/cand.node`); arms swapped by file copy, never
  rebuilt mid-set; sha256 verified before AND after every run (26/26 `ok`).
- Current tree `.node` = candidate build (left after A/B).

```
git diff --stat (tracked)
 .../modules/atomic/src/runtime/serializer.rs | 239 ++++++++++++++++++++-
 1 file changed, 230 insertions(+), 9 deletions(-)
new: packages/reference-rs/modules/atomic/tests/serializer_parity.rs (128 lines)
```

## Mechanism

One mechanism: a scalar fast path in `serialize_lookup_key`
(`modules/atomic/src/runtime/serializer.rs`). Scalar values (String, Null,
Bool, Number) take a hand-rolled writer that emits the five-tuple
`[system,when,prop,value,important]` directly into an exactly-presized
`String`: no `canonical_json_value` clone (canonicalization is the identity
on scalars), no serde `Serializer`/tuple/`Formatter` machinery, no
`io::Result` plumbing. Strings escape through a compile-time escapability
table plus a short-form table, matching serde_json 1.0.149 byte-for-byte
(`\"`, `\\`, `\b \t \n \f \r`, `\u00xx` lowercase hex for other C0,
everything else verbatim — verified against the vendored source).
Numbers render through the serde number printer (exact by construction).
Object/Array values (23% of the corpus) take the legacy path verbatim
(canonicalize + serde tuple), so the fallback is identical by construction.

## Phase definition, protocol, and prize

**Phase:** the lookup-key serialization sub-phase of assembly, keys2's
definition: all `serialize_lookup_key` calls over one enterprise compile
(106,278 tuples in call order). Flame: `serialize_lookup_key` incl 19 wt.

**Protocol (keys2's method):** drive the REAL functions over the REAL
enterprise key corpus (the preserved wave-1 site-tagged dump,
`/tmp/swarm-keys-dump-ent.txt`, 106,278 tuples — shapes re-verified:
82,458 strings, 15,699 objects, 8,121 arrays, zero numbers, zero escapes
in any output). Temporary example harness (reverted after numbers):
2 unscored warmup rounds + 25 scored interleaved rounds per arm with
rotated arm order, medians; two independent process runs. Three arms:
`legacy_like` (verbatim pre-change ops), `diet_like` (keys2 diet ops:
scalar borrow + serde tuple, harness-local reference for marginal
isolation), `fast` (the real new `serialize_lookup_key`).

**Method validation:** legacy over the corpus measures 17.3–18.3 ms vs
the filed flame weight 19 wt — the corpus method reproduces the
independent instrument within 9%.

## Phase counts and tables (filed evidence)

Primary evidence (final code shape, 25 scored rounds each, medians):

| path | run 1 | run 2 | per-tuple |
| --- | --- | --- | --- |
| legacy serialize | 17.86 ms | 17.70 ms | ~167 ns |
| diet serialize | 16.03 ms | 15.81 ms | ~150 ns |
| **fast serialize** | **15.75 ms** | **15.52 ms** | **~147 ns** |
| **fast saves vs legacy** | **2.11 ms** | **2.18 ms** | **~20 ns** |
| **fast saves vs diet** | **0.28 ms** | **0.29 ms** | **~2.7 ns** |

Paired round analysis (index-paired across rotated arms, n=25 each run):

| contrast | run 1 | run 2 |
| --- | --- | --- |
| legacy−fast | +2.04 ± 0.07 ms, 25/25 favor fast | +2.18 ± 0.03 ms, 25/25 |
| diet−fast | +0.25 ± 0.17 ms, 21/25 (outlier-inflated) | +0.31 ± 0.02 ms, 25/25 |

Replication: six further 11-round process runs on the same code family
all show fast < legacy decisively (1.5–2.1 ms); fast < diet in 5/6
(+0.11…+0.59, one −0.07). Combined with the 25-round pair: 7/8 process
runs favor fast over diet, mean ≈ +0.25 ms.

Byte-parity: fast == diet == legacy over all 106,278 tuples (asserted),
all 8 process runs, 0 divergences.

Why the prize is ~2 ms, not the estimated ~6 ms (mechanism counts):
serde's scan is already table-driven and near-optimal — the removable
cost was only (a) the scalar clone (~1.8 ms, shared with keys2's diet),
(b) ~15 serde trait calls + `Result` plumbing per tuple (~0.2 ms), and
(c) 128 B fixed over-alloc vs exact presize (~62 B mean, ~5 MB less
transient over the corpus). Dead-end filed for future waves: a
single-match closure-monomorphized frame measured 0.07–0.23 ms SLOWER
than diet in 2/2 runs (suspected inline-budget tip from 6 monomorphized
copies) and was reverted; named helpers won 4/4.

## Differential fuzzing (mandatory for a JSON writer)

- Full-corpus parity: 106,278/106,278 byte-identical, asserted in-harness,
  8/8 process runs, 0 divergences (covers the string fast path at 78% and
  the container fallback at 22%).
- Committed unit tests (`serializer.rs`): exhaustive every-byte-value test
  (all 256 `char` values × 4 placements × 2 frames = 2,048 parity checks)
  plus 25 adversarial cases (empty/long-8KB strings, all-C0 soup,
  quote/backslash tangles, multi-byte/combining/CJK/emoji, U+2028/2029,
  DEL/C1, numbers 0.0/−0.0/1/1.0/1e300/5e-324/0.30000000000000004/u64MAX,
  empty + nested + key-order-variant containers) — 0 divergences.
- Committed integration fuzz (`tests/serializer_parity.rs`, seeded
  xorshift, deterministic): 30,000 scalar tuples + 5,000 nested-container
  tuples against the pre-change oracle — 0 divergences.
- Total committed: ~37,100 differential checks, 0 divergences.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. Pair order alternated (B/C, C/B, …).
2 unscored warmups per arm. Lock held once, released immediately after.

| pair | base syncMs | cand syncMs | Δ ms | Δ % |
| --- | --- | --- | --- | --- |
| 1 (B,C) | 1213.23 | 1212.84 | −0.39 | −0.0% |
| 2 (C,B) | 1221.56 | 1221.24 | −0.33 | −0.0% |
| 3 (B,C) | 1176.17 | 1171.18 | −4.99 | −0.4% |
| 4 (C,B) | 1198.52 | 1189.12 | −9.40 | −0.8% |
| 5 (B,C) | 1194.76 | 1185.39 | −9.37 | −0.8% |
| 6 (C,B) | 1207.31 | 1187.43 | −19.88 | −1.6% |
| 7 (B,C) | 1201.05 | 1182.65 | −18.40 | −1.5% |
| 8 (C,B) | 1204.68 | 1193.75 | −10.93 | −0.9% |

- Warmups (unscored): base 1536.56, 1145.50; cand 1205.04, 1163.36
  (first-run outlier absorbed, wave-1 lesson).
- Base median: **1202.87 ms**; cand median: **1188.27 ms**; median Δ
  **−14.59 ms (−1.21%)**, 8/8 pairs favor candidate.
- Ex-run-1: base 1201.05, cand 1187.43, Δ **−13.62 ms (−1.13%)**, 7/7.

**Explicit disclaimer (read before the medians):** the full-median
−14.6 ms misses the solo bar's % prong and exceeds the mechanism's
proven 2.1 ms phase win by 7× — it is NOT a claimable win and this
report does not claim LAND (keys2 precedent: same disclaimer at the same
ratio). As pre-registered, a ~2 ms effect is unresolvable under
whole-sync scan noise; the A/B's job here is no-regression (candidate
not systematically worse: 8/8 pairs favor, no cand-side pattern) +
byte-identity + determinism. The win evidence is the phase micro-bench,
validated against the filed flame weight.

Cross-scale single samples (directional only — single-sample noise
swamps the effect): small 148.37→90.26, medium 224.47→164.31,
churn 2559.05→2539.62. The small/medium deltas exceed anything on this
path and are startup/scan noise (canon-report caveat); reported for
completeness, not claimed.

## Correctness

- (a) `pnpm agentrs c atomic`: 569 + 1 + 2 passed, 0 failed (incl. 2 new
  serializer unit tests + 2 new parity integration tests).
  `pnpm agentrs q` on both touched files: green, zero violations, zero
  warnings. No wrappers touched.
- (b) `styles.css` + `runtime-data.mjs` **byte-identical (`cmp`)
  base-vs-candidate on all four scales**:

| scale | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) | `718d19e4…378918` (214,466 B) |
| small | `ecdec1e8…bda2973` (92,651 B) | `ad9194f4…e994d41` (91,030 B) |
| medium | `37f2ef5b…04819fe` (348,780 B) | `54735e4d…08cfe7ce` (110,241 B) |
| churn | `1aad4978…deb10ec05` (8,289,806 B) | `e1349305…f70103f18cdb` (103,709 B) |

All four match the wave-1 filed hashes exactly (enterprise full strings
verified character-for-character against `report-swarm-keys2.md`).
`cssCalls` constant per scale (7527 / 171 / 635 / 43956).
- (c) Determinism: all 20 enterprise kept repos (4 warmups + 16 pair
  runs, both arms) hash-identical to each other on both files (1 distinct
  sha256 each); per-scale base==cand everywhere.

## Housekeeping notes

- `packages/reference-neo/benchmark/reports/latest/*` shows as modified:
  live bench-output side effect of the 26 A/B runs (regenerable; LOG.md
  already flags this path as live state). Not part of the deliverable.
- Temporary phase harness (`modules/atomic/examples/`) reverted without
  residue; final tree diff is exactly the 1 modified + 1 new file above
  plus this REPORT.md (untracked).
- No commits, no pushes — the captain lands.

## Collision notes (for the captain / bank integrator)

- **keys2's banked diet (same function, EXPECTED adjacency):** my patch
  keeps the base `LookupKey` signature and branches to a hand writer for
  scalars; keys2's patch generalizes the signature (`LookupKey<W>`,
  borrowed `when`) and borrows scalar values into the serde tuple. The
  two stack mechanically: merged shape = generic signature + fast frame
  for scalars (my clone-skip subsumes keys2's scalar-borrow on that
  branch) + keys2's borrowed-`when` serde tuple for containers.
  Overlap disclosed with numbers: my +2.1 ms vs legacy INCLUDES ~1.8 ms
  of clone-skip that keys2's diet also claims; my stacking-relevant
  marginal is +0.28 ms (proven above). Combined expectation ≈ 1.9 ms,
  NOT the sum — the integrator bisects per-component (my harness's
  `diet_like` arm exists precisely to make the bisect cheap to repeat).
- **swarm-posreuse** (positional exact→decl key reuse, keys2's filed
  lead): adjacent ground, complementary mechanism (theirs removes
  serialization calls, mine cheapens each call). No textual collision
  expected (theirs threads producer indices; mine is inside the
  serializer). If both bank, the sum-confirm resolves additivity.
- **swarm-hashers / swarm-realloc:** adjacent census ground, no shared
  functions with this diff.
- `serialize_value` (diagnostics policy render paths) deliberately
  untouched — diag territory, different call path, out of mechanism.

## Verdict

**BANK (scalar fast-path writer: +2.1 ms phase vs legacy, +0.28 ms vs the
banked-diet shape, 0 divergences on 106,278 corpus + ~37k fuzz cases,
4-scale byte-identity, determinism, suites + quality green)**
