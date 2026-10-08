# swarm-parse REPORT: retained-program reuse kills styletrace + identity re-parses

## Mechanism (one)

Every retained file is parsed **three times**: once by the main phase
(`run_parse_phase`, 23wt), once by the styletrace entry re-parse
(`parse_trace_module`, 13wt), and — for relatively-imported files — once
more by the identity walk (`parse_export_map`, 8wt). All three use
byte-identical options (`SourceType::from_path().with_typescript(true)`,
same `Parser::parse`), so the re-parses deterministically reproduce
programs the main phase already holds.

Fix: thread the retained programs to both re-parse sites and walk them
instead of re-parsing bytes. `run_parse_phase` builds two maps in
`reuse_programs` (position-keyed for identity, path-keyed for
styletrace); `IdentityGraph::with_programs` folds the mapped program via
`collect_map`; styletrace takes a `TraceSources { staged, programs }`
bundle and walks the mapped program via the shared `trace_program`
(today's walk body, unmodified). Anything unmapped — streamed,
panicked, or (trace only) error-bearing — falls back to parsing bytes,
reproducing today's failure diagnostics identically (C1 keep-alive
preserved: omitted errored entries re-parse and fail exactly as before).

No visitor was narrowed and no walk was skipped: diagnostics, harvest,
and proof observe the same programs and emit the same facts. The only
behavioral delta is fewer `Parser::parse` calls — less input, per the
brief. No pivot; one mechanism throughout.

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874`
(`git rev-parse HEAD` verified at start; docs-only filing atop wave-1
landing `0a7330c76`, `packages/` tree identical).

```
.../modules/atomic/src/extract/identity.rs         | 43 +++++++++--
.../modules/atomic/src/extract/identity_map.rs     |  3 +-
.../modules/atomic/src/extract/identity_tests.rs   | 68 +++++++++++++++++
.../reference-rs/modules/atomic/src/hosts/mod.rs   | 17 ++++-
packages/reference-rs/modules/atomic/src/lib.rs    | 47 +++++++++++-
.../modules/styletrace/src/analysis/analyzer.rs    | 12 +--
.../modules/styletrace/src/analysis/mod.rs         |  2 +-
.../modules/styletrace/src/analysis/parser/mod.rs  | 33 ++++++--
.../modules/styletrace/src/analysis/surface.rs     | 35 +++++++--
.../reference-rs/modules/styletrace/src/lib.rs     |  2 +-
.../modules/styletrace/src/tests/owned_props.rs    | 88 +++++++++++++++++++++-
.../modules/styletrace/src/tests/trace_gate.rs     |  7 +-
12 files changed, 316 insertions(+), 41 deletions(-)
```

Notes:

- `dist/*.mjs` wrappers were missing in the fresh worktree; ran
  `build:js` once for bench harness resolution (gitignored, not in diff).
- `dist/native/*.node` was moved aside during the bench session so a
  broken arm override would fail loudly instead of silently loading
  dist; arms swapped per run via `REFERENCE_UI_NATIVE_PATH`
  (loader-resolved, env inherited by bench workers). Restored after.

## Artifacts

- base `.node`: `2571e81f4018dc930a250759296fe1dadba12f43021bf2db4c5e047f55a207a3`
- cand `.node`: `5fce34a8a1f3ce12c67753a4dbe277122247f924e5a187054956934a6d6d7d44`
- Harness never rebuilt mid-set: both `.node` sha256 verified identical
  before the first and after the last of all 45 timed runs.

## Correctness (rule 1)

- (a) `pnpm agentrs c atomic`: **568 passed, 0 failed** (incl. new
  `reused_programs_answer_like_fresh_parses`, which also pins the
  broken-file fallback path). `pnpm agentrs c styletrace`: 30 passed,
  18 failed — byte-identical failure set on pristine HEAD (proven via
  stash A/B): all 18 need the gitignored `.reference-ui/` declaration
  fixtures absent in a fresh worktree; **zero new reds**. New
  `reused_programs_match_fresh_parse_trace` (entry + edge reuse)
  passes. `pnpm agentrs q` on all touched files: **0 code violations**.
- (b) Byte-identical outputs base vs cand on all four scales (hashes
  also match the filed wave-1 pins bit-for-bit):

| scale      | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| ---------- | ------------------------------ | ------------------------------------ |
| enterprise | `7ec827fb…10dcea`              | `718d19e4…8918`                      |
| small      | `ecdec1e8…a2973`               | `ad9194f4…4d41`                      |
| medium     | `37f2ef5b…19fe`                | `54735e4d…fe7ce`                     |
| churn      | `1aad4978…ec05`                | `e1349305…8cdb`                      |

- (c) Determinism: all 39 enterprise runs (warmups + both pair
  sessions, both arms) plus all 6 small/medium/churn runs produced
  identical output hashes. cssCalls/bytes EXACT on every run
  (7527/3000 enterprise).

## Mechanism counts (not just ms)

Static byte census of the enterprise seed-7 load (15,123 files),
replicating the three Rust byte gates exactly
(`streaming_candidate`, `trace_skip`, identity relative-import
closure with `identity.rs` probe order):

| parse consumer   | files | bytes parsed |
| ---------------- | ----- | ------------ |
| main retained    | 3,123 | 2,689,618    |
| streamed transient (stays) | 12,000 | 1,669,350 |
| styletrace re-parse (eliminated) | 3,123 | 2,689,618 |
| identity re-parse (eliminated) | 119 | 896,004 |

- Total parsed base 7,944,590 → cand 4,358,968 bytes:
  **−3,585,622 bytes (−45.1%)**.
- `Parser::parse` calls base 18,365 → cand 15,123:
  **−3,242 calls** (3,123 styletrace + 119 identity).
- Fallback coverage on this load: **0 files** — every styletrace
  entry and every identity query target is retained, unpanicked, and
  (trace) error-free, so every re-parse is eliminated, none fall back.
- Flame budget (`enterprise-flame3`, compile scope): `Parser::parse`
  callers are 23wt main + 14wt streamed + **13wt styletrace + 8wt
  identity** = 58wt; ceiling for this mechanism ≈ **21wt (~21ms)**.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. Pair order alternated (B/C, C/B, …).
Two unscored warmups per arm preceded the scored session.

| pair | base syncMs | cand syncMs | Δ ms   | Δ %    |
| ---- | ----------- | ----------- | ------ | ------ |
| 1    | 1186.94     | 1190.03     | +3.09  | +0.26% |
| 2    | 1156.28     | 1178.45     | +22.17 | +1.92% |
| 3    | 1195.82     | 1222.32     | +26.50 | +2.22% |
| 4    | 1179.57     | 1218.02     | +38.45 | +3.26% |
| 5    | 1193.84     | 1128.62     | −65.22 | −5.46% |
| 6    | 1157.64     | 1214.87     | +57.23 | +4.94% |
| 7    | 1210.48     | 1179.52     | −30.96 | −2.56% |
| 8    | 1177.16     | 1179.76     | +2.60  | +0.22% |

- base median: **1183.26 ms**; cand median: **1184.89 ms**
- median Δ: **+1.64 ms (+0.14%)**, 2/8 pairs favor candidate.
- Excluding run 1: base 1179.57, cand 1179.76, Δ **+0.19 ms** —
  result stands (at zero).

Box conditions (why this timing is noise, not signal): pair spread
runs −65 to +57 ms against a ~21 ms predicted effect. An earlier
8-pair session in the same hold was discarded after two runaway
sibling `find /` scans (PIDs 21141, 82942, ~68% CPU combined) were
found mid-session and terminated; the scored session still ran under
heavy user/system load (screensharingd 145% CPU, browsers, agents).
Per-pair deltas flip sign run to run with no consistent direction;
the medians measure the box, not the arms.

Other scales, single samples each (directional only):

| scale  | base syncMs | cand syncMs | Δ           |
| ------ | ----------- | ----------- | ----------- |
| small  | 498.95      | 300.24      | −198.7      |
| medium | 274.31      | 203.66      | −70.7       |
| churn  | 2819.53     | 2630.56     | −189.0      |

Caveat: single-sample small/medium/churn deltas carry
startup/scan noise and are reported for completeness, not claimed
(same caveat as the wave-1 canon report). Outputs byte-identical.

## Verdict

**BANK (delta +1.6 ms / +0.14% sub-bar; proven-identical diet with numbers)**

The diet is real and provably identical — 45.1% fewer bytes parsed,
3,242 fewer `Parser::parse` calls with zero fallbacks on this load,
byte-identity on 4/4 scales, determinism across 39 enterprise runs,
green suites with zero new reds — but tonight's box cannot resolve
its ~21 ms ceiling (pair spread ±65 ms under documented external
contention). CUT is refused: the ceiling does not bar; the stopwatch
does. Recommend re-confirm on a quiet box; the combined set should
re-time this rather than re-prove it.
