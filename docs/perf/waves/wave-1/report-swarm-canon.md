# swarm-canon REPORT: `resolve_alias` rejection pre-filter

## Mechanism (one)

`canon::dialect::resolve_alias` ran a 315-entry binary search (~8–9 `memcmp`s) on
**every** call, but ~all calls miss: `resolve_canonical_prop` funnels every
ordinary property (`marginTop`, `color`, …) through the alias table first.
Flame: `resolve_alias` 23 self / 33 incl wt, called from
`resolve_canonical_prop` (17) and `is_known_style_prop` (5).

Fix: a `maybe_alias` pre-filter — uppercase initial must be `M`/`W` (vendor
aliases), lowercase initial must be in `{b,f,h,m,p,w}` at length `{1,2,4,7}`
(the 22 short shorthands). Misses return after 1–2 byte ops; members and
ambiguous names fall through to the unchanged binary search. No memo table
(deliberately: a HashMap would pay SipHash on the same hot path), no output
change possible — the filter only skips provable misses.

Regen-safety: the filter arms are derived from the alias table at codegen
(`generate/emit/dialect.ts`), and an emitted invariant test asserts every
table member passes the filter. A future alias with a new initial fails
loudly at regen (generator throws) or at test time, never silently.

## Diff

Base: `1a57b1e80` (`git rev-parse HEAD` verified at start).

```
.../modules/canon/generate/emit/dialect.ts         | 46 ++++++++++++++++++++++
.../modules/canon/generate/emit/tests/join.ts      | 22 ++++++++++-
packages/reference-rs/modules/canon/src/dialect.rs | 16 ++++++++
packages/reference-rs/modules/canon/src/tests.rs   | 18 +++++++++
4 files changed, 101 insertions(+), 1 deletion(-)
```

Notes:

- Full canon regen (`pnpm --dir packages/reference-rs canon`) drifts on
  unrelated files (thousands of lines deleted vs committed sources —
  pre-existing emitter/data drift, untouched by this change), so the generated
  `dialect.rs`/`tests.rs` hunks were hand-applied byte-identical to what the
  updated emitter produces (verified by diffing regen output before revert).
- `dist/*.mjs` wrappers were missing in the fresh worktree; ran
  `build:js` once for bench harness resolution (gitignored, not in diff).

## Artifacts

- base `.node`: `7892030eba9a4eda8093128c5319a87f39fa6c99de10a39bcd9c78ac890ae41d`
- cand `.node`: `a8592021944531bb8d6ee5b9c1d4a104ac726bc85f01464dbeec8289fea0d9d8`
- Harness never rebuilt mid-set: `.node` sha256 verified identical
  before/after all 19 timed runs.

## Correctness (rule 1)

- (a) `pnpm agentrs c canon`: 55 passed, 0 failed (incl. new
  `alias_prefilter_table_contract`); `pnpm agentrs c atomic`: 567+1 passed.
  `pnpm agentrs q` on both touched Rust files: green. No wrappers touched.
- (b) Byte-identical outputs base vs cand on all four scales:

| scale      | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| ---------- | ------------------------------ | ------------------------------------ |
| enterprise | `7ec827fb…10dcea`              | `718d19e4…8918`                      |
| small      | `ecdec1e8…a2973`               | `ad9194f4…4d41`                      |
| medium     | `37f2ef5b…19fe`                | `54735e4d…fe7ce`                     |
| churn      | `1aad4978…ec05`                | `e1349305…8cdb`                      |

- (c) Determinism: all 6 candidate enterprise runs (plus all 6 base runs)
  produced identical output hashes.

## Mechanism counts (not just ms)

Criterion `canon/benches/alias.rs`, prebuilt base/cand binaries, same lock hold:

| bench              | base        | cand        | delta            |
| ------------------ | ----------- | ----------- | ---------------- |
| alias/miss         | 24.34 ns    | 1.43 ns     | −22.9 ns (17×)   |
| alias/passthrough  | 26.85 ns    | 1.44 ns     | −25.4 ns (18×)   |
| alias/mixed (13 w) | 324.19 ns   | 188.56 ns   | −135.6 ns (−42%) |
| alias/hit_hot      | 25.08 ns    | 25.61 ns    | +0.5 ns (+2%)    |

Static coverage over the 1073-entry `CANONICAL_PROPERTIES` vocabulary:
**1061/1073 (98.9%)** of canonical props are rejected by the filter, going
from ~8–9 binary-search `memcmp`s to zero table probes. The 12 remaining
(`fill`, `flex`, `font`, `mask`, `page`, `padding`, `hyphens`, `boxSize`,
`boxSnap`, `maxSize`, `minSize`, `msOrder`) fall through and correctly miss.
Hit path pays ~0.5 ns guard overhead.

## Enterprise A/B: 6 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. Pair order alternated (B/C, C/B, …).
Lock held once, ~3.3 min, released immediately after last run.

| pair | base syncMs | cand syncMs | Δ ms    | Δ %     |
| ---- | ----------- | ----------- | ------- | ------- |
| 1    | 1266.46     | 1145.67     | −120.78 | −9.5%   |
| 2    | 1248.60     | 1216.43     | −32.17  | −2.6%   |
| 3    | 1255.47     | 1236.00     | −19.47  | −1.6%   |
| 4    | 1253.86     | 1213.79     | −40.07  | −3.2%   |
| 5    | 1248.20     | 1213.29     | −34.91  | −2.8%   |
| 6    | 1268.77     | 1225.03     | −43.73  | −3.4%   |

- base median: **1254.66 ms**; cand median: **1215.11 ms**
- median Δ: **−39.56 ms (−3.15%)**, all 6 pairs favor candidate.
- Excluding the outlying pair 1: median Δ −37.4 ms (−3.0%) — result stands.

Other scales, single samples each (directional only, high noise at small N):

| scale  | base syncMs | cand syncMs | Δ         |
| ------ | ----------- | ----------- | --------- |
| small  | 152.31      | 90.05       | −62.3 (−41%) |
| medium | 229.34      | 168.80      | −60.5 (−26%) |
| churn  | 2830.53     | 2736.10     | −94.4 (−3.3%) |

Caveat: small/medium single-sample deltas are larger than the alias cluster
can explain and likely carry startup/scan noise; they are reported for
completeness, not claimed. Enterprise medians are the verdict metric.

## Verdict

**LAND (delta −39.6 ms + −3.15%, rules 1–3 green)**
