# Fasthull 3a implementer log — lane A (C3 single read)

Implementer record. Steps 1→2→3 sequenced with a bench checkpoint each.
Tree `voyage/hyperspace-perf-3-a`, seed 7. Box shared with 5 siblings; all
walls carry contention noise (loads noted per run). Nothing committed.

Baselines (given): small 197ms/129.6MiB, medium 372ms/155.3MiB,
enterprise 2.90s/420.1MiB (all contended); churn 4.11s/602.8MiB.

## Step 1: async scan (scanner, base, runner)

`fg.async` + hand-rolled pool (64) + index-tagged order restore, null-skip
preserved. `scanForFragments`/`scanFragmentFiles` async; planner awaits.
Mocks stay green (`await` on array is identity).

- F1 (parallel floor, enterprise kept repo, fresh-process alternating ×4):
  serial 235–239 (med 237) vs parallel 277–287 (med 280), matches
  identical + same order (2). **F1 = 280ms > serial 237ms: step 1 REGRESSES
  the enterprise scan ~+43ms on warm cache.** Concurrency sweep (4–512) +
  UV_THREADPOOL_SIZE=64 confirm async never beats serial sync here
  (threadpool-hop overhead dominates warm reads).
- Medium same-window: sync-scanner control 206ms/133.8 (load 3.0) vs
  parallel 201ms/128.8 (load 2.9) → Δ≈0 (1250 files; predicted +4ms in noise).
- Enterprise full-sync: 1.93s/375.6 (load 4.6), bytes identical.
- RECOMMENDATION to lead/reviewer: narrow step 1 (serial sync reads inside
  the async shape, or revert the read path) — the measurement this step was
  ordered to take. Kept spec-literal per orders; +43ms stands inside the arc.

## Step 2: single read (retention + union-fill)

One glob (`dot:true`, `node_modules`-only ignore) → TS IGNORE-dir +
extension mirror → read once → matches (dot-emulation + d.ts rule) +
`scannedSources` into `PreparedFragments` → non-empty `files` in the native
request (omitted when empty); artifact stays logical (`files: undefined`).
Native `union_sources`: provided map (scope-filtered, provided wins) + disk
candidate-path walk + read only missing. Frozen contract gains additive
`VirtualSource` + `files?`; neo seam carries `files` structurally (dist
trails source, same as `include`/`logs` precedent). `worker-phases.ts` gets
the same 2 lines (lead ruling: legitimate measurement-mirror fix, KEEP).

- A (JSON authoring): stringify 7.8ms measured + serde/napi/clones ~15ms
  bounded (JSON.parse 5.2 lower bound on the 5.85MB payload) → **A ≈ 23ms,
  no flag** (< 60). Union stat-walk 38ms measured (files+realRoot minus
  files+emptyRoot, open scope; matches profiler's 44ms stat basis).
- Native-phase A/B, real spec, kept repo, alternating ×4: 1367ms → 1209ms
  (−158ms warm-steady), sheet byte-identical (2,867,925 B = profiler FULL).
- Retention exactness: 15122 files / 4.16 MiB = profiler census exactly;
  compile-request.json 36KB, no `files` key.
- Medium 202ms/133.4 (load 2.7), enterprise 1.52s/361.8 (load 2.6); bytes
  identical both scales. True fresh prize ≈ 271 − (23+38) ≈ 210ms
  (observed full-sync −410ms confounded by contention relief 4.6→2.6).
- NOTE matches ⊆ retention now (single scan + emulation): IGNORE-dir or
  non-source-extension files no longer match as fragments. Spec'd by
  construction; native exact via union; agentneo 173/173 (no such fixture).
- Verified empirically: fg negation-only → [] (ruling-e fallback engages);
  rootless + relative patterns can't match absolute provided paths (native
  tries relative forms only with a root) — differential uses leading-**
  patterns for the strict arms. Scripts in /tmp (`lanea-measure-a*.mjs`).

## Step 3: stream-with-staging, LAZY refinement (DEVIATION D1)

Gate `styling_skip && string_skip` → transient parse (errors carried
in-order as message+offset pairs, panicked mirrored, constants merged in
source order, record+bag staged) → drop program+allocator. Retained files
unchanged. AnalysisInput built directly (retained real programs, streamed
share one dummy empty parse — provably unread via the content gate; slots
stable). `collect_pool` over retained parse + aligned mask. Lane B hunk
(`hosts::resolve` call) byte-identical.

