# swarm-marshal REPORT: slim-wire sheet-suffix codec (N-API/JSON marshal legs diet)

## Mechanism (one)

The slim N-API result ships the primary AND portable stylesheets as two full
strings, but the emitter prints their recipes+utilities suffix once
(`build_stylesheets_with`): the two sheets differ only in the token-selector
head. Census on the seed-7 enterprise load: portable = 2,867,982 B, of which
2,866,820 B (99.96%) is a byte-identical suffix of the primary sheet; the
divergent head is 1,162 B.

Fix: the slim wire refolds the portable sheet as `portableHead` (1,162 B) +
`sharedTailUtf16` (tail length in UTF-16 units). The JS wrapper rebuilds
`portableStylesheet = portableHead + stylesheet.slice(stylesheet.length -
sharedTailUtf16)` with the exact observed key order and no leftover wire
fields. The split is content-agnostic string algebra — longest common
byte-suffix snapped to a UTF-8 lead byte (always a char boundary in valid
UTF-8), tail counted in UTF-16 units (astral-aware) — exact for every input
pair, including identical or empty sheets; an impossible-branch fallback sends
the full head (diet skipped, still exact). The proof channel is untouched.

Prior art (follow-up, not relitigation): Hyperspace W1 "slim N-API result"
(LOG.md History) removed the dead rows (~38%); fasthull A2 landed the
in-compile shared print. The WIRE duplication survived both — this diets it.
Measured on the new base throughout.

Request leg: counted, NOT dieted. `files[]` (5.66 MB of 6.15 MB) are load —
the bytes must cross (omitting them re-pays 15,122 disk opens × 15.87 µs ≈
240 ms vs the whole 28.5 ms marshal delta — statically rejected). `spec` is
19,058 B: a RawValue passthrough would save ~0.1 ms — ceiling-barred, dropped
with numbers (see Mechanism counts).

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874` (`git rev-parse HEAD`
verified at start; perf base wave-1 landing `0a7330c76` + docs-only filing).

```
 packages/reference-rs/modules/atomic/js/runtime.ts | 26 ++++++++++++++++++++--
 packages/reference-rs/modules/atomic/native.rs     | 11 +++++++--
 packages/reference-rs/modules/atomic/src/lib.rs    |  1 +
 packages/reference-rs/modules/atomic/src/wire.rs  | 113 +++++++++++++++++++++ (new)
 4 files changed, ~145 insertions(+), 4 deletions(-)
