# REPORT: swarm-islen — is_length no-alloc

## Base
- commit: `1a57b1e80` ("feat(agentrs): flame burndown query layer"), verified via `git rev-parse HEAD`
- base .node sha256: `419b5c08ef4032bef7c3eafc093e7d7f11cc122351e8ff254eacdc8d1b93ffd9`
- cand .node sha256: `0282aa8c5155078f482f55204c81221d699db0b43351a6103da37eface2eba86`
- both built with `pnpm agentrs b`; files swapped per arm, never rebuilt mid-set

## Diff stat
```
packages/reference-rs/modules/canon/src/css/values/lengths.rs | 22 +++++++++++++++++++---
1 file changed, 19 insertions(+), 3 deletions(-)
```
Plus this REPORT.md (untracked). Temp differential test removed after use; bench-touched
`reports/latest/*` restored — final tree diff is the one file above.

## Mechanism
`canon::css::values::lengths::is_length` allocated one `String` per call via
`value.trim().to_ascii_lowercase()` (flame: malloc 7wt + free 3wt directly below
is_length, self 9 / incl 25). The rewrite parses the trimmed `&str` slice directly
— the f64 grammar is ASCII case-insensitive over `E`/`inf`/`nan`, so zero-check and
prefix-parse outcomes are identical without lowering — and matches unit suffixes
with `eq_ignore_ascii_case` via a boundary-safe `get`-based strip helper.
Zero allocation, same f64-parse count, no output/semantic change.

## Mechanism counts (not just ms)
- Differential corpus (temporary test, since removed): 32,720 values
  (90 numeric/adversarial prefixes x 65 real+near-miss suffixes x 3 case forms,
  wrapped bare/upper/toggled/padded, plus unicode/whitespace/near-miss words),
  6,024 true / 26,696 false — **zero divergences** old vs new, incl. `1e-9999`
  underflow-to-zero, `INF`/`NAN` spellings, `2MS`/`1REM` suffix collisions.
- Allocation count over the same 32,720 calls (counting global allocator):
  old = **32,696** (1 per non-empty-after-trim input), new = **0**.

## A/B table (enterprise, `--runs 1 --keep --json`, 6 interleaved pairs, alternating lead arm)

| pair | base syncMs | cand syncMs | delta (c−b) |
| --- | --- | --- | --- |
| 1 (B,C) | 1250.24 | 1281.84 | +31.60 |
| 2 (C,B) | 1289.03 | 1181.72 | −107.31 |
| 3 (B,C) | 1290.45 | 1252.32 | −38.13 |
| 4 (C,B) | 1250.47 | 1247.38 | −3.09 |
| 5 (B,C) | 1265.98 | 1245.85 | −20.13 |
| 6 (C,B) | 1263.90 | 1250.57 | −13.33 |
| **median** | **1264.94** | **1248.97** | **−15.97 (−1.26%)** |
| mean | 1268.35 | 1243.28 | −25.06 (−1.98%, outlier-driven) |

- .node sha256 verified unchanged after all 12 runs (harness never rebuilds).
- Every A/B run's outputs hashed `css=7ec827fb0c0c rtm=718d19e47017`, matching
  the enterprise correctness pair below.

## Output hashes (base vs cand, every kept repo)

| scale | styles.css | runtime-data.mjs | match |
| --- | --- | --- | --- |
| small | `ecdec1e8…` (92,651 B) | `ad9194f4…` (91,030 B) | YES |
| medium | `37f2ef5b…` (348,780 B) | `54735e4d…` (110,241 B) | YES |
| enterprise | `7ec827fb…` (2,867,925 B) | `718d19e4…` (214,466 B) | YES |
| churn | `1aad4978…` (8,289,806 B) | `e1349305…` (103,709 B) | YES |

Full shas in `/tmp/swarm-islen-corr-*.done` (worktree-external scratch).

## Determinism
Candidate enterprise run twice → identical css+rtm hashes (`7ec827fb…` / `718d19e4…`). MATCH.

## Rules checklist
1. (a) `pnpm agentrs c canon` green (full suite + lengths unit tests re-run on final
   tree); (b) 4/4 scales byte-identical; (c) determinism MATCH. Quality gate
   `pnpm agentrs q` clean on the edited file.
2. Bench lock held only for the timed set, released immediately after
   (note: release needs `rm owner` + `rmdir`; bare `rmdir` fails on the owner file).
3. 6 interleaved pairs, .node file swapped per arm, same worktree paths, no rebuilds.

## Verdict
`CUT (median delta 15.97ms meets the ms bar but 1.26% misses the >=1.5% bar; per-pair deltas span +31.6 to -107.3ms on ~40ms within-arm noise, so the gap is not robust)`