**D1 — eager→lazy deviation (flagged for reviewer).** Spec said EAGER
RefinedFile, but eager needs `scope::collect` against the FINAL project
(`strip_stale` mutation set + ProjectBag capture baking read final merged
state) while finality needs all constants merged first → eager costs a
SECOND parse per streamed file (+65ms CPU, net-negative, contradicts the
~10ms yield). Implemented LAZY: first import re-parses transiently through
the identical on-demand `collect_origin` retained files use. Same RSS
(arenas never co-resident), ~0 CPU (dead utils have no importers),
self-correcting (real refs computed; no bytes-proof trust), smaller diff.
Recommend keeping lazy; eager alternative documented here for the ruling.

- (iii)-2 reinterpretation: a "streamed barrel" is unwritable (export-from
  needs quotes → retained). Test pins the meaningful shape: live →
  retained barrel → streamed target. Noted in-test.
- Gate yield on enterprise load: 12000/15122 stream (exact dead census;
  all 3122 live retained). Scored RSS flat (architect warned carry
  uncertain); true-peak drop is structural (per-file transient drop).
- Medium 194ms/133.0 (load 4.0), enterprise 1.47s/361.2 (load 4.0); bytes
  identical. Step-3 Δ ≈ −50ms sync (noisy), ~0 scored RSS.
- `oxc_diagnostics` dep kept per lead's conditional: no re-export exists
  in oxc 0.115 (verified by grep); same-pin additive; lock +1 edge. The
  closure param type cannot be inferred, hence the direct dep.

## Stability (this tree)

- `agentrs c atomic`: 541/541 (incl. 3 new union + 5 new stream tests).
- `agentrs v atomic`: 300/301 — only SITE-54 (pre-existing; brief-classified
  shared-box flake). Exoneration without stash: SITE-54 compiles files-less
  (union unreachable); the disk-scan refactor is verbatim-identical logic
  (const hoist); union only ADDS sources but the failure is a MISSING want;
  all other disk-scan cases + goldens green (300). Same single failure ×4.
- `agentrs v contracts`: 13/13 (additive contract safe).
- `agentrs q` (6 RS files): 0 violations; 3 warnings (lib.rs 412 +
  run_parse_phase 116, resolver 422 — length advisories; 116 under every
  reading of the limit; lib.rs net +6 vs pre-change via stream.rs split).
- Neo unit 235/235 (31 files, incl. 4 new differential + 10 base); tsc
  clean; `agentneo q`: scanner 0 warnings after split (rest pre-existing /
  advisory); `agentneo run`: 173/173.
- Churn: 3.99s/623.8 (load 2.9) vs base 4.11s/602.8 (contended); bytes
  EXACT (8,402,765 total). RSS +21MB single-run noise, noted not claimed.
- styles.css 2.7 MiB enterprise at every checkpoint (no regrowth);
  compile-request.json logical; reports/latest left dirty (lead restores).

## File list (this diff; no commits)

Neo: `fragments/lib/scanner.ts`, `fragments/lib/index.ts`,
`fragments/lib/runner.ts`, `fragments/base/index.ts`,
`fragments/base/index.test.ts`, `fragments/index.ts`, `sync/index.ts`,
`sync/native.ts`, `benchmark/deepsee/worker-phases.ts` (2 lines, ruled);
new `fragments/base/scan-retention.test.ts`. RS: `contracts/types.ts`,
workspace `Cargo.toml`/`Cargo.lock`, `modules/atomic/Cargo.toml`,
`modules/atomic/src/{lib,stream,sources}.rs`,
`extract/resolver/mod.rs`, `tests/mod.rs`; new `tests/stream.rs`.
This log. Untouched: `hosts/*`, `analysis/*`, `compile-files.ts`,
`core/*`, `package.json`, lane B hunk.

## Reviewer pointers

1. Step-1 negative (F1=280>237): recommend narrowing; scripts in /tmp.
2. D1 lazy deviation + eager cost proof (above).
3. (iii)-2 reinterpretation (above + in-test comment).
4. Kept-per-ruling: worker-phases.ts, oxc_diagnostics dep.
5. matches ⊆ retention behavior note (above).
6. SITE-54 exoneration (above). 7. Kept repos in $TMPDIR
   (neo-bench-A3bDYC/-pYUMYx/-WVMKAj, mine) + /tmp/lanea-*.mjs for re-checks.

Implementer: DONE — steps 1→2→3 sequenced (+43ms / −210ms / −50ms ent deltas as measured; bytes identical every checkpoint; lazy deviation D1 flagged).

## Fix turn