```

Notes:

- `dist/*.mjs` wrappers were missing in the fresh worktree; ran `build:js`
  once for bench harness resolution (gitignored, not in diff), plus a dist
  rebuild after the wrapper edit.
- Single consumer of the slim wire (`atomic/js/runtime.ts` `compileSystem`;
  verified by grep — no other caller of the native export, no raw-wire test
  assertions). Observed `CompileResult` shape, key order, and proof channel
  are unchanged; `contracts/` untouched.

## Artifacts

- base `.node`: `f37c41a5c073c77ba38b672d1b23bbac57129ec5b82ebb5c0f478e72d9`
- cand `.node`: `5e99c56f676eabf4b58743b0632ca8d6c7ed48d69e5889fba36bd1dedd02a626`
- Harness never rebuilt mid-set: every arm swap sha256-checked at swap time
  (script aborts on mismatch; zero mismatches over 28 swap-checked bench
  runs + 2 suite swaps); both asided binaries re-verified identical after
  the last run.

## Correctness (rule 1)

- (a) `pnpm agentrs c atomic`: 573 passed, 0 failed (baseline 567+1, plus
  6 new `wire::tests`); `pnpm agentrs v atomic`: 300/301 on BOTH arms with
  the identical single red (ATM-SITE-54 `hasWant`, a proof-channel wants
  assertion this set cannot touch — fails on the pristine base arm too,
  matching the filed "ATM pre-existing" note; NO NEW REDS). The
  slim/proof `toBe` parity gate passes, pinning reconstruction exactness.
  `pnpm agentrs q` on all 4 touched files: 0 code violations (2 warnings,
  both pre-existing in `lib.rs`: file length + `run_parse_phase` lines —
  untouched code). `build:js` tsc passes on the wrapper edit.
- (b) Byte-identical outputs base vs cand on all four scales (and every
  hash equals the filed wave-1 bytes from report-swarm-canon.md):

| scale      | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| ---------- | ------------------------------ | ------------------------------------ |
| enterprise | `7ec827fb…10dcea`              | `718d19e4…8918`                      |
| small      | `ecdec1e8…a2973`               | `ad9194f4…4d41`                      |
| medium     | `37f2ef5b…19fe`                | `54735e4d…fe7ce`                     |
| churn      | `1aad4978…ec05`                | `e1349305…8cdb`                      |

- (c) Determinism: 22/22 enterprise runs (4 warmup + 16 pair + 2 identity,
  11 per arm) produced the identical output hashes above.

## Mechanism counts (not just ms)

Census: instrumented `.node` (temp `eprintln` + file append, reverted), one
enterprise run, seed 7. Micro: medians over 7 iters on captured payloads
(`/tmp/marshal-req.json` 6,153,775 B, `/tmp/marshal-res.json` 6,072,347 B).

Per-leg byte census (the key table):

| leg / field              | bytes     | share / note                          |
| ------------------------ | --------- | ------------------------------------- |
| request in (total)       | 6,153,775 | files 5,662,338 (15,122 files) + rest |
| … of which `spec`        | 19,058    | 0.3% — RawValue prize ~0.1 ms: DROPPED |
| result out slim (total)  | 6,072,347 | before diet                           |
| … `stylesheet`           | 2,867,925 | == styles.css bundle bytes, kept full |
| … `portableStylesheet`   | 2,867,982 | shared tail 2,866,820 (99.96%)        |
| … refolded `portableHead`| 1,162     | divergent head only                   |
| … `runtime`              | 214,325   | consumed, no duplication              |
| … `diagnostics` / hosts  | 2 / 2     | empty on this load                    |
| result out slim (diet)   | 3,144,558 | −2,927,789 (−48.2%, escapes incl.)    |

Copies per sync across the seam (structural, both arms): request
stringify→napi-in→`from_str` (3 full passes); result `to_string`→napi-out→
`JSON.parse` (3 full passes). The diet removes 2.93 MB from each of the 3
result-leg passes, paying one O(tail) suffix scan (~0.3 ms) and one lazy
V8 concat (flattening moves to publish hash, ~0.5 ms).

Codec proof on real sheets (census self-check): `verify_identical=true`
(head bytes + primary tail bytes == portable bytes),
`verify_u16=true` (hand count == `encode_utf16().count()`),
JS `reconstruct identical: true` on captured payloads.

Micro (JS side, measured):

| op                                   | ms     |
| ------------------------------------ | ------ |
| `JSON.parse` full result (6.07 MB)   | 6.66   |
| `JSON.parse` diet result (3.14 MB)   | 3.71   |
| parse savings                        | −2.95  |
| reconstruct (`slice` + concat)       | 0.00   |
| `JSON.stringify` request (6.15 MB)   | 7.20   |
| (no request diet — load)             | —      |

Ceiling (fantasy at 100% capture): parse −2.95 (measured) + napi-out
~−2 (2.93 MB @ ~1.5 GB/s) + in-span serde `to_string` ~−4…−7 (48% of
~8…15 ms) − scan/flatten ~+0.8 ≈ **−8…−12 ms**. Below the LAND bar
(≥15 ms + ≥1.5% ≈ 17.4 ms) on both prongs → BANK shaping (proven-identical
diet rule); CUT is barred because the diet is real and positive.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm (cand 1333.4 cold /
1182.4, base 1180.5 / 1201.3 — dropped), pair order alternated (B/C, C/B, …).
Lock held once for the whole set, released immediately after.

| pair | base syncMs | cand syncMs | Δ ms   | Δ %    |
| ---- | ----------- | ----------- | ------ | ------ |
| 1    | 1180.71     | 1185.92     | +5.22  | +0.44% |
| 2    | 1185.48     | 1193.26     | +7.78  | +0.66% |
| 3    | 1204.15     | 1194.24     | −9.91  | −0.82% |
| 4    | 1197.76     | 1171.85     | −25.91 | −2.16% |
| 5    | 1216.86     | 1190.71     | −26.15 | −2.15% |
| 6    | 1183.02     | 1183.92     | +0.90  | +0.08% |
| 7    | 1189.40     | 1174.31     | −15.10 | −1.27% |
| 8    | 1189.64     | 1208.04     | +18.40 | +1.55% |

- base median: **1189.52 ms**; cand median: **1188.31 ms**
- median Δ: **−1.21 ms (−0.10%)**, 4/8 pairs favor candidate.
- Excluding pair 1: base median 1189.64, cand median 1190.71, median Δ
  +1.07 ms (+0.09%) — the point estimate sits inside run noise either way
  (per-arm spread ~36 ms on this box); the verdict does not depend on it.

Other scales, single samples each (directional only, high noise at small N):

| scale  | base syncMs | cand syncMs | Δ            |
| ------ | ----------- | ----------- | ------------ |
| small  | 150.29      | 150.03      | −0.3 (−0.2%) |
| medium | 226.32      | 168.14      | noisy pair   |
| churn  | 2524.30     | 2520.66     | −3.6 (−0.1%) |

Caveat: small/medium/churn single samples carry startup/scan noise; they
are reported for completeness (and their hashes for identity), not claimed.
The medium pair in particular is a noise artifact (same shape as canon's
medium caveat).

Why the end-to-end sits near zero while the mechanism saves ~3 ms of parse
alone: the reconstructed sheet is a lazy V8 rope (head + slice), so one
~2.9 MB flattening copy moves downstream into publish (`portableHash` +
`baseSystemMjsSource`), muting the serde/napi/parse savings. Net remains
non-negative by construction (fewer bytes through every codec), but the box
noise (~±18 ms pair swings) dominates the point estimate. The sum-confirm
resolves the true contribution — exactly the wave-1 reserve precedent.

## Collision

- swarm-parse (banked reuse, lib.rs parse-phase ground): adjacent, not the
  seam — no shared files (this set: `atomic/src/wire.rs`, `atomic/native.rs`,
  `atomic/src/lib.rs`, `atomic/js/runtime.ts`).
- swarm-realloc (alloc census/diet): marshal allocs adjacent — this set only
  shrinks serde/napi string sizes; no allocator-strategy change. Note, no
  duplication.
- RACE: first sound LAND/BANK on the seam-wire wins; any second arrival
  proves superiority on this protocol or YIELDs.

## Verdict

**BANK (proven-identical diet, sub-bar end-to-end: median Δ −1.21 ms /
−0.10% full, +1.07 ms ex-run-1, 4/8 favor; mechanism −2.93 MB wire / −2.95 ms
parse measured; identity 4/4, determinism 22/22, suites + q green, no new
reds)** — the sum-confirm resolves the contribution.
