# Fasthull 3a profile — lane A "single read" (C3) evidence

Profiler memo. Read-only: no product edits. All numbers firsthand in this
tree (`voyage/hyperspace-perf-3-a`), seed 7. Probes live in `/tmp`
(`probe-prepare.mjs`, `fresh-scan.mjs`, `mine-sample*.mjs`, `ablate.mjs`,
`sample-dir.mjs`); this file is the only tree write.

## Conditions and method

- Box: x86_64 mac, 5 sibling lanes concurrent. Load swung 6 → 27 during
  the session (sibling `deepsee burndown` + `agentneo` Playwright observed
  on `ps`). Wall clocks carry ±10–40% contention noise; tick shapes and
  same-window ratios do not. Every wall claim below is a median of
  interleaved runs or flagged with its spread.
- Quiet anchor (this tree, `deepsee all --scale enterprise`): sync
  1804ms, native.compile 1376ms, prepare 344ms, worker RSS 322.9 /
  parent-polled 379.1 MiB, 1438 non-idle ticks (1.255ms/tick). Matches
  recon run-2 within 2% (1790 / 341 / 396.7) — the box was quiet then.
- Ablation design (no generator/scale edits): generate ONE enterprise repo
  to `/tmp`, `cp -r` it, delete files to make LIVE (`src/util/` removed,
  3,123 files) and DEAD (`src/ui*` + `src/recipes/` removed, 12,003
  files). FULL/LIVE/DEAD sampled back-to-back in one window (`sample`
  + parent-RSS poll, tree's `worker-phases.ts` unmodified), then mined
  with the same scripts. Dead/live split per walk = same-window tick
  ratio × quiet-FULL walk total (ratios are contention-robust; absolute
  contended ticks are not — IO waits inflated ~2× in the loaded window).
- `sample-parse.ts` in this tree is pre-fix (serde rule above scan/read,
  `:77` vs `:79`): bucket labels are NOT trusted anywhere below. Every
  phase number is raw-stack mining (inclusive/outermost accounting).

## (a) TS prepare split — MEASURED, recon reproduced + corrected

Scan replica verified set-equal to `scanForFragments` on every run
(`setEqual=true`, 2/15122 hits). In-sync prepare runs ONCE per fresh
process, so the fresh-process column is the honest lever basis.

| scale | | fresh (1st run) | steady (10th) | recon claim |
| --- | --- | --- | --- | --- |
| medium (1,276 files) | fg | 6.6 | 2.2 | 8.4 |
| | serial reads | 27.5 | 13.3 | 24.4 |
| | needle+regex | 0.4 | 0.3 | — |
| | scan total | 34.9 | 16.0 | ~33 |
| | prepare (deepsee timer) | 44.7 | 23.5 | 44 |
| enterprise (15,122) | fg | 35.2 | 21.9 | — |
| | serial reads | 322.7 | 199.8 | ~100-150 slack of 341 |
| | needle+regex | 2.5 | 2.0 | — |
| | scan total | 362.9 | 225.0 | — |
| | prepare (deepsee/ablate) | 344 / 360 | 229.6 | 341 |

All ms. `bundleFragments` (2 fragment files): ~9–10ms first run.

- Recon's medium split (fg 8.4 + reads 24.4 of 44) REPRODUCED within
  noise (mine: 6.6 + 27.5 of 44.7). The steady-state numbers are ~2×
  lower — first-touch premium (dentry + libuv + JIT), not cache: the
  generator just wrote every byte.
- Per-file read model (measured): 21.6µs/file medium, 21.3µs/file
  enterprise — identical. Cost is per-call overhead
  (open+read+close+alloc × N), not bytes (4.16 MiB). This parallelizes
  to the concurrency floor; bytes are irrelevant.
- Ablation walls (interleaved medians, contended): prepare FULL 360 /
  LIVE 85 / DEAD 276. Dead files = 275ms of 360ms prepare, additive
  (FULL−LIVE = 275 ≈ DEAD 276). Dead TS-read total ≈ 240–250ms fresh.
- Correction to recon: the serial-read TOTAL is 200–325ms fresh
  enterprise (not ~100–150 — that read as the slack, implying a
  ~170–220ms parallel floor). Slack = 320 − floor; the 21µs/file model
  says the floor should be far lower than 170ms, but the floor is
  UNMEASURED — implementer proves it (15k-promise churn + libuv +
  order-restore concat). Step-1 saves ≈ 150–260ms on a 30–100ms floor.

## (b) Native IO share — MEASURED, recon confirmed

Quiet deepsee enterprise (mine, 1.255ms/tick):

- `sources::collect` subtree: 216t ≈ 271ms (recon: ~294). Of which
  `read_to_string::inner` leaves 195t, `scan_dir`-owned `stat` 35t
  (≈44ms), open 129t. Misattribution confirmed firsthand: every one of
  these stacks passes a `to_string` frame and buckets as `serde`
  (serde bucket 217t ≈ collect 216t + edge reads).
- Ladder-edge reads (`AtomicFs → DiskFs → read_to_string → open`): 41t
  ≈ 51ms (recon: ~40 ticks). C2's, not C3's — but C3's `request.files`
  already covers the serve-from-staged half for compile-set targets.
- True codec (serde/simd_json/ryu/itoa/JSON::Parse/Value::serial/
  format_escaped frames): 18t ≈ 23ms (recon: ~15). Spent. Do not touch.
- `stat` ownership: ladder-resolve 65t (C2's) + `is_file` 46t
  (`entry_paths`, hosts/entries.rs:16 — stats every file the scan
  already found) + scan_dir 35t. TS `fg` stats ≈ 0 (Dirent-based).
- Medium: 174 non-idle ticks — too coarse for walk mining, shape only
  (serde bucket 15t ≈ 21ms ≈ all-IO, consistent with scaled enterprise).

Variant ticks (contended window, ratios robust): collect FULL 440 /
LIVE 78 / DEAD 435 → dead ≈ 85% of native IO ticks. Dead native IO
quiet ≈ 0.85 × 216t ≈ 183t ≈ 230ms; live ≈ 33t ≈ 40ms.
C3 step-2 (native skips scan+read via `request.files`) removes the whole
216t ≈ 271ms, minus JSON authoring cost A (UNMEASURED, est 10–30ms for
15k path+content strings across N-API — implementer measures; the
contract exists: types.rs:33, js/types.ts:60, preferred at
sources.rs:22–28, clones at sources.rs:50).

## (c) THE WALK SPLIT — MEASURED in-lane

Method: same-window outermost-entry ticks (FULL / LIVE / DEAD) →
dead-share ratio → × quiet-FULL walk total. Zero-DEAD entries are
PROVEN gates (0 ticks over 12k files), not reasoning.

| walk (outermost entry) | FULL | LIVE | DEAD | dead share | quiet dead-ms |
| --- | --- | --- | --- | --- | --- |
| `Parser::parse` | 90 | 43 | 63 | 59% | ~55–70 |
| `Bump::drop` | 12 | 6 | 4 | 40% | ~5 |
| `extract_with_context` | 96 | 101 | 0 | 0 (GATED) | 0 |
| `scope::collect_inner` | 16 | 13 | 0 | 0 (GATED) | 0 |
| `bindings` + `IdentityGraph::new` | 11 | 7 | 6 | ~85% of 4t identity | ~4–5 |
| constants collect | 18 | 6 | 21 | 78% | ~11–25 |
| constants merge + drop | 11 | 0 | 14 | ~85% | ~14–18 |
| `ValueGraph::new` | 50 | 10 | 38 | 79% | ~32 |
| `ValueGraph` drop | 16 | 3 | 15 | 83% | ~21 |
| `resolve_file_imports` | 191 | 198 | 0 | 0 (live-only) | 0 |
| `analysis::analyze` | 30 | 20 | ~0 | ~0 (GATED) | 0–5 |
| `partition` | 26 | 22 | 0 | ~0 (fact-driven) | 0–5 |
| `render_session` | 46 | 52 | 0 | 0 (fact-driven) | 0 |
| `line_col` (per-want sites) | 34 | 38 | 0 | 0 (want-driven) | 0 |
| `collect_pool` | 30 | 34 | 0 | 0 (GATED) | 0 |
| `mint` | 13 | 13 | 0 | 0 | 0 |
| `hosts::resolve` | 196 | 56 | 122 | 69% (C1's) | ~110–130 |
| `AssembleCtx::finish` | 399 | 362 | 0 | 0 | 0 |
| emit | 93 | 63 | 0 | 0 | 0 |

Ticks are contended-window; quiet-ms = ratio × quiet total × 1.255.
Cross-checks: FULL ≈ LIVE + DEAD ticks (2264 vs 1194+1130 = 2324, 3%
— theme/config double-counted); `ValueGraph::new` exactly additive
(50 = 10+38); quiet LIVE wall run1 1045ms ≈ implied quiet
1804 − 800 + 50 (the interleaved LIVE median was contention-poisoned;
run1 was the clean window — walls alone were inconclusive, ticks rule).

Gate table (file:line, read-only verified):

- GATED already (W1, 0 dead ticks — nothing for C3 to take):
  `extract_all_sources` lib.rs:269–279 via `styling_skip` lib.rs:285–290
  (covers scope, extract, per-file resolve at lib.rs:375, bindings);
  `analyze` analysis/mod.rs:109–118 via `styling_skip` L113 (only the
  15k skip-checks + `for_compile` vec, mod.rs:51–74, remain — ~0t);
  `collect_pool` literals.rs:68–78 via `string_skip` mask lib.rs:212–216,
  294–296 (dead files are quote-free — 0t).
- UNGATED, C3's (visit all 15k):
  parse loop lib.rs:159–164 (`parse_source` L311–320) — dead ~55–70ms,
  STAYS under streaming (errors kept; CPU unchanged, arenas freed);
  `collect_project_constants` lib.rs:346–362 (`collect_local_constants`
  collect.rs:35–51 + `merge` index.rs:243–257) — dead ~25–40ms, SKIPPED;
  `ValueGraph::new` resolver/mod.rs:92–123 (`ModuleRecord::collect`
  module-graph/src/record/mod.rs:148 + SECOND `collect_local_constants`
  + programs map + `AtomicFs::new` source.rs:30–42) — dead ~32ms, SKIPPED;
  `ValueGraph` drop (15k records+bags teardown) — dead ~21ms, SKIPPED;
  `IdentityGraph::new` identity.rs:46–56 (15k normalize+insert) — dead
  ~4–5ms, SKIPPED; `report_parse_errors` lib.rs:322–344 (kept by design,
  ~0t on empty vecs); partition catalog lib.rs:125–134 (~0–2t).
- UNGATED, C1's (not C3's): `hosts::resolve` hosts/mod.rs:58–121
  (`entry_paths` is_file × 15k entries.rs:11–17 ≈ 25–35t + staged map +
  styletrace re-parse) — dead ~110–130ms. Consistent with B4's proven
  −130ms. C3 must not touch entries; shared-file flag stands.

Step-3 CPU savings (skip staging/record/merge/identity, stream parses):
≈ 60–80t ≈ 75–100ms quiet. Parse CPU (~65ms) stays by design.

## (d) Census — MEASURED, premises confirmed

Generated enterprise repo (seed 7): 15,123 files on disk, 15,122
scanned (`ui.config.ts` unmatched by include globs), 4256.8 KiB.

- `src/util/`: 12,000 files, 1630.2 KiB (38% of bytes, 79% of files).
  0 files contain `css(`. 0 importers of `util/` anywhere. 24,000
  `FACTOR_n` occurrences = 2/file (decl + use): 1 scalar per dead file.
  Dead file = 128 B; live component ≈ 833 B; recipes 884.2 KiB / 120;
  tokens 13.5 KiB. 12,000-dead-of-15,122 CONFIRMED.
- Soundness premise PROVEN: FULL `styles.css` == LIVE `styles.css`
  byte-identical (2,867,925 B, sha `#7ec827fb0c0c`, both copies).
  Removing all 12k dead files changes ZERO sheet bytes. DEAD css =
  12,745 B (reset+tokens+global only — no utilities, no recipes).
- Dead staging ~11 MiB (recon: project 2.4 + bags 3 + records 6):
  NOT re-measured; plausibility-checked (12k × ~200–400 B × ~3
  structures ≈ 7–14 MB). Dead TRUE-peak cost all-in measured instead:
  DEAD-alone parent peak 256 MiB vs 94 baseline ≈ 160 MB transient +
  residue (12k arenas/ASTs + constants×2 + records/bags + trace).
  C3's share (parse co-residency + staging, excl. sequential trace)
  est 100–140 MB — needs phase-aligned RSS on a DEAD variant to split
  from trace; implementer homework. Recon's −40–60 MB looks
  conservative. Scored-RSS carry: UNCERTAIN (workerPeak 252 ≈ parent
  256 → residue-heavy; scored sees end-state — S1's territory).
- Quiet-FULL peak alignment (existing timeline): parent peak 379.1 MiB
  at +1323ms, inside native.compile (+370..+1746), ~70% through native
  ≈ the pre-cliff edge. Peak-is-pre-cliff RECONFIRMED.

## Lever roll-up — the ~350–450ms stands, and is conservative

Quiet-ms, measured bases, two unmeasured offsets (F1 = parallel-read
floor, A = `request.files` JSON authoring):

| step | basis (measured) | saves |
| --- | --- | --- |
| 1. parallel TS scan | reads 320 fresh (21µs/file × 15k) | 320 − F1 (≈150–260 on F1 60–170) |
| 2. share contents | native collect 271 | 271 − A (≈240–260 on A 10–30) |
| 3. stream + skip staging | walks 75–100 (parse stays) | ≈75–100 |

Total ≈ 671 − F1 − A. Recon's 350–450 implies F1 ≈ 170–220 and walks
≈ 0–50 — both pessimistic against measurement (per-call model says
F1 ≪ 170; walks measured 75–100). Central estimate ≈ 490–600ms;
350–450 is the FLOOR unless floors disappoint. Dead-file work all-in
(TS 240 + native IO 230 + parse 65 + walks 85 + trace 120 + misc 30)
≈ 770ms quiet, consistent with quiet FULL 1804 vs clean LIVE 1045.

Risks / homework for architect + implementer (unchanged from recon,
now with numbers): (1) prove F1 with a bounded-concurrency prototype
before promising step-1; (2) measure A (`filter_virtual_sources`
clones + N-API string conversion); (3) parse CPU stays — streaming is
an RSS play (~100–140 MB true-peak est), not CPU; (4) trace is C1's
(~110–130ms) — C3 touches neither entries nor styletrace; (5) keep
`compile-request.json` logical (exclude `files`); (6) scored-RSS carry
unproven — do not promise bench RSS.

Profiler: DONE — the ~350–450ms lever stands and is conservative; measured bases support ~490–600ms with sane floors.