Fix-turn implementer landed all 4 reviewer items but filed no report; the
completer verified each in the diff, resolved the sign-flip, re-ran gates
+ stability, and measured RSS relief. No RS changes this turn. Box shared
with 5 siblings throughout; loads noted per run. Nothing committed.

Fixes verified in diff (file:line):
1. GAPS-1 serial narrowing — `fragments/lib/scanner.ts:89` serial
   `readAllOrdered` (exact old sync read path inside the kept async
   signature), `:166` `fg.sync` (async walker reverted).
2. GAPS-2 match-before-filter — `scanner.ts:175–183` read all candidates,
   `splitScan` matches over every success (dot/d.ts emulated, old
   semantics), retention as the IGNORE/extension-filtered subset; new arm
   `scan-retention.test.ts:220` pins a `dist/` + `.json` fragment match
   outside retention (plus `addUnretainedSignalFiles` helper at `:105`,
   extracted by the completer — the new arm pushed the describe body to
   121 lines, 1 over the gate fail line; now 118, warn-only).
3. Doc line — `fragments/lib/types.ts:44` exclude default now
   node_modules-only with d.ts emulated.
4. RSS relief — `sync/index.ts:116–117` drops `prepared.scannedSources`
   and `request.files` post-compile, pre-publish. Safe: the only
   `scannedSources` consumers are request assembly (`:111`) and the
   clearing itself; `createPortableFragmentBundle` never touches it, so
   bytes cannot move (grep-verified).

Sign-flip resolution (PLAIN ANSWER: measurement artifact, no offset —
nothing in the fix can add full-sync time, and the +35ms does not
reproduce). Probe 1, scan-level interleaved A/B on the kept 15,122-file
repo (fresh process per rep × 6 rounds, load ~2.8, `/tmp/lanea-fix-scan-ab.mjs`):
new-serial 262.1–264.1 (med 263) vs reconstructed old-parallel-pool
271.0–277.7 (med 275) vs pure serial-retained 230.9–238.6 (med 236);
matches identical (2) all arms. So the shipped fix's real scan win is
~−12ms, not −53 (the −53 was a different baseline/window); the +27ms
new-vs-pure-serial gap is per-file `splitScan` overhead (4 path checks +
15,122 `{path,content}` allocs), and candidates ≡ retained = 15,122 on
bench repos, so GAPS-2 adds ZERO reads here — no offset mechanism exists
(native input byte-identical, publish path identical modulo ref-drops).
Probe 2, phased full sync on the kept repo ×4 (load ~2.6): prepare
344–349, evaluate 6, compile 1253–1277, publish 49–52, total 1676–1699.
Compile is ~75% of the wall and swings 24ms run-to-run in one window; a
12ms scan effect is 0.7% of sync — undetectable at full-sync resolution.
Official enterprise bench (default load, NO --seed flag, 3 samples, load
~2.6): 1488/1490/1496, med 1490 vs reviewer lane med 1482 → +8ms, inside
the reviewer's ±15 spread. The +35ms was contention-window noise. Honest
loose end: phased-worker totals (~1689) sit ~200ms above same-code bench
totals (~1490) with identical output bytes (2,867,925) — same load, so
the gap is contention/harness, exact split unattributed; it doubles as
proof that ±35ms full-sync deltas are noise.

Bench + bytes: ent css 2,867,925 B EXACT, gzip 270,510 EXACT, total
3,186,613; cssCalls 7527, same plan as baseline (seed 7 default,
3,000/12,000 files). reports/latest rewritten by this run (lead restores).

RSS relief: scored peak-RSS med 339.3 MiB (329.0/339.3/350.4, 3 samples)
vs reviewer lane med ~352 (range 340–358) → −13MB at the median, ranges
barely overlapping; rssAfter med 316.5. Directionally consistent with the
relief lines, but NOT proven caused by them (3 samples, no same-window
no-relief control; if peak lands at compile pre-publish, relief cannot
move peak and this is window noise). MOVED, with that caveat.

Stability (this turn): neo unit 236/236 (31 files, +1 new arm); explicit
differential 5/5 + base 10/10; `agentrs c atomic` 541/541; `v atomic`
300/301 with ONLY SITE-54 red (pre-existing, exonerated — not chased);
`v contracts` 13/13; tsc clean; `agentneo q` on the 4 fix files 0 errors
(1 warn-only, the 118-line describe); `agentrs q` skipped — zero RS files
changed this turn (reviewer's 0-violation gate on the RS files stands).

FixTurn: DONE — 4 fixes verified + gate green, sign-flip resolved as contention noise (scan −12ms real, full-sync +8ms inside spread), bytes exact, RSS med −13MB.
